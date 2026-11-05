import "server-only";
import { serviceClient } from "../supabase";
import { esc } from "./notify";
import { siteConfig } from "@/config/site";

type Db = NonNullable<ReturnType<typeof serviceClient>>;
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Adds the monthly/yearly expenses that are due, posting each through the ledger function so the books stay balanced. */
export async function createRecurringExpenses(db: Db, now = new Date()): Promise<number> {
  const { data: templates } = await db.from("expenses").select("id,category_id,amount_pkr,spent_on,account_id,vendor,note,case_id,recurring").in("recurring", ["monthly", "yearly"]);
  let made = 0;
  for (const t of templates ?? []) {
    const start = new Date(t.spent_on + "T00:00:00Z");
    const dueDay = Math.min(start.getUTCDate(), 28);
    const monthStart = iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
    const yearStart = `${now.getUTCFullYear()}-01-01`;
    if (t.recurring === "yearly" && start.getUTCMonth() !== now.getUTCMonth()) continue;
    if (now.getUTCDate() < dueDay || t.spent_on >= monthStart) continue;
    const since = t.recurring === "yearly" ? yearStart : monthStart;
    const { count } = await db.from("expenses").select("id", { count: "exact", head: true }).eq("recurring_of", t.id).gte("spent_on", since);
    if (count) continue;
    const { data: ex } = await db.from("expenses").insert({ category_id: t.category_id, amount_pkr: t.amount_pkr, spent_on: iso(now), account_id: t.account_id, vendor: t.vendor, note: t.note ? `${t.note} (automatic)` : "Automatic repeat", case_id: t.case_id, recurring: "none", recurring_of: t.id }).select("id").single();
    if (!ex) continue;
    const { error } = await db.rpc("post_expense", { p_expense: ex.id });
    if (error) { await db.from("expenses").delete().eq("id", ex.id); continue; }
    made++;
  }
  return made;
}

/** Protects clients' data: deletes files from closed cases after the months set in Settings (default 12). */
export async function purgeExpiredDocuments(db: Db, now = new Date()): Promise<number> {
  const { data: st } = await db.from("settings").select("case_doc_retention_months").eq("id", 1).maybeSingle();
  const months = Number(st?.case_doc_retention_months ?? 12);
  const cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - months);
  const { data: cases } = await db.from("cases").select("id").lt("closed_at", cutoff.toISOString()).limit(200);
  const ids = (cases ?? []).map((c) => c.id as string);
  if (!ids.length) return 0;
  const { data: docs } = await db.from("case_documents").select("id,file_path").in("case_id", ids).not("file_path", "is", null).limit(500);
  if (!docs?.length) return 0;
  const { error } = await db.storage.from("case-documents").remove(docs.map((d) => d.file_path as string));
  if (error) return 0;
  await db.from("case_documents").update({ file_path: null, file_name: null, mime: null, size_bytes: null }).in("id", docs.map((d) => d.id as string));
  return docs.length;
}

export interface Morning { newLeads: number; remindersDue: number; overdueInvoices: number; biometricsSoon: number; recurringMade: number; unreadMessages: number; docsToCheck: number }

export async function morningSummary(db: Db, recurringMade: number): Promise<{ subject: string; html: string; data: Morning }> {
  const since = new Date(Date.now() - 86400_000).toISOString(), today = iso(new Date()), in2 = iso(new Date(Date.now() + 2 * 86400_000));
  const [leads, rem, inv, bio, msgs, docs] = await Promise.all([
    db.from("leads").select("id", { count: "exact", head: true }).gte("created_at", since),
    db.from("reminders").select("id", { count: "exact", head: true }).eq("done", false).lte("due_on", today),
    db.from("invoices").select("id", { count: "exact", head: true }).in("status", ["sent", "part_paid", "overdue"]).lt("due_date", today),
    db.from("cases").select("id", { count: "exact", head: true }).is("deleted_at", null).gte("biometrics_at", today).lte("biometrics_at", `${in2}T23:59:59Z`),
    db.from("client_messages").select("id", { count: "exact", head: true }).eq("sender", "client").is("read_by_staff_at", null),
    db.from("case_documents").select("id", { count: "exact", head: true }).eq("status", "uploaded"),
  ]);
  const data = { newLeads: leads.count ?? 0, remindersDue: rem.count ?? 0, overdueInvoices: inv.count ?? 0, biometricsSoon: bio.count ?? 0, recurringMade, unreadMessages: msgs.count ?? 0, docsToCheck: docs.count ?? 0 };
  const line = (n: number, one: string, many: string) => `<li><b>${n}</b> ${esc(n === 1 ? one : many)}</li>`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px">
    <h2 style="margin:0 0 8px">Good morning</h2><p style="margin:0 0 12px;color:#475569">Here is what needs you today at Visafeast.</p>
    <ul style="line-height:1.8;padding-left:18px">${line(data.newLeads, "new enquiry in the last 24 hours", "new enquiries in the last 24 hours")}${line(data.remindersDue, "follow-up due", "follow-ups due")}${line(data.overdueInvoices, "invoice overdue", "invoices overdue")}${line(data.biometricsSoon, "biometrics appointment in the next 2 days", "biometrics appointments in the next 2 days")}${line(data.unreadMessages, "unread client message", "unread client messages")}${line(data.docsToCheck, "document to check", "documents to check")}${recurringMade ? line(recurringMade, "repeating expense added automatically", "repeating expenses added automatically") : ""}</ul>
    <p><a href="${esc(siteConfig.url)}/admin" style="background:#F2A93B;color:#0A1A33;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:600">Open Today</a></p></div>`;
  const total = data.newLeads + data.remindersDue + data.overdueInvoices + data.biometricsSoon + data.unreadMessages + data.docsToCheck;
  return { subject: total ? `Visafeast today: ${total} thing${total === 1 ? "" : "s"} need you` : "Visafeast today: all clear", html, data };
}
