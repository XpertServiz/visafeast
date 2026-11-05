import { describe, expect, it, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Runs the REAL migrations + seed in an in-process Postgres (PGlite), with tiny stand-ins for the Supabase-only bits.
const sql = (f: string) => readFileSync(join(__dirname, "..", "supabase", f), "utf8");
let db: PGlite;

const STUBS = `
create schema if not exists auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create schema if not exists storage;
create table storage.buckets (id text primary key, name text, public boolean default false);
create publication supabase_realtime;
`;

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(STUBS);
  for (const f of ["0001_core", "0002_backoffice", "0003_ledger_functions", "0004_rls", "0005_recurring_and_media"]) await db.exec(sql(`migrations/${f}.sql`));
}, 60000);

const one = async <T = Record<string, unknown>>(q: string, p: unknown[] = []) => (await db.query<T>(q, p)).rows[0];
const bal = async (code: string) => Number((await one<{ b: string }>("select balance::text b from report_balances() where code=$1", [code])).b);

describe("SQL migrations on real Postgres", () => {
  it("all four migrations apply cleanly and RLS is on for every public table", async () => {
    const r = await db.query<{ tablename: string }>("select tablename from pg_tables where schemaname='public' and not rowsecurity");
    expect(r.rows).toEqual([]);
  });

  it("seed.sql loads", async () => {
    await db.exec(sql("seed.sql"));
    const c = await one<{ n: number }>("select count(*)::int n from countries");
    expect(c.n).toBeGreaterThan(15);
    const rv = await one<{ n: number }>("select count(*)::int n from reviews");
    expect(rv.n).toBe(0);
  });

  it("invoice → payment → embassy fee: only the service fee is income, books balance", async () => {
    const acct = await one<{ id: string }>("insert into money_accounts (name,kind) values ('Bank','bank') returning id");
    const person = await one<{ id: string }>("insert into people (full_name) values ('Test Client') returning id");
    const inv = await one<{ id: string }>("insert into invoices (number, person_id, issue_date) values ('INV-1',$1,'2026-11-01') returning id", [person.id]);
    await db.query("insert into invoice_lines (invoice_id,line_type,description,amount_pkr) values ($1,'service','Fee',30000),($1,'pass_through','Embassy',20000)", [inv.id]);
    await db.query("select post_invoice($1)", [inv.id]);
    expect(await bal("1300")).toBe(50000);
    expect(await bal("4000")).toBe(30000);
    expect(await bal("2000")).toBe(20000);
    await db.query("insert into payments (invoice_id,amount_pkr,paid_on,account_id) values ($1,50000,'2026-11-02',$2)", [inv.id, acct.id]).then(async () => {
      const p = await one<{ id: string }>("select id from payments limit 1");
      await db.query("select post_payment($1)", [p.id]);
    });
    expect(await bal("1300")).toBe(0);
    expect(await bal("1100")).toBe(50000);
    expect((await one<{ status: string }>("select status from invoices where id=$1", [inv.id])).status).toBe("paid");
    const pt = await one<{ id: string }>("insert into pass_through_payments (amount_pkr,paid_on,account_id,payee) values (20000,'2026-11-03',$1,'VFS') returning id", [acct.id]);
    await db.query("select post_pass_through($1)", [pt.id]);
    expect(await bal("2000")).toBe(0);
    const prof = await one<{ income: string; expenses: string; profit: string }>("select income::text, expenses::text, profit::text from report_profit('2026-11-01','2026-11-30')");
    expect(Number(prof.income)).toBe(30000);
    expect(Number(prof.expenses)).toBe(0);
    const ok = await one<{ ok: boolean }>("select ok from ledger_is_balanced()");
    expect(ok.ok).toBe(true);
  });

  it("an unbalanced entry is refused", async () => {
    await expect(db.query(`select post_entries('2026-11-04','[{"code":"1000","debit":100},{"code":"4000","credit":90}]'::jsonb,'t',null)`)).rejects.toThrow(/Unbalanced/);
  });

  it("ledger rows cannot be edited or deleted; reversal works", async () => {
    await expect(db.query("update ledger_entries set debit_pkr = 1")).rejects.toThrow(/cannot be edited/);
    await expect(db.query("delete from ledger_entries")).rejects.toThrow(/cannot be edited/);
    const g = await one<{ entry_group: string }>("select entry_group from ledger_entries where ledger_code='4000' limit 1");
    await db.query("select reverse_group($1,'2026-11-05')", [g.entry_group]);
    expect((await one<{ ok: boolean }>("select ok from ledger_is_balanced()")).ok).toBe(true);
  });

  it("a closed month refuses new postings", async () => {
    await db.query("insert into period_locks (month) values ('2026-10-01')");
    await expect(db.query(`select post_entries('2026-10-15','[{"code":"1000","debit":5},{"code":"4000","credit":5}]'::jsonb,'t',null)`)).rejects.toThrow(/closed/);
  });

  it("expense and refund and owner drawings post balanced", async () => {
    const a = await one<{ id: string }>("select id from money_accounts limit 1");
    const cat = await one<{ id: string }>("select id from expense_categories where name='Rent'");
    const e = await one<{ id: string }>("insert into expenses (category_id,amount_pkr,spent_on,account_id,vendor) values ($1,8000,'2026-11-06',$2,'Landlord') returning id", [cat.id, a.id]);
    await db.query("select post_expense($1)", [e.id]);
    await db.query("select post_refund('service',1000,$1,'2026-11-06','Refund')", [a.id]);
    await db.query("select post_owner('drawings',2000,$1,'2026-11-06')", [a.id]);
    expect((await one<{ ok: boolean }>("select ok from ledger_is_balanced()")).ok).toBe(true);
    expect(await bal("5000")).toBe(8000);
  });

  it("partner commission accrues when an invoice is fully paid", async () => {
    const a = await one<{ id: string }>("select id from money_accounts limit 1");
    const partner = await one<{ id: string }>("insert into partners (name,commission_type,commission_value) values ('P','percent',10) returning id");
    const inv = await one<{ id: string }>("insert into invoices (number, issue_date, partner_id) values ('INV-2','2026-11-07',$1) returning id", [partner.id]);
    await db.query("insert into invoice_lines (invoice_id,line_type,amount_pkr) values ($1,'service',10000)", [inv.id]);
    await db.query("select post_invoice($1)", [inv.id]);
    const p = await one<{ id: string }>("insert into payments (invoice_id,amount_pkr,paid_on,account_id) values ($1,10000,'2026-11-07',$2) returning id", [inv.id, a.id]);
    await db.query("select post_payment($1)", [p.id]);
    expect(await bal("2100")).toBe(1000);
    const c = await one<{ id: string }>("select id from commissions limit 1");
    await db.query("select post_commission_paid($1,$2,'2026-11-08')", [c.id, a.id]);
    expect(await bal("2100")).toBe(0);
    expect((await one<{ ok: boolean }>("select ok from ledger_is_balanced()")).ok).toBe(true);
  });

  it("recurring expense copies point back to their template", async () => {
    const a = await one<{ id: string }>("select id from money_accounts limit 1");
    const cat = await one<{ id: string }>("select id from expense_categories where name='Internet & phone'");
    const t = await one<{ id: string }>("insert into expenses (category_id,amount_pkr,spent_on,account_id,recurring) values ($1,3000,'2026-08-05',$2,'monthly') returning id", [cat.id, a.id]);
    const c = await one<{ id: string }>("insert into expenses (category_id,amount_pkr,spent_on,account_id,recurring,recurring_of) values ($1,3000,'2026-11-05',$2,'none',$3) returning id", [cat.id, a.id, t.id]);
    await db.query("select post_expense($1)", [c.id]);
    const n = await one<{ n: number }>("select count(*)::int n from expenses where recurring_of = $1", [t.id]);
    expect(n.n).toBe(1);
    expect((await one<{ ok: boolean }>("select ok from ledger_is_balanced()")).ok).toBe(true);
  });
});
