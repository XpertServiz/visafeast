import { db } from "@/lib/server/admin-data";
import { Badge, Card } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
const words = (s: string | null) => (s ? s.trim().split(/\s+/).length : 0);

export default async function Seo() {
  const d = db();
  const [{ data: cs }, { data: sc }] = await Promise.all([
    d.from("countries").select("slug,kind,h1,meta_title,meta_description,intro,documents,steps,refusal_reasons,extra_sections,funds_md,facts_source_url,related_slugs,is_published"),
    d.from("search_console_daily").select("page,query,clicks,impressions,position").order("impressions", { ascending: false }).limit(15),
  ]);
  const rows = (cs ?? []).map((c) => {
    const issues: string[] = [];
    if (!c.meta_title || c.meta_title.length > 60) issues.push(`Your title is ${c.meta_title?.length ?? 0} characters — keep it between 1 and 60.`);
    if (!c.meta_description || c.meta_description.length < 100 || c.meta_description.length > 155) issues.push(`Your description is ${c.meta_description?.length ?? 0} characters — aim for 140–155 with a call to action.`);
    if (!c.h1) issues.push("Add a main heading (H1).");
    const total = words(c.intro) + words(c.funds_md) + (c.documents ?? []).length * 12 + (c.steps ?? []).length * 20 + (c.refusal_reasons ?? []).length * 14 + (c.extra_sections ?? []).reduce((s: number, x: { md: string }) => s + words(x.md), 0);
    if (total < 900) issues.push(`About ${total} words of content — country pages rank best with 900+ real, useful words (from official sources).`);
    if (!c.facts_source_url) issues.push("No official source link yet.");
    if ((c.related_slugs ?? []).length < 3) issues.push("Link to at least 3 related countries.");
    return { slug: `/${c.kind === "visit" ? "visit-visa" : c.kind === "study" ? "study-visa" : "immigration"}/${c.slug}`, live: c.is_published, issues, score: Math.max(0, 100 - issues.length * 16) };
  });
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rows.map((r) => (
        <div key={r.slug} className="card" style={{ padding: 14 }}>
          <p style={{ margin: 0 }}><b className="mono" style={{ fontSize: 14 }}>{r.slug}</b> <Badge color={r.score >= 80 ? "var(--ok)" : r.score >= 50 ? "var(--amber-text)" : "var(--bad)"}>{r.score}/100</Badge> {!r.live && <Badge color="var(--muted-2)">DRAFT</Badge>}</p>
          {r.issues.length ? <ul style={{ margin: "8px 0 0" }}>{r.issues.map((i) => <li key={i}>{i}</li>)}</ul> : <p style={{ margin: "6px 0 0", color: "var(--ok)" }}>Looks good.</p>}
        </div>
      ))}
      <Card title="Google search (from Search Console)">
        {sc?.length ? sc.map((x, i) => <p key={i} style={{ margin: "6px 0" }}>“{x.query}” — {x.impressions} views, {x.clicks} clicks, position {Number(x.position).toFixed(1)}</p>) : <p style={{ margin: 0, color: "var(--muted)" }}>No data yet. Connect Google Search Console (README → “Go live”); numbers arrive daily.</p>}
      </Card>
    </div>
  );
}
