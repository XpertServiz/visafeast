import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { db } from "@/lib/server/admin-data";
import { SEED_COUNTRIES } from "@/lib/seed";
import { GUIDES, IMMIGRATION_GUIDES, WORK_GUIDES } from "@/lib/guides";
import { PROCESSES, type Who } from "@/lib/guides/process";
import { Badge, Card, Empty, Title, day } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Useful links" };

interface Row { label: string; url: string; kind: "Visit" | "Study" | "Immigration" | "Work permit"; checked: string | null }
const KIND = { visit: "Visit", study: "Study", immigration: "Immigration", work: "Work permit" } as const;
const WHO_COLOR: Record<Who, string> = { Visafeast: "var(--navy)", Client: "var(--amber-text)", Employer: "var(--stamp-purple)", Official: "var(--stamp-blue)" };
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
  for (const g of WORK_GUIDES) {
    for (const s of g.sources) add(g.name, { label: s.label, url: s.url, kind: "Work permit", checked: g.checked });
    for (const o of g.options) if (o.url) add(g.name, { label: o.name, url: o.url, kind: "Work permit", checked: g.checked });
  }
  // Links typed into a country page in Admin → Website
  const { data: rows } = await db().from("countries").select("country_name,kind,visa_name,facts_source_url,facts_last_checked").not("facts_source_url", "is", null);
  for (const r of rows ?? []) if (r.facts_source_url) add(r.country_name, { label: `${r.visa_name ?? r.country_name} (source on the page)`, url: r.facts_source_url, kind: KIND[r.kind as keyof typeof KIND] ?? "Visit", checked: r.facts_last_checked });

  const countries = [...byCountry.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, list]) => [name, list.filter((r) => !q || `${name} ${r.label} ${r.kind} ${r.url}`.toLowerCase().includes(q))] as const).filter(([, list]) => list.length);
  const total = countries.reduce((s, [, l]) => s + l.length, 0);

  // Step-by-step guides (staff only). They match the search box on the country name, the steps and the link names.
  const processes = PROCESSES.flatMap((p) => {
    const g = WORK_GUIDES.find((x) => x.slug === p.slug);
    if (!g) return [];
    const text = `${g.name} ${g.h1} work permit step by step apply ${p.steps.map((st) => `${st.title} ${st.detail} ${st.links.map((l) => l.label).join(" ")}`).join(" ")}`.toLowerCase();
    return !q || text.includes(q) ? [{ p, g }] : [];
  }).sort((a, b) => a.g.name.localeCompare(b.g.name));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Title sub="Step-by-step guides to apply, plus the official pages for every country. Only you and your team see this. Visitors do not.">Useful links</Title>
      <form method="get" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input name="q" defaultValue={q} className="field" placeholder="Search a country or a word (visa, study, fee…)" aria-label="Search links" style={{ flex: "1 1 240px" }} />
        <button className="btn btn-primary">Search</button>
        {q && <Link className="btn btn-outline" href="/admin/links">Show all</Link>}
      </form>
      <p style={{ margin: 0, color: "var(--muted)" }}>{processes.length > 0 ? <><a href="#steps" style={{ fontWeight: 600 }}>Step-by-step guides ({processes.length})</a> · </> : null}{total} links in {countries.length} countries. They open the official website in a new tab.</p>
      {processes.length > 0 && (
        <Card id="steps" title="How to apply, step by step (work permits)">
          <p style={{ margin: "0 0 12px", color: "var(--muted)" }}>Open a country, then follow the steps from 1 to the end. Every step says who does it and has the official page to open. The amber button is the page where the application is made. Visitors never see this: the website assistant tells them to send an enquiry.</p>
          <div style={{ display: "grid", gap: 10 }}>
            {processes.map(({ p, g }) => (
              <details key={p.slug} open={Boolean(q)} style={{ border: "1px solid var(--line)", borderRadius: 12, background: "#fff" }}>
                <summary style={{ cursor: "pointer", padding: "14px 16px", minHeight: 48, display: "flex", alignItems: "center", gap: 10, fontWeight: 600, flexWrap: "wrap" }}>
                  <span>{g.name}</span>
                  <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 14 }}>{g.options.map((o) => o.name).slice(0, 3).join(" · ")}{g.options.length > 3 ? " …" : ""}</span>
                </summary>
                <div style={{ padding: "4px 16px 16px" }}>
                  <p style={{ margin: "0 0 10px", color: "var(--muted)", fontSize: 13 }}>Read on the official pages {day(p.checked)}. Fees and rules change: check the page before you tell a client a figure.</p>
                  <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
                    {p.steps.map((st, i) => (
                      <li key={st.title} style={{ display: "flex", gap: 12, padding: 12, border: "1px solid var(--line)", borderRadius: 10 }}>
                        <span className="mono" style={{ flex: "none", width: 30, height: 30, borderRadius: "50%", background: "var(--navy)", color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{i + 1}</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><b>{st.title}</b><Badge color={WHO_COLOR[st.who]}>{st.who}</Badge></div>
                          <p style={{ margin: "6px 0 0", lineHeight: 1.55 }}>{st.detail}</p>
                          {st.links.length > 0 && (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                              {st.links.map((l) => (
                                <a key={l.url + l.label} href={l.url} target="_blank" rel="noopener noreferrer" className={l.apply ? "btn btn-primary" : "btn btn-outline"} style={{ minHeight: 44, padding: "8px 14px", fontSize: 14, textAlign: "start", overflowWrap: "anywhere" }}>
                                  {l.apply ? "Apply: " : ""}{l.label} <span style={{ opacity: 0.7, fontWeight: 400 }}>· {host(l.url)}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            ))}
          </div>
        </Card>
      )}
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
