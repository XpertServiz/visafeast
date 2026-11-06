import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { db } from "@/lib/server/admin-data";
import { SEED_COUNTRIES } from "@/lib/seed";
import { GUIDES, IMMIGRATION_GUIDES } from "@/lib/guides";
import { Badge, Card, Empty, Title, day } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Useful links" };

interface Row { label: string; url: string; kind: "Visit" | "Study" | "Immigration"; checked: string | null }
const KIND = { visit: "Visit", study: "Study", immigration: "Immigration" } as const;
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

/** For staff only: the official pages for each country. They are not shown to visitors, so clients get our help instead of applying on their own. */
export default async function UsefulLinks({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await getAdmin(); if (!admin || !can.website(admin.role)) redirect("/admin");
  const q = ((await searchParams).q ?? "").trim().toLowerCase();

  const byCountry = new Map<string, Row[]>();
  const add = (country: string, r: Row) => {
    const list = byCountry.get(country) ?? []; if (!byCountry.has(country)) byCountry.set(country, list);
    if (!list.some((x) => x.url === r.url)) list.push(r);
  };
  for (const c of SEED_COUNTRIES) {
    const g = GUIDES[c.slug]; if (!g) continue;
    const kind = KIND[c.kind];
    for (const s of g.sources) add(c.country_name, { label: s.label, url: s.url, kind, checked: g.checked });
    for (const o of g.options ?? []) if (o.url) add(c.country_name, { label: o.name, url: o.url, kind, checked: g.checked });
  }
  for (const g of IMMIGRATION_GUIDES) {
    for (const s of g.sources) add(g.name, { label: s.label, url: s.url, kind: "Immigration", checked: g.checked });
    for (const o of g.options) if (o.url) add(g.name, { label: o.name, url: o.url, kind: "Immigration", checked: g.checked });
  }
  // Links typed into a country page in Admin → Website
  const { data: rows } = await db().from("countries").select("country_name,kind,visa_name,facts_source_url,facts_last_checked").not("facts_source_url", "is", null);
  for (const r of rows ?? []) if (r.facts_source_url) add(r.country_name, { label: `${r.visa_name ?? r.country_name} (source on the page)`, url: r.facts_source_url, kind: KIND[r.kind as keyof typeof KIND] ?? "Visit", checked: r.facts_last_checked });

  const countries = [...byCountry.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, list]) => [name, list.filter((r) => !q || `${name} ${r.label} ${r.kind} ${r.url}`.toLowerCase().includes(q))] as const).filter(([, list]) => list.length);
  const total = countries.reduce((s, [, l]) => s + l.length, 0);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Title sub="Official pages to apply, read the rules and find universities. Only you and your team see this. Visitors do not.">Useful links</Title>
      <form method="get" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input name="q" defaultValue={q} className="field" placeholder="Search a country or a word (visa, study, fee…)" aria-label="Search links" style={{ flex: "1 1 240px" }} />
        <button className="btn btn-primary">Search</button>
        {q && <Link className="btn btn-outline" href="/admin/links">Show all</Link>}
      </form>
      <p style={{ margin: 0, color: "var(--muted)" }}>{total} links in {countries.length} countries. They open the official website in a new tab.</p>
      {countries.length ? countries.map(([name, list]) => (
        <Card key={name} title={name}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "minmax(0, 1fr)" }}>
            {list.map((r) => (
              <li key={r.url} style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap", padding: "9px 0", borderTop: "1px solid var(--line)" }}>
                <Badge color="var(--navy)">{r.kind}</Badge>
                <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{r.label}</a>
                <span style={{ color: "var(--muted)", fontSize: 13, overflowWrap: "anywhere" }}>{host(r.url)}{r.checked ? ` · read ${day(r.checked)}` : ""}</span>
              </li>
            ))}
          </ul>
        </Card>
      )) : <Empty text="No link matches your search." />}
    </div>
  );
}
