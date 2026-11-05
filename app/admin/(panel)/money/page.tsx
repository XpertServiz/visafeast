import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { db, today, startOfMonth } from "@/lib/server/admin-data";
import { Badge, Card, Empty, Field, Grid, Stat, Title, day, pkr } from "@/components/admin/ui";
import { waLink } from "@/config/site";
import { addExpense, cancelInvoice, closeMonth, createInvoice, markCommissionPaid, receivePayment, takeMoneyOut } from "../../actions";

export const dynamic = "force-dynamic";

export default async function Money({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const admin = (await getAdmin())!;
  if (!can.money(admin.role)) redirect("/admin");
  const sp = await searchParams;
  const from = sp.from || startOfMonth(), to = sp.to || today();
  const d = db();
  const owner = can.reports(admin.role);
  const [accounts, cats, invoices, people, cases, commissions, profit, balances, partners, payments] = await Promise.all([
    d.from("money_accounts").select("id,name,kind").eq("is_active", true),
    d.from("expense_categories").select("id,name").order("name"),
    d.from("invoices").select("id,number,status,due_date,issue_date,person:people(full_name,whatsapp),lines:invoice_lines(line_type,amount_pkr)").order("issue_date", { ascending: false }).limit(40),
    d.from("people").select("id,full_name").order("created_at", { ascending: false }).limit(200),
    d.from("cases").select("id,ref,person_id").is("deleted_at", null).order("created_at", { ascending: false }).limit(100),
    owner ? d.from("commissions").select("id,amount_pkr,partner:partners(name)").eq("status", "due") : Promise.resolve({ data: [] }),
    owner ? d.rpc("report_profit", { p_from: from, p_to: to }) : Promise.resolve({ data: null }),
    owner ? d.rpc("report_balances") : Promise.resolve({ data: null }),
    d.from("partners").select("id,name"),
    d.from("payments").select("id,amount_pkr,paid_on,method,person:people(full_name),invoice:invoices(number)").order("paid_on", { ascending: false }).limit(15),
  ]);
  type Inv = { id: string; number: string; status: string; due_date: string | null; issue_date: string; person: { full_name: string; whatsapp: string | null } | null; lines: { line_type: string; amount_pkr: number }[] };
  const inv = (invoices.data ?? []) as unknown as Inv[];
  const total = (i: Inv) => i.lines.reduce((s, l) => s + (l.line_type === "discount" ? -l.amount_pkr : l.amount_pkr), 0);
  const p = (profit.data as { income: number; expenses: number; profit: number }[] | null)?.[0];
  const bal = (balances.data ?? []) as { code: string; name: string; balance: number }[];
  const b = (code: string) => bal.find((x) => x.code === code)?.balance ?? 0;
  const noAccounts = !accounts.data?.length;

  return (
    <>
      <Title sub="Invoices, payments and expenses. The books are kept automatically in the background.">Money</Title>
      {noAccounts && <Card tone="warn"><p style={{ margin: 0 }}>First, add where your money is kept (cash, a bank account, JazzCash…) in <a href="/admin/settings">Settings</a>.</p></Card>}
      {owner && p && (
        <div style={{ marginBottom: 20 }}>
          <form style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}><input type="date" name="from" defaultValue={from} className="field" style={{ width: 170 }} aria-label="From" /><input type="date" name="to" defaultValue={to} className="field" style={{ width: 170 }} aria-label="To" /><button className="btn btn-outline">Show</button>
            <a className="btn btn-outline" href={`/admin/money/export?from=${from}&to=${to}`}>Download for accountant (CSV)</a></form>
          <Grid min={180}>
            <Stat label="Money in (fees earned)" value={pkr(p.income)} /><Stat label="Money out" value={pkr(p.expenses)} /><Stat label="Profit" value={pkr(p.profit)} tone={p.profit >= 0 ? "ok" : "bad"} />
            <Stat label="Who owes us" value={pkr(b("1300"))} /><Stat label="Client money held" value={pkr(b("2000"))} /><Stat label="Cash + bank + wallets" value={pkr(b("1000") + b("1100") + b("1200"))} />
          </Grid>
        </div>
      )}

      <Grid min={340}>
        <Card id="payment" title="Receive a payment">
          <form action={receivePayment} style={{ display: "grid", gap: 10 }}>
            <Field label="Invoice (optional — leave empty for an advance)"><select name="invoice_id" className="field"><option value="">— none —</option>{inv.filter((i) => ["sent", "part_paid", "overdue"].includes(i.status)).map((i) => <option key={i.id} value={i.id}>{i.number} · {i.person?.full_name} · {pkr(total(i))}</option>)}</select></Field>
            <Field label="Amount (PKR)"><input name="amount" type="number" min={1} required className="field" inputMode="numeric" /></Field>
            <Field label="Into which account"><select name="account_id" required className="field">{accounts.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
            <details><summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>More details</summary>
              <div style={{ display: "grid", gap: 10 }}>
                <Field label="How was it paid"><select name="method" className="field">{["Cash", "Bank transfer", "JazzCash", "Easypaisa", "Card", "Other"].map((m) => <option key={m}>{m}</option>)}</select></Field>
                <Field label="Date"><input name="paid_on" type="date" defaultValue={today()} className="field" /></Field>
                <Field label="Reference"><input name="reference" className="field" /></Field>
              </div></details>
            <button className="btn btn-primary" disabled={noAccounts}>Save payment</button>
          </form>
        </Card>

        <Card id="expense" title="Add an expense">
          <form action={addExpense} style={{ display: "grid", gap: 10 }}>
            <Field label="What for"><select name="category_id" required className="field">{cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Amount (PKR)"><input name="amount" type="number" min={1} required className="field" inputMode="numeric" /></Field>
            <Field label="Paid from"><select name="account_id" required className="field">{accounts.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
            <details><summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>More details</summary>
              <div style={{ display: "grid", gap: 10 }}>
                <Field label="Paid to"><input name="vendor" className="field" /></Field>
                <Field label="Date"><input name="spent_on" type="date" defaultValue={today()} className="field" /></Field>
                <Field label="Repeats"><select name="recurring" className="field"><option value="none">Does not repeat</option><option value="monthly">Every month</option><option value="yearly">Every year</option></select></Field>
                <Field label="For a client's case"><select name="case_id" className="field"><option value="">—</option>{cases.data?.map((c) => <option key={c.id} value={c.id}>{c.ref}</option>)}</select></Field>
              </div></details>
            <button className="btn btn-primary" disabled={noAccounts}>Save expense</button>
          </form>
        </Card>

        <Card id="invoice" title="New invoice">
          <form action={createInvoice} style={{ display: "grid", gap: 10 }}>
            <Field label="Client"><select name="person_id" required className="field"><option value="">Choose…</option>{people.data?.map((x) => <option key={x.id} value={x.id}>{x.full_name}</option>)}</select></Field>
            <Field label="Our service fee (PKR)"><input name="service" type="number" min={0} className="field" inputMode="numeric" /></Field>
            <Field label="Embassy / visa-centre fee we collect for the client (PKR)"><input name="pass_through" type="number" min={0} className="field" inputMode="numeric" /></Field>
            <details><summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>More details</summary>
              <div style={{ display: "grid", gap: 10 }}>
                <Field label="Discount (PKR)"><input name="discount" type="number" min={0} className="field" inputMode="numeric" /></Field>
                <Field label="For case"><select name="case_id" className="field"><option value="">—</option>{cases.data?.map((c) => <option key={c.id} value={c.id}>{c.ref}</option>)}</select></Field>
                <Field label="Due date"><input name="due_date" type="date" className="field" /></Field>
                <Field label="Language"><select name="language" className="field"><option value="en">English</option><option value="ur">اردو</option></select></Field>
                <Field label="Referral partner"><select name="partner_id" className="field"><option value="">—</option>{partners.data?.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
              </div></details>
            <button className="btn btn-primary">Create invoice</button>
          </form>
        </Card>
      </Grid>

      <h2 className="disp" style={{ margin: "28px 0 12px" }}>Invoices</h2>
      {inv.length ? <div style={{ display: "grid", gap: 10 }}>{inv.map((i) => (
        <div key={i.id} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span><b className="mono">{i.number}</b> · {i.person?.full_name}<br /><span style={{ color: "var(--muted)", fontSize: 14 }}>{day(i.issue_date)} · {pkr(total(i))}</span></span>
          <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <a className="btn btn-outline" style={{ minHeight: 44 }} href={`/admin/money/pdf?type=invoice&id=${i.id}`} target="_blank" rel="noreferrer">PDF</a>
            {i.person?.whatsapp && <a className="btn btn-wa" style={{ minHeight: 44 }} target="_blank" rel="noreferrer" href={waLink(`Assalam-o-Alaikum ${i.person.full_name}, here is your Visafeast invoice ${i.number} for ${pkr(total(i))}. Thank you.`, i.person.whatsapp)}>WhatsApp</a>}
            <Badge color={i.status === "paid" ? "var(--ok)" : i.status === "cancelled" ? "var(--muted-2)" : "var(--amber-text)"}>{i.status}</Badge>
            {owner && i.status !== "cancelled" && i.status !== "paid" && <form action={cancelInvoice}><input type="hidden" name="id" value={i.id} /><button className="btn btn-outline" style={{ minHeight: 44 }}>Cancel</button></form>}</span>
        </div>))}</div> : <Empty text="No invoices yet. Create one above." />}

      <h2 className="disp" style={{ margin: "28px 0 12px" }}>Recent payments</h2>
      {payments.data?.length ? <div style={{ display: "grid", gap: 10 }}>{(payments.data as unknown as { id: string; amount_pkr: number; paid_on: string; method: string | null; person: { full_name: string } | null; invoice: { number: string } | null }[]).map((p) => (
        <div key={p.id} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span><b>{pkr(p.amount_pkr)}</b> · {p.person?.full_name ?? "—"}<br /><span style={{ color: "var(--muted)", fontSize: 14 }}>{day(p.paid_on)} · {p.method ?? ""} {p.invoice ? `· ${p.invoice.number}` : "· advance"}</span></span>
          <a className="btn btn-outline" style={{ minHeight: 44 }} href={`/admin/money/pdf?type=receipt&id=${p.id}`} target="_blank" rel="noreferrer">Receipt PDF</a>
        </div>))}</div> : <Empty text="No payments yet." />}

      {owner && (
        <Grid min={340}>
          <div style={{ marginTop: 24 }}><Card title="Commissions to pay">
            {(commissions.data as unknown as { id: string; amount_pkr: number; partner: { name: string } | null }[])?.length ? (commissions.data as unknown as { id: string; amount_pkr: number; partner: { name: string } | null }[]).map((c) => (
              <form key={c.id} action={markCommissionPaid} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--line)", flexWrap: "wrap" }}>
                <span style={{ flex: 1 }}>{c.partner?.name} · {pkr(c.amount_pkr)}</span><input type="hidden" name="id" value={c.id} />
                <select name="account_id" className="field" style={{ width: 150 }} aria-label="Paid from">{accounts.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select><button className="btn btn-dark" style={{ minHeight: 44 }}>Mark paid</button>
              </form>)) : <Empty text="No commissions are due." />}
          </Card></div>
          <div style={{ marginTop: 24 }}><Card title="Take money out for myself / put money in">
            <form action={takeMoneyOut} style={{ display: "grid", gap: 10 }}>
              <Field label="What"><select name="kind" className="field"><option value="out">I take money out</option><option value="in">I put money in</option></select></Field>
              <Field label="Amount (PKR)"><input name="amount" type="number" min={1} required className="field" inputMode="numeric" /></Field>
              <Field label="Account"><select name="account_id" className="field">{accounts.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
              <button className="btn btn-outline">Save</button>
            </form>
          </Card></div>
          <div style={{ marginTop: 24 }}><Card title="Close a month">
            <form action={closeMonth} style={{ display: "grid", gap: 10 }}>
              <Field label="Month"><input type="month" name="month" defaultValue={today().slice(0, 7)} required className="field" /></Field>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>Closing locks that month's records. Use after you have checked your bank statement.</p>
              <button className="btn btn-outline">Close this month</button>
            </form>
          </Card></div>
        </Grid>
      )}
    </>
  );
}
