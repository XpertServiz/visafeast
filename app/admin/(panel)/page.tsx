import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { db, today, startOfMonth } from "@/lib/server/admin-data";
import { waLink } from "@/config/site";
import { automated, inHub } from "@/lib/bots";
import { Card, Empty, Grid, Stat, Title, pkr, day } from "@/components/admin/ui";
import { doneReminder, setLeadStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function Today() {
  const admin = (await getAdmin())!;
  const d = db();
  const staffCanSeeClients = can.people(admin.role);
  const [unread, toCheck] = staffCanSeeClients ? await Promise.all([
    d.from("client_messages").select("id,person_id,body,created_at,person:people(full_name)").eq("sender", "client").is("read_by_staff_at", null).order("id", { ascending: false }).limit(30),
    d.from("case_documents").select("id", { count: "exact", head: true }).eq("status", "uploaded"),
  ]) : [{ data: [] as never[] }, { count: 0 }];
  const threads = [...new Map(((unread.data ?? []) as unknown as { person_id: string; body: string; person: { full_name: string | null } | null }[]).map((m) => [m.person_id, m])).values()];
  const [leads, reminders, overdue, pendingReviews, drafts, live, waiting] = await Promise.all([
    d.from("leads").select("id,name,phone,destination,visa_type,source,created_at").eq("status", "new").order("created_at", { ascending: false }).limit(8),
    d.from("reminders").select("id,note,due_on,person:people(full_name,whatsapp)").eq("done", false).lte("due_on", today()).limit(10),
    can.money(admin.role) ? d.from("invoices").select("id,number,due_date,person:people(full_name,whatsapp)").in("status", ["sent", "part_paid", "overdue"]).lt("due_date", today()).limit(8) : Promise.resolve({ data: [] }),
    d.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    d.from("posts").select("id,title").eq("status", "draft").eq("type", "digest").limit(3),
    d.from("live_presence").select("country,city,path,device,browser_language").gte("last_seen", new Date(Date.now() - 5 * 60_000).toISOString()),
    d.from("cases").select("id,ref,stage").in("stage", ["docs_requested", "documents"]).is("deleted_at", null).limit(8),
  ]);
  let money: { income: number; expenses: number; profit: number } | null = null;
  if (can.reports(admin.role)) { const { data } = await d.rpc("report_profit", { p_from: startOfMonth(), p_to: today() }); if (data?.[0]) money = data[0]; }
  const liveRows = ((live.data ?? []) as { country: string | null; city: string | null; path: string; device: string; browser_language: string | null }[]).filter((r) => !(automated({ lang: r.browser_language }) || inHub(r.city)));
  type Person = { full_name: string | null; whatsapp: string | null } | null;

  return (
    <>
      <Title sub={`Hello ${admin.name ?? ""}. Here is what needs you today.`}>Today</Title>
      <Grid min={320}>
        <Card title={`New enquiries (${leads.data?.length ?? 0})`}>
          {leads.data?.length ? leads.data.map((l) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--line)" }}>
              <div><b>{l.name}</b><br /><span style={{ color: "var(--muted)", fontSize: 14 }}>{l.visa_type} {l.destination ?? ""} · {l.source}</span></div>
              <div style={{ display: "flex", gap: 6 }}>
                {l.phone && <a className="btn btn-wa" style={{ minHeight: 44, padding: "0 12px" }} href={waLink(`Assalam-o-Alaikum ${l.name}, thank you for contacting Visafeast.`, l.phone)} aria-label={`WhatsApp ${l.name}`}><MessageCircle size={18} /></a>}
                <form action={setLeadStatus}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="status" value="contacted" /><button className="btn btn-outline" style={{ minHeight: 44 }}>Contacted</button></form>
              </div>
            </div>
          )) : <Empty text="No new enquiries. Add one when someone messages you." href="/admin/people#new" cta="Add an enquiry" />}
        </Card>

        {staffCanSeeClients && (
          <Card title={`Client messages (${threads.length})`}>
            {threads.length ? threads.map((m) => (
              <p key={m.person_id} style={{ margin: 0, padding: "10px 0", borderTop: "1px solid var(--line)" }}><Link href={`/admin/people/${m.person_id}`}><b>{m.person?.full_name ?? "Client"}</b></Link><br /><span dir="auto" style={{ color: "var(--muted)", fontSize: 14, overflowWrap: "anywhere" }}>{m.body.slice(0, 90)}</span></p>
            )) : <Empty text="No new messages from clients." />}
            <p style={{ marginBottom: 0 }}><Link href="/admin/cases/documents">Documents to check: {toCheck.count ?? 0} →</Link></p>
          </Card>
        )}

        <Card title="Follow-ups due">
          {reminders.data?.length ? (reminders.data as unknown as { id: string; note: string | null; due_on: string; person: Person }[]).map((r) => (
            <form key={r.id} action={doneReminder} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--line)" }}>
              <span><b>{r.person?.full_name ?? "—"}</b><br /><span style={{ color: "var(--muted)", fontSize: 14 }}>{r.note} · {day(r.due_on)}</span></span>
              <input type="hidden" name="id" value={r.id} /><button className="btn btn-outline" style={{ minHeight: 44 }}>Done</button>
            </form>
          )) : <Empty text="Nothing to follow up today." />}
        </Card>

        {can.money(admin.role) && (
          <Card title="Payments overdue">
            {overdue.data?.length ? (overdue.data as unknown as { id: string; number: string; due_date: string; person: Person }[]).map((i) => (
              <div key={i.id} style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}><b>{i.number}</b> · {i.person?.full_name}<br /><span style={{ color: "var(--bad)", fontSize: 14 }}>Due {day(i.due_date)}</span></div>
            )) : <Empty text="No overdue payments." />}
            <p style={{ marginBottom: 0 }}><Link href="/admin/money">Open Money →</Link></p>
          </Card>
        )}

        <Card title="Cases waiting for client documents">
          {waiting.data?.length ? waiting.data.map((c) => <p key={c.id} style={{ margin: "6px 0" }}><Link href={`/admin/cases/${c.ref}`}>{c.ref}</Link></p>) : <Empty text="No cases are waiting for documents." />}
        </Card>

        {money && (
          <Card title="This month">
            <div style={{ display: "grid", gap: 8 }}>
              <Stat label="Money in" value={pkr(money.income)} /><Stat label="Money out" value={pkr(money.expenses)} /><Stat label="Profit" value={pkr(money.profit)} tone={money.profit >= 0 ? "ok" : "bad"} />
            </div>
          </Card>
        )}

        <Card title={`Live now: ${liveRows.length} on the site`}>
          {liveRows.length ? liveRows.slice(0, 6).map((v, i) => <p key={i} style={{ margin: "6px 0" }}>{v.country ?? "?"} · {v.city ?? "—"} · <span className="mono" style={{ fontSize: 13 }}>{v.path}</span></p>) : <Empty text="Nobody is on the site right now." />}
          <p style={{ marginBottom: 0 }}><Link href="/admin/visitors">See all visitors →</Link></p>
        </Card>

        <Card title="To approve">
          <p style={{ margin: "6px 0" }}><Link href="/admin/reviews">{pendingReviews.count ?? 0} review(s) waiting</Link></p>
          {drafts.data?.map((p) => <p key={p.id} style={{ margin: "6px 0" }}><Link href="/admin/website/news">Digest: {p.title}</Link></p>)}
        </Card>
      </Grid>
    </>
  );
}
