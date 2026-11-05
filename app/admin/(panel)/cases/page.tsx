import Link from "next/link";
import { db } from "@/lib/server/admin-data";
import { Badge, Card, Empty, Field, Grid, Title, day, pkr } from "@/components/admin/ui";
import { startCase } from "../../actions";
import { CaseBoard } from "@/components/admin/CaseBoard";

export const dynamic = "force-dynamic";

export default async function Cases() {
  const d = db();
  const [{ data: cases }, { data: stages }, { data: people }, { data: countries }] = await Promise.all([
    d.from("cases").select("id,ref,service_type,stage,agreed_fee_pkr,travel_date,decision,created_at,person:people(full_name),country:countries(country_name)").is("deleted_at", null).order("created_at", { ascending: false }).limit(100),
    d.from("case_stage_templates").select("service_type,stage,label_en,sort").order("sort"),
    d.from("people").select("id,full_name,whatsapp").order("created_at", { ascending: false }).limit(200),
    d.from("countries").select("id,country_name,kind").order("country_name"),
  ]);
  const label = (st: string, t: string) => stages?.find((s) => s.service_type === st && s.stage === t)?.label_en ?? t;
  type Row = { id: string; ref: string; service_type: string; stage: string; agreed_fee_pkr: number | null; decision: string | null; person: { full_name: string } | null; country: { country_name: string } | null };
  const list = (cases ?? []) as unknown as Row[];
  const colour = (c: Row) => (c.decision === "approved" ? "var(--ok)" : c.decision === "refused" ? "var(--bad)" : "var(--stamp-blue)");

  return (
    <>
      <Title sub="Each client's application, from first call to decision." action={<Link className="btn btn-outline" href="/admin/cases/documents">Client documents</Link>}>Cases</Title>
      {list.length > 0 && (
        <div className="hide-sm" style={{ marginBottom: 20 }}>
          <CaseBoard
            cases={list.filter((c) => !c.decision).map((c) => ({ id: c.id, ref: c.ref, service_type: c.service_type, stage: c.stage, client: c.person?.full_name ?? "", country: c.country?.country_name ?? "", decision: c.decision }))}
            stages={(stages ?? []).map((x) => ({ service_type: x.service_type, stage: x.stage, label: x.label_en, sort: x.sort }))}
          />
        </div>
      )}
      {list.length ? (
        <div className="show-sm" style={{ display: "grid", gap: 10 }}>
          {list.map((c) => (
            <Link key={c.ref} href={`/admin/cases/${c.ref}`} className="card lift" style={{ padding: 16, textDecoration: "none", color: "var(--ink)", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span><b className="mono">{c.ref}</b> · {c.person?.full_name}<br /><span style={{ color: "var(--muted)", fontSize: 14 }}>{c.service_type} {c.country?.country_name ?? ""} · {pkr(c.agreed_fee_pkr)}</span></span>
              <Badge color={colour(c)}>{c.decision ? c.decision.toUpperCase() : label(c.service_type, c.stage)}</Badge>
            </Link>
          ))}
        </div>
      ) : <Empty text="No cases yet. Start one from an enquiry in People, or below." />}
      <div style={{ marginTop: 24 }}>
        <Card id="new" title="Start a new case">
          <form action={startCase} style={{ display: "grid", gap: 12 }}>
            <Grid min={200}>
              <Field label="Client"><select name="person_id" className="field" required><option value="">Choose…</option>{people?.map((p) => <option key={p.id} value={p.id}>{p.full_name} {p.whatsapp}</option>)}</select></Field>
              <Field label="Service"><select name="service_type" className="field"><option value="visit">Visit</option><option value="study">Study</option><option value="immigration">Immigration</option></select></Field>
              <Field label="Country"><select name="country_id" className="field"><option value="">—</option>{countries?.map((c) => <option key={c.id} value={c.id}>{c.country_name} ({c.kind})</option>)}</select></Field>
              <Field label="Agreed fee (PKR)"><input name="fee" type="number" min={0} className="field" inputMode="numeric" /></Field>
            </Grid>
            <button className="btn btn-primary">Start case</button>
          </form>
        </Card>
      </div>
    </>
  );
}
