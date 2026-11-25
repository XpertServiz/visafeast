import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { db, today } from "@/lib/server/admin-data";
import { Badge, Card, Title } from "@/components/admin/ui";
import { TYPES, TYPE_LABEL, VERDICTS, VERDICT_LABEL, REVIEW_DUE_DAYS } from "@/config/reality-check";
import { reviewDue, type RealityCheck } from "@/lib/reality";
import { deleteReality, markRealityVerified, saveReality, setRealityStatus } from "../../../reality-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fact-check" };
const ROWS = 8, SOURCES = 6;

export default async function EditCheck({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string; ok?: string }> }) {
  const admin = await getAdmin(); if (!admin || !can.website(admin.role)) redirect("/admin");
  const { id } = await params; const { err, ok } = await searchParams;
  let c: Partial<RealityCheck> = { type: "study", verdict: "partly_true", verified_on: today(), rows: [], sources: [], checklist: [], status: "draft" };
  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
    const { data } = await db().from("reality_checks").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    c = data as RealityCheck;
  }
  const live = c.status === "published";
  const rows = [...(c.rows ?? [])]; while (rows.length < ROWS) rows.push({ claim: "", rule: "", verdict: "cannot_verify" });
  const sources = [...(c.sources ?? [])]; while (sources.length < SOURCES) sources.push({ title: "", url: "" });
  const due = c.verified_on ? reviewDue(c.verified_on) : false;
  const f = { minHeight: 44 } as const;
  const lbl = { display: "grid", gap: 4, fontWeight: 600 } as const;
  const verdictSelect = (name: string, v: string) => <select name={name} defaultValue={v} className="field" style={f} aria-label="Verdict">{VERDICTS.map((x) => <option key={x} value={x}>{VERDICT_LABEL[x]}</option>)}</select>;
  return (
    <>
      <Title sub={live ? "This one is live on the website." : "Draft: not on the website yet."} action={<Link className="btn btn-outline" href="/admin/reality-check">← All fact-checks</Link>}>{c.title || "New fact-check"}</Title>
      {err && <p role="alert" className="card" style={{ padding: 12, borderColor: "var(--bad)", color: "var(--bad)" }}>{err}</p>}
      {ok && <p role="status" className="card" style={{ padding: 12 }}>{ok}</p>}
      <div style={{ display: "grid", gap: 16, maxWidth: 860 }}>
        <Card>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Badge color={live ? "var(--ok)" : "var(--muted-2)"}>{live ? "LIVE" : "DRAFT"}</Badge>
            {due && <Badge color="var(--amber-text)">REVIEW DUE</Badge>}
            {id !== "new" && live && <a className="btn btn-outline" style={f} href={`/reality-check/${c.slug}`} target="_blank" rel="noopener">View on website</a>}
            {id !== "new" && <form action={setRealityStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="to" value={live ? "draft" : "published"} /><button className="btn btn-outline" style={f}>{live ? "Take off the website" : "Publish"}</button></form>}
            {id !== "new" && due && <form action={markRealityVerified}><input type="hidden" name="id" value={id} /><button className="btn btn-outline" style={f}>I checked the links again: set date to today</button></form>}
          </div>
          {due && <p style={{ marginBottom: 0, color: "var(--muted)" }}>Last verified more than {REVIEW_DUE_DAYS} days ago. Open the official links, check the rules, then update.</p>}
        </Card>

        <form action={saveReality} style={{ display: "grid", gap: 16 }}>
          <input type="hidden" name="id" value={id === "new" ? "" : id} />
          <Card title="The claim">
            <div style={{ display: "grid", gap: 12 }}>
              <label style={lbl}>Title<input name="title" className="field" style={f} defaultValue={c.title ?? ""} maxLength={120} required /></label>
              <label style={lbl}>The claim (write it without naming anyone)<textarea name="claim" className="field" rows={2} defaultValue={c.claim ?? ""} maxLength={300} required /></label>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))" }}>
                <label style={lbl}>Country<input name="country" className="field" style={f} defaultValue={c.country ?? ""} maxLength={60} /></label>
                <label style={lbl}>Type<select name="type" className="field" style={f} defaultValue={c.type}>{TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></label>
                <label style={lbl}>Verdict<select name="verdict" className="field" style={f} defaultValue={c.verdict}>{VERDICTS.map((x) => <option key={x} value={x}>{VERDICT_LABEL[x]}</option>)}</select></label>
                <label style={lbl}>Last verified<input name="verified_on" type="date" className="field" style={f} defaultValue={c.verified_on} required /></label>
              </div>
              <label style={lbl}>Short summary<textarea name="summary" className="field" rows={3} defaultValue={c.summary ?? ""} maxLength={400} /></label>
              <label style={lbl}>Web address ending (leave empty to make it from the title)<input name="slug" className="field" style={f} defaultValue={c.slug ?? ""} maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
            </div>
          </Card>
          <Card title="What is true, misleading and missing">
            <div style={{ display: "grid", gap: 12 }}>
              <label style={lbl}>What is true<textarea name="what_true" className="field" rows={2} defaultValue={c.what_true ?? ""} maxLength={800} /></label>
              <label style={lbl}>What is misleading<textarea name="what_misleading" className="field" rows={2} defaultValue={c.what_misleading ?? ""} maxLength={800} /></label>
              <label style={lbl}>What is missing<textarea name="what_missing" className="field" rows={2} defaultValue={c.what_missing ?? ""} maxLength={800} /></label>
            </div>
          </Card>
          <Card title="Claim against the official rules (table)">
            <div style={{ display: "grid", gap: 14 }}>
              {rows.slice(0, ROWS).map((r, i) => (
                <div key={i} style={{ display: "grid", gap: 6, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
                  <input name={`row_claim_${i}`} className="field" style={f} defaultValue={r.claim} placeholder={`Claim ${i + 1}`} maxLength={160} aria-label={`Claim ${i + 1}`} />
                  <textarea name={`row_rule_${i}`} className="field" rows={2} defaultValue={r.rule} placeholder="What the official rules say" maxLength={500} aria-label={`Official rule ${i + 1}`} />
                  {verdictSelect(`row_verdict_${i}`, r.verdict)}
                </div>
              ))}
            </div>
          </Card>
          <Card title="What to do before you pay (one step per line)">
            <textarea name="checklist" className="field" rows={5} defaultValue={(c.checklist ?? []).join("\n")} maxLength={1500} aria-label="Checklist" />
          </Card>
          <Card title="Official sources (at least one is required)">
            <p style={{ marginTop: 0, color: "var(--muted)" }}>Use the immigration authority or the university page. Not Facebook, YouTube, WhatsApp or other social links.</p>
            <div style={{ display: "grid", gap: 10 }}>
              {sources.slice(0, SOURCES).map((x, i) => (
                <div key={i} style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
                  <input name={`src_title_${i}`} className="field" style={f} defaultValue={x.title === x.url ? "" : x.title} placeholder="Name (e.g. UDI: studies)" maxLength={120} aria-label={`Source name ${i + 1}`} />
                  <input name={`src_url_${i}`} className="field" style={f} defaultValue={x.url} placeholder="https://" type="url" maxLength={300} aria-label={`Source link ${i + 1}`} />
                </div>
              ))}
            </div>
          </Card>
          <Card title="Urdu summary (optional)">
            <textarea name="ur_summary" dir="rtl" className="field" rows={3} defaultValue={c.ur_summary ?? ""} maxLength={500} style={{ fontFamily: "var(--f-nastaliq), serif", lineHeight: 2 }} aria-label="Urdu summary" />
          </Card>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", position: "sticky", bottom: 0, background: "var(--bg, #fff)", padding: "10px 0" }}>
            <button className="btn btn-primary" name="intent" value="publish" style={f}>{live ? "Save changes" : "Save and publish"}</button>
            <button className="btn btn-outline" name="intent" value="draft" style={f}>Save as draft</button>
          </div>
        </form>

        {id !== "new" && (
          <Card title="Delete">
            <form action={deleteReality}><input type="hidden" name="id" value={id} /><button className="btn btn-outline" style={{ ...f, color: "var(--bad)", borderColor: "var(--bad)" }}>Delete this fact-check for good</button></form>
          </Card>
        )}
      </div>
    </>
  );
}
