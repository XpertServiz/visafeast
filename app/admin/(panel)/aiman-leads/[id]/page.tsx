import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { db } from "@/lib/server/admin-data";
import { waLink } from "@/config/site";
import { Badge, Card, Title, day } from "@/components/admin/ui";
import { markAimanContacted } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function AimanLead({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(); if (!admin || !can.people(admin.role)) redirect("/admin");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data: l } = await db().from("aiman_leads").select("*").eq("id", id).maybeSingle();
  if (!l) notFound();
  if (!l.seen) await db().from("aiman_leads").update({ seen: true }).eq("id", id); // opening it clears the NEW badge
  const answers = Object.entries((l.answers ?? {}) as Record<string, unknown>).filter(([k]) => k !== "purposeKey");
  const utm = Object.entries((l.utm ?? {}) as Record<string, string>);
  const ok = l.status === "qualified";
  return (
    <>
      <Title sub={`${l.purpose} · ${l.target_country} · ${day(l.created_at)}`} action={<Link className="btn btn-outline" href="/admin/aiman-leads">← All leads</Link>}>{l.name}</Title>
      <div style={{ display: "grid", gap: 16, maxWidth: 820 }}>
        <Card><div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Badge color={ok ? "var(--ok)" : "var(--amber-text)"}>{ok ? "QUALIFIED" : "NOT YET QUALIFIED"}</Badge>
          {l.contacted ? <Badge color="var(--navy)">CONTACTED {day(l.contacted_at)}</Badge> : <form action={markAimanContacted}><input type="hidden" name="id" value={l.id} /><button className="btn btn-primary" style={{ minHeight: 44 }}>Mark as contacted</button></form>}
          {l.phone && <a className="btn btn-outline" style={{ minHeight: 44 }} href={waLink(`Hi ${l.name}, this is Visafeast. You just completed the Aiman assessment.`, l.phone)} rel="noopener noreferrer" target="_blank">WhatsApp {l.phone}</a>}
          <span style={{ color: "var(--muted)", fontSize: 14 }}>{ok ? "Call / WhatsApp within 24 hours." : "Send improvement plan within 48 hours."}{!l.completed_at ? " (No phone yet: they did not finish the form.)" : ""}</span>
        </div></Card>
        <Card title="Summary"><p style={{ marginTop: 0 }}>{l.p1}</p><p style={{ marginBottom: 0 }}>{l.p2}</p></Card>
        <Card title="Everything they answered">
          <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
            {[["Program", l.program], ["WhatsApp", l.phone], ["City", l.city], ["Visitor country", l.visitor_country], ["Language", l.lang], ["Time taken", l.secs ? `${l.secs} seconds` : null], ...answers.map(([k, v]) => [k, String(v)])].filter(([, v]) => v).map(([k, v]) => (
              <tr key={String(k)} style={{ borderTop: "1px solid var(--line)" }}><td style={{ padding: "8px 6px", color: "var(--muted)", width: "35%", verticalAlign: "top" }}>{k}</td><td style={{ padding: "8px 6px", overflowWrap: "anywhere" }}>{String(v)}</td></tr>
            ))}
          </tbody></table>
        </Card>
        {utm.length > 0 && <Card title="Where they came from (ad tracking)"><p style={{ margin: 0, overflowWrap: "anywhere" }}>{utm.map(([k, v]) => `${k}: ${v}`).join(" · ")}</p></Card>}
      </div>
    </>
  );
}
