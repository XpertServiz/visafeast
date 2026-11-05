import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { db } from "@/lib/server/admin-data";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { waLink } from "@/config/site";
import { Badge, Card, Field, Grid, Title, day, pkr } from "@/components/admin/ui";
import { addNote, addReminder, payEmbassyFee, recordDecision, setCaseStage, toggleCaseDoc } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function CaseDetail({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const admin = (await getAdmin())!;
  const d = db();
  const { data: c } = await d.from("cases").select("*, person:people(id,full_name,whatsapp), country:countries(country_name)").eq("ref", ref).maybeSingle();
  if (!c) notFound();
  const [{ data: docs }, { data: stages }, { data: timeline }, { data: accounts }, { data: tpl }] = await Promise.all([
    d.from("case_documents").select("id,title,received").eq("case_id", c.id).order("title"),
    d.from("case_stage_templates").select("stage,label_en,sort").eq("service_type", c.service_type).order("sort"),
    d.from("timeline_events").select("id,kind,body,ts").eq("case_id", c.id).order("ts", { ascending: false }).limit(30),
    can.money(admin.role) ? d.from("money_accounts").select("id,name").eq("is_active", true) : Promise.resolve({ data: [] }),
    d.from("message_templates").select("key,label,body_en"),
  ]);
  const missing = (docs ?? []).filter((x) => !x.received).map((x) => x.title).join(", ");
  const fill = (t: string) => t.replace("{name}", c.person?.full_name ?? "").replace("{ref}", c.ref).replace("{missing}", missing || "—");
  const wa = (key: string) => { const t = tpl?.find((x) => x.key === key); return c.person?.whatsapp && t ? waLink(fill(t.body_en), c.person.whatsapp) : null; };

  return (
    <>
      <Title sub={`${c.person?.full_name} · ${c.service_type} ${c.country?.country_name ?? ""} · agreed ${pkr(c.agreed_fee_pkr)}`}>Case {c.ref}</Title>
      <Grid min={320}>
        <Card title="Stage">
          <form action={setCaseStage} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input type="hidden" name="id" value={c.id} /><input type="hidden" name="ref" value={c.ref} />
            <select name="stage" defaultValue={c.stage} className="field" style={{ flex: 1 }} aria-label="Stage">{stages?.map((s) => <option key={s.stage} value={s.stage}>{s.label_en}</option>)}</select>
            <button className="btn btn-primary">Move</button>
          </form>
          {c.decision ? <p style={{ marginBottom: 0 }}><Badge color={c.decision === "approved" ? "var(--ok)" : "var(--bad)"}>{c.decision.toUpperCase()}</Badge> on {day(c.decision_at)}</p> : (
            <form action={recordDecision} style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input type="hidden" name="id" value={c.id} /><input type="hidden" name="ref" value={c.ref} />
              <select name="decision" className="field" aria-label="Decision"><option value="approved">Visa approved</option><option value="refused">Visa refused</option><option value="withdrawn">Withdrawn</option></select>
              <button className="btn btn-outline">Record decision</button>
            </form>
          )}
        </Card>

        <Card title="Send a WhatsApp message">
          <div style={{ display: "grid", gap: 8 }}>
            {[["welcome", "Welcome"], ["documents", "Ask for missing documents"], ["appointment", "Appointment reminder"], ["approved", "Visa approved — congratulations"]].map(([k, l]) => {
              const href = wa(k); return href ? <a key={k} className="btn btn-wa" href={href}><MessageCircle size={18} aria-hidden />{l}</a> : null;
            })}
          </div>
        </Card>

        <Card title={`Documents (${(docs ?? []).filter((x) => x.received).length}/${docs?.length ?? 0} received)`}>
          {docs?.length ? docs.map((x) => (
            <form key={x.id} action={toggleCaseDoc} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--line)" }}>
              <input type="hidden" name="id" value={x.id} /><input type="hidden" name="ref" value={c.ref} /><input type="hidden" name="received" value={x.received ? "0" : "1"} />
              <span style={{ textDecoration: x.received ? "line-through" : undefined }}>{x.title}</span>
              <button className={x.received ? "btn btn-outline" : "btn btn-dark"} style={{ minHeight: 44 }}>{x.received ? "Undo" : "Got it"}</button>
            </form>
          )) : <p style={{ color: "var(--muted)" }}>No checklist yet. It is created from the country page's document list when you pick a country.</p>}
        </Card>

        <Card title="Reminder">
          <form action={addReminder} style={{ display: "grid", gap: 8 }}>
            <input type="hidden" name="case_id" value={c.id} /><input type="hidden" name="person_id" value={c.person?.id} />
            <input type="date" name="due_on" className="field" required aria-label="Date" /><input name="note" className="field" placeholder="What to do" aria-label="Note" />
            <button className="btn btn-outline">Remind me</button>
          </form>
        </Card>

        {can.money(admin.role) && (
          <Card title="Pay embassy / visa-centre fee for this client">
            <form action={payEmbassyFee} style={{ display: "grid", gap: 8 }}>
              <input type="hidden" name="case_id" value={c.id} />
              <Field label="Amount (PKR)"><input name="amount" type="number" min={1} required className="field" inputMode="numeric" /></Field>
              <Field label="Paid from"><select name="account_id" className="field" required>{accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
              <input type="hidden" name="payee" value="Embassy / VFS" />
              <button className="btn btn-dark">Record payment</button>
              <small style={{ color: "var(--muted)" }}>This is the client's money, not an expense — it never changes your profit.</small>
            </form>
          </Card>
        )}

        <Card title="Notes & history">
          <form action={addNote} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input type="hidden" name="case_id" value={c.id} /><input type="hidden" name="person_id" value={c.person?.id} /><input type="hidden" name="path" value={`/admin/cases/${c.ref}`} />
            <input name="body" className="field" placeholder="Add a note" required aria-label="Note" /><button className="btn btn-dark">Add</button>
          </form>
          {timeline?.map((t) => <p key={t.id} style={{ margin: "6px 0", fontSize: 15 }}><span className="mono" style={{ color: "var(--muted-2)", fontSize: 12 }}>{day(t.ts)}</span> {t.body}</p>)}
        </Card>
      </Grid>
    </>
  );
}
