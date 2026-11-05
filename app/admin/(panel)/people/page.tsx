import { MessageCircle } from "lucide-react";
import { db } from "@/lib/server/admin-data";
import { waLink } from "@/config/site";
import { Badge, Card, Empty, Field, Grid, Title, day } from "@/components/admin/ui";
import { addEnquiry, setLeadStatus, startCase } from "../../actions";

export const dynamic = "force-dynamic";
const STATUS = [["new", "New"], ["contacted", "Contacted"], ["not_interested", "Not interested"], ["closed", "Closed"]] as const;

export default async function People({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const d = db();
  let q = d.from("leads").select("id,name,phone,email,city,destination,visa_type,source,status,created_at,message,person_id,eligibility").order("created_at", { ascending: false }).limit(60);
  if (sp.status) q = q.eq("status", sp.status);
  if (sp.q) q = q.or(`name.ilike.%${sp.q.replace(/[%,]/g, "")}%,phone.ilike.%${sp.q.replace(/[%,]/g, "")}%`);
  const [{ data: leads }, { data: countries }] = await Promise.all([q, d.from("countries").select("id,country_name,kind").order("country_name")]);

  return (
    <>
      <Title sub="Everyone who asked about a visa — from the website, chat, WhatsApp or the phone.">People</Title>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <a className="chip" href="/admin/people">All</a>
        {STATUS.map(([k, l]) => <a key={k} className="chip" href={`/admin/people?status=${k}`}>{l}</a>)}
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {leads?.length ? leads.map((l) => (
          <div key={l.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div><b style={{ fontSize: 18 }}>{l.name}</b> <Badge>{l.status}</Badge><br />
                <span style={{ color: "var(--muted)" }}>{l.phone} · {l.visa_type} {l.destination ?? ""} · from {l.source} · {day(l.created_at)}</span></div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {l.phone && <a className="btn btn-wa" href={waLink(`Assalam-o-Alaikum ${l.name}, thank you for contacting Visafeast.`, l.phone)}><MessageCircle size={18} aria-hidden />WhatsApp</a>}
                <form action={setLeadStatus} style={{ display: "flex", gap: 6 }}><input type="hidden" name="id" value={l.id} />
                  <select name="status" defaultValue={l.status} className="field" style={{ width: 150 }} aria-label="Status">{STATUS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
                  <button className="btn btn-outline">Save</button></form>
              </div>
            </div>
            {l.message && <p style={{ margin: "10px 0 0" }}>{l.message}</p>}
            {l.eligibility && <p className="mono" style={{ fontSize: 13, color: "var(--muted-2)", margin: "6px 0 0" }}>Eligibility check: {(l.eligibility as { band?: string; score?: number }).band} ({(l.eligibility as { score?: number }).score}/13)</p>}
            {l.person_id && (
              <details style={{ marginTop: 10 }}><summary style={{ cursor: "pointer", fontWeight: 600, minHeight: 44, display: "flex", alignItems: "center" }}>Start a case</summary>
                <form action={startCase} style={{ display: "grid", gap: 10, marginTop: 8 }}>
                  <input type="hidden" name="person_id" value={l.person_id} />
                  <Grid min={160}>
                    <Field label="Service"><select name="service_type" className="field" defaultValue={l.visa_type ?? "visit"}><option value="visit">Visit</option><option value="study">Study</option><option value="immigration">Immigration</option></select></Field>
                    <Field label="Country"><select name="country_id" className="field"><option value="">—</option>{countries?.map((c) => <option key={c.id} value={c.id}>{c.country_name} ({c.kind})</option>)}</select></Field>
                    <Field label="Agreed fee (PKR)"><input name="fee" type="number" min={0} className="field" inputMode="numeric" /></Field>
                  </Grid>
                  <button className="btn btn-primary">Start case</button>
                </form></details>
            )}
          </div>
        )) : <Empty text="No enquiries yet. They appear here automatically." />}
      </div>

      <div style={{ marginTop: 24 }}>
        <Card id="new" title="Add an enquiry (e.g. someone who messaged you on WhatsApp)">
          <form action={addEnquiry} style={{ display: "grid", gap: 12 }}>
            <Grid min={200}>
              <Field label="Name"><input name="name" className="field" required /></Field>
              <Field label="WhatsApp number"><input name="phone" className="field" required type="tel" dir="ltr" /></Field>
              <Field label="Service"><select name="visa_type" className="field"><option value="visit">Visit</option><option value="study">Study</option><option value="immigration">Immigration</option></select></Field>
            </Grid>
            <details><summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>More details</summary>
              <div style={{ display: "grid", gap: 10 }}><Field label="Country wanted"><input name="destination" className="field" /></Field><Field label="Note"><textarea name="message" className="field" rows={2} /></Field></div></details>
            <button className="btn btn-primary">Save enquiry</button>
          </form>
        </Card>
      </div>
    </>
  );
}
