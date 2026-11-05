import { db } from "@/lib/server/admin-data";
import { isStale } from "@/lib/data";
import { Badge, Card, Field, Grid, day } from "@/components/admin/ui";
import { approveUrdu, markFactsChecked, saveCountryFacts, toggleCountry } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function Countries() {
  const { data } = await db().from("countries").select("*").order("kind").order("sort_order");
  const ageDays = (d: string | null) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p style={{ margin: 0, color: "var(--muted)" }}>Fill in only what you have confirmed on the official website. Anything left empty shows “Being verified — WhatsApp us” to visitors.</p>
      {data?.map((c) => {
        const age = ageDays(c.facts_last_checked), old = age === null || age > 60;
        return (
          <details key={c.id} className="card" style={{ padding: "6px 16px", borderColor: old ? "var(--bad)" : undefined }}>
            <summary style={{ cursor: "pointer", minHeight: 52, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <b>{c.country_name}</b> <span style={{ color: "var(--muted)" }}>{c.kind}</span>
              <Badge color={c.is_published ? "var(--ok)" : "var(--muted-2)"}>{c.is_published ? "LIVE" : "DRAFT"}</Badge>
              <span style={{ color: old ? "var(--bad)" : "var(--muted)", fontSize: 14 }}>{age === null ? "facts never checked" : `checked ${age} days ago (${day(c.facts_last_checked)})`}{isStale(c.facts_last_checked) && age !== null ? " — hidden from visitors" : ""}</span>
            </summary>
            <form action={saveCountryFacts} style={{ display: "grid", gap: 10, paddingBottom: 14 }}>
              <input type="hidden" name="id" value={c.id} />
              <Grid min={240}>
                <Field label="Embassy fee (text)"><input name="embassy_fee_text" defaultValue={c.embassy_fee_text ?? ""} className="field" /></Field>
                <Field label="Embassy fee in PKR"><input name="embassy_fee_pkr" type="number" defaultValue={c.embassy_fee_pkr ?? ""} className="field" /></Field>
                <Field label="Visa centre (VFS) fee"><input name="vfs_fee_text" defaultValue={c.vfs_fee_text ?? ""} className="field" /></Field>
                <Field label="Our service fee (PKR)"><input name="service_fee_pkr" type="number" defaultValue={c.service_fee_pkr ?? ""} className="field" /></Field>
                <Field label="Decision time"><input name="processing_time_text" defaultValue={c.processing_time_text ?? ""} className="field" /></Field>
                <Field label="Maximum stay"><input name="max_stay_text" defaultValue={c.max_stay_text ?? ""} className="field" /></Field>
                <Field label="When to apply"><input name="apply_window_text" defaultValue={c.apply_window_text ?? ""} className="field" /></Field>
                <Field label="Biometrics"><input name="biometrics_text" defaultValue={c.biometrics_text ?? ""} className="field" /></Field>
                <Field label="Official source link"><input name="facts_source_url" type="url" defaultValue={c.facts_source_url ?? ""} className="field" /></Field>
              </Grid>
              <button className="btn btn-primary">Save — I checked these today</button>
            </form>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 14 }}>
              <form action={markFactsChecked}><input type="hidden" name="id" value={c.id} /><button className="btn btn-outline">Mark facts checked today</button></form>
              <form action={toggleCountry}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="publish" value={c.is_published ? "0" : "1"} /><button className="btn btn-dark">{c.is_published ? "Take offline" : "Publish page"}</button></form>
              <form action={approveUrdu} style={{ display: "flex", gap: 6 }}><input type="hidden" name="id" value={c.id} /><select name="status" defaultValue={c.ur_status} className="field" style={{ width: 160 }} aria-label="Urdu status"><option value="none">Urdu: none</option><option value="draft">Urdu: draft</option><option value="approved">Urdu: approved</option></select><button className="btn btn-outline">Set</button></form>
            </div>
          </details>
        );
      })}
      <Card><p style={{ margin: 0 }}>Longer text (documents, steps, FAQs) is edited in the FAQs tab and, for now, in the database. A full page builder is planned.</p></Card>
    </div>
  );
}
