import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { db } from "@/lib/server/admin-data";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { Card, Empty, Grid, Stat, Title } from "@/components/admin/ui";
import { automated, automatedSessions, inHub, sessionKey } from "@/lib/bots";

export const dynamic = "force-dynamic";
export const metadata = { title: "Visitors" };

const RANGES = [[1, "Last 24 hours"], [7, "Last 7 days"], [30, "Last 30 days"], [90, "Last 90 days"]] as const;
const names = new Intl.DisplayNames(["en"], { type: "region" });
const flag = (cc: string | null) => (cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0))) : "🌐");
const country = (cc: string | null) => { try { return cc && /^[A-Z]{2}$/.test(cc) ? names.of(cc) ?? cc : "Unknown"; } catch { return cc ?? "Unknown"; } };
const cap = (s: string | null | undefined) => (s ? s[0].toUpperCase() + s.slice(1) : "Unknown");
const pct = (n: number, t: number) => (t ? Math.round((n / t) * 100) : 0);

interface V { screen: string | null; path: string; referrer_host: string | null; utm_source: string | null; country: string | null; city: string | null; device: string | null; browser: string | null; os: string | null; browser_language: string | null; site_locale: string | null; visitor_hash: string | null; session_id: string | null; is_new_visitor: boolean | null; landing: boolean | null; duration_ms: number | null; ts: string }

const source = (r: V) => r.utm_source || (r.referrer_host ? (/google/.test(r.referrer_host) ? "Google" : /facebook|fb\./.test(r.referrer_host) ? "Facebook" : /instagram/.test(r.referrer_host) ? "Instagram" : /youtube|youtu\.be/.test(r.referrer_host) ? "YouTube" : /whatsapp|wa\.me/.test(r.referrer_host) ? "WhatsApp" : r.referrer_host) : "Direct");

/** Counts people (distinct visitors) and views per value, biggest first. */
function group(rows: V[], key: (r: V) => string | null | undefined, n = 10) {
  const m = new Map<string, { people: Set<string>; views: number }>();
  for (const r of rows) {
    const k = key(r) || "Unknown";
    const e = m.get(k) ?? { people: new Set<string>(), views: 0 };
    e.people.add(r.visitor_hash ?? r.session_id ?? "?"); e.views++; m.set(k, e);
  }
  return [...m.entries()].map(([name, e]) => ({ name, n: e.people.size, views: e.views })).sort((a, b) => b.n - a.n || b.views - a.views).slice(0, n);
}

function Bars({ title, rows, total, label, empty = "No data yet." }: { title: string; rows: { name: string; n: number; views: number }[]; total: number; label?: (k: string) => string; empty?: string }) {
  return (
    <Card title={title}>
      {rows.length === 0 ? <Empty text={empty} /> : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 12 }}>
          {rows.map((r) => (
            <li key={r.name} style={{ fontSize: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label ? label(r.name) : r.name}</span>
                <span style={{ flex: "none" }}><b>{r.n}</b> <span style={{ color: "var(--muted-2)", fontSize: 13 }}>{pct(r.n, total)}% · {r.views} views</span></span>
              </div>
              <div style={{ marginTop: 4, height: 6, borderRadius: 99, background: "#EEE8DC", overflow: "hidden" }}><div style={{ height: 6, borderRadius: 99, background: "var(--navy)", width: `${Math.max(3, pct(r.n, total))}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default async function Visitors({ searchParams }: { searchParams: Promise<{ days?: string; bots?: string }> }) {
  const admin = await getAdmin();
  if (!admin || !can.website(admin.role)) redirect("/admin");
  const sp = await searchParams;
  const showBots = sp.bots === "show";
  const asked = Number(sp.days);
  const days = RANGES.some(([d]) => d === asked) ? asked : 7;
  const d = db();
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const [{ data: pv }, { data: live }, { data: ev }, { data: leads }, { data: first }] = await Promise.all([
    d.from("page_views").select("path,screen,referrer_host,utm_source,country,city,device,browser,os,browser_language,site_locale,visitor_hash,session_id,is_new_visitor,landing,duration_ms,ts").gte("ts", since).order("ts", { ascending: false }).limit(20000),
    d.from("live_presence").select("country,city,path,device,browser_language,referrer_host").gte("last_seen", new Date(Date.now() - 5 * 60_000).toISOString()),
    d.from("events").select("name").gte("ts", since).limit(20000),
    d.from("leads").select("nationality,residence_country").gte("created_at", since).limit(5000),
    d.from("page_views").select("ts").order("ts", { ascending: true }).limit(1),
  ]);
  const all = (pv ?? []) as V[];
  // robots that behave like visitors (see lib/bots.ts) are hidden unless asked for
  const robots = automatedSessions(all.map((r) => ({ lang: r.browser_language, os: r.os, screen: r.screen, city: r.city, session_id: r.session_id, visitor_hash: r.visitor_hash, duration_ms: r.duration_ms })));
  const v = showBots ? all : all.filter((r) => !robots.has(sessionKey(r)));
  const hiddenViews = all.length - v.length, hiddenPeople = new Set(all.filter((r) => robots.has(sessionKey(r))).map((r) => r.visitor_hash ?? r.session_id)).size;
  const people = new Set(v.map((r) => r.visitor_hash ?? r.session_id)).size;
  const fresh = new Set(v.filter((r) => r.is_new_visitor).map((r) => r.visitor_hash ?? r.session_id)).size;
  const perSession = new Map<string, number>();
  for (const r of v) if (r.session_id) perSession.set(r.session_id, (perSession.get(r.session_id) ?? 0) + 1);
  const sessions = perSession.size || (v.length ? 1 : 0);
  const bounced = [...perSession.values()].filter((c) => c === 1).length;
  const home = v.filter((r) => r.path === "/" || r.path === "/ur").length;
  const timed = v.filter((r) => r.duration_ms);
  const avgSec = timed.length ? Math.round(timed.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / timed.length / 1000) : 0;

  // chart: every day in the range, even quiet ones (UTC days)
  const byDay = new Map<string, { views: number; people: Set<string> }>();
  for (const r of v) { const k = r.ts.slice(0, 10); const e = byDay.get(k) ?? { views: 0, people: new Set<string>() }; e.views++; e.people.add(r.visitor_hash ?? r.session_id ?? "?"); byDay.set(k, e); }
  const span = Math.min(days === 1 ? 2 : days, 90);
  const chart = Array.from({ length: span }, (_, i) => {
    const dt = new Date(Date.now() - (span - 1 - i) * 86400_000), k = dt.toISOString().slice(0, 10), e = byDay.get(k);
    return { label: dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }), views: e?.views ?? 0, people: e?.people.size ?? 0 };
  });
  const max = Math.max(1, ...chart.map((c) => c.views));
  const hours = new Array(24).fill(0) as number[];
  for (const r of v) hours[new Date(r.ts).getUTCHours()]++;
  const peak = hours.indexOf(Math.max(...hours));
  const evc = (n: string) => (ev ?? []).filter((e) => e.name === n).length;
  const L = (leads ?? []) as { nationality: string | null; residence_country: string | null }[];
  const lgroup = (key: (r: (typeof L)[number]) => string | null) => { const m = new Map<string, number>(); for (const r of L) { const k = key(r) || "Unknown"; m.set(k, (m.get(k) ?? 0) + 1); } return [...m.entries()].map(([name, n]) => ({ name, n, views: n })).sort((a, b) => b.n - a.n).slice(0, 8); };
  const liveRows = (live ?? []).filter((r) => showBots || !(automated({ lang: r.browser_language }) || inHub(r.city)));
  const since1 = first?.[0]?.ts ? new Date(first[0].ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;
  const tab = (k: number, l: string) => <a key={k} href={`?days=${k}${showBots ? "&bots=show" : ""}`} className="chip" style={{ textDecoration: "none", background: days === k ? "var(--navy)" : undefined, color: days === k ? "#fff" : undefined, minHeight: 44, display: "inline-flex", alignItems: "center" }}>{l}</a>;

  return (
    <>
      <AutoRefresh seconds={60} />
      <Title sub="Who is visiting your website: how many people, from which countries, on which device and where they found you. No IP addresses are stored.">Visitors</Title>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>{RANGES.map(([k, l]) => tab(k, l))}</div>
      <p style={{ margin: "0 0 14px", fontSize: 14, color: "var(--muted)" }}>
        {showBots
          ? <>Showing everything, including likely robots. <a href={`?days=${days}`}>Hide likely robots</a></>
          : hiddenViews > 0
            ? <>Hidden: {hiddenPeople} likely robot visitor{hiddenPeople === 1 ? "" : "s"} ({hiddenViews} page views) from data centres or with robot signs. <a href={`?days=${days}&bots=show`}>Show them</a></>
            : <>Likely robots (scanners and monitoring tools) are hidden. None in this period.</>}
      </p>
      <Grid min={200}>
        <Stat label="Visitors" value={people} /><Stat label="Page views" value={v.length} /><Stat label="Visits (sessions)" value={sessions} /><Stat label="Homepage views" value={home} />
      </Grid>
      <p style={{ color: "var(--muted)", fontSize: 14, margin: "8px 0 0" }}>
        {fresh} new · {Math.max(0, people - fresh)} returning · {sessions ? `${(v.length / sessions).toFixed(1)} pages per visit` : "no visits yet"} · {sessions ? `${pct(bounced, sessions)}% left after one page` : ""}{avgSec ? ` · ${avgSec} s on a page` : ""}
      </p>
      <p style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", alignItems: "center", margin: "14px 0 18px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span aria-hidden style={{ width: 10, height: 10, borderRadius: 99, background: "var(--amber)" }} /><b>{liveRows.length}</b> on the website right now (last 5 minutes)</span>
        {v.length > 0 && <span>Busiest hour: <b>{peak}:00–{peak + 1}:00 UTC</b></span>}
        {since1 && <span style={{ color: "var(--muted-2)" }}>Counting since {since1}</span>}
      </p>

      <Card title={`Visitors and page views per day — ${RANGES.find(([k]) => k === days)![1].toLowerCase()}`}>
        {v.length === 0 ? <Empty text="No visits recorded in this period yet. They appear here within a few seconds of someone opening your website." /> : (
          <div>
            <div role="img" aria-label="Daily page views" style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 176 }}>
              {chart.map((c, i) => (
                <div key={i} title={`${c.label}: ${c.views} views, ${c.people} visitors`} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", minWidth: 2 }}>
                  <div style={{ width: "100%", height: `${(c.views / max) * 100}%`, background: "rgba(10,26,51,.22)", borderRadius: "4px 4px 0 0" }}>
                    <div style={{ width: "100%", height: c.views ? `${(c.people / c.views) * 100}%` : 0, background: "var(--navy)", borderRadius: "4px 4px 0 0" }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--muted-2)" }}><span>{chart[0].label}</span><span>{chart[chart.length - 1].label}</span></div>
            <p style={{ display: "flex", gap: 16, margin: "8px 0 0", fontSize: 13, color: "var(--muted-2)" }}><span><i style={{ display: "inline-block", width: 10, height: 10, background: "var(--navy)", borderRadius: 2, marginInlineEnd: 6 }} />Visitors</span><span><i style={{ display: "inline-block", width: 10, height: 10, background: "rgba(10,26,51,.22)", borderRadius: 2, marginInlineEnd: 6 }} />Page views</span></p>
          </div>
        )}
      </Card>

      <div style={{ height: 16 }} />
      <Grid min={340}>
        <Card title="Live now">
          {liveRows.length ? <div style={{ display: "grid", gap: 8 }}>{liveRows.map((r, i) => <p key={i} style={{ margin: 0 }}>{flag(r.country)} {r.city ?? country(r.country)} · <span className="mono" style={{ fontSize: 13 }}>{r.path}</span> · {r.device} · {r.referrer_host ?? "direct"}</p>)}</div> : <Empty text="Nobody right now." />}
        </Card>
        <Bars title="What visitors did" total={Math.max(1, people)} rows={[["WhatsApp clicks", evc("whatsapp_click")], ["Enquiries sent", L.length], ["Call-booking clicks", evc("booking_click")], ["Eligibility checks", evc("eligibility_complete")], ["Checklist downloads", evc("checklist_download")], ["Decoder used", evc("decoder_used")], ["Video plays", evc("video_click")]].map(([name, n]) => ({ name: name as string, n: n as number, views: n as number }))} />
        <Bars title="Countries" total={people} rows={group(v, (r) => r.country)} label={(k) => `${flag(k === "Unknown" ? null : k)}  ${country(k === "Unknown" ? null : k)}`} empty="Countries show up once people visit." />
        <Bars title="Cities" total={people} rows={group(v, (r) => r.city)} />
        <Bars title="Pages people open" total={people} rows={group(v, (r) => r.path)} label={(k) => (k === "/" ? "/  (homepage)" : k)} />
        <Bars title="Where they came from" total={people} rows={group(v, source)} />
        <Bars title="Device" total={people} rows={group(v, (r) => cap(r.device))} />
        <Bars title="Browser" total={people} rows={group(v, (r) => r.browser)} />
        <Bars title="Operating system" total={people} rows={group(v, (r) => r.os)} />
        <Bars title="Browser language" total={people} rows={group(v, (r) => r.browser_language)} />
        <Bars title="Site language used" total={people} rows={group(v, (r) => (r.site_locale === "ur" ? "اردو" : "English"))} />
        <Bars title="Nationality (from enquiries)" total={Math.max(1, L.length)} rows={lgroup((r) => r.nationality)} />
        <Bars title="Living in (from enquiries)" total={Math.max(1, L.length)} rows={lgroup((r) => r.residence_country)} />
      </Grid>

      <div style={{ height: 16 }} />
      <Card title="Latest visits">
        {v.length === 0 ? <Empty text="Nothing yet." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 560 }}>
              <thead><tr style={{ textAlign: "start", color: "var(--muted-2)" }}>{["When", "Where from", "Opened", "Came from", "Device", ""].map((h) => <th key={h} style={{ textAlign: "start", padding: "6px 8px", fontWeight: 600 }}>{h}</th>)}</tr></thead>
              <tbody>
                {v.slice(0, 40).map((r, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{new Date(r.ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" })}</td>
                    <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{flag(r.country)} {r.city ? `${r.city}, ` : ""}{country(r.country)}</td>
                    <td className="mono" style={{ padding: "8px", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13 }}>{r.path}</td>
                    <td style={{ padding: "8px" }}>{source(r)}</td>
                    <td style={{ padding: "8px", whiteSpace: "nowrap", color: "var(--muted)" }}>{cap(r.device)} · {r.browser ?? "?"} · {r.os ?? "?"}</td>
                    <td style={{ padding: "8px" }}>{r.is_new_visitor && <span className="mono" style={{ fontSize: 11, color: "var(--amber-text)", fontWeight: 600 }}>NEW</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ color: "var(--muted-2)", fontSize: 12, margin: "8px 0 0" }}>Times are Pakistan time. The chart and busiest hour use UTC.</p>
          </div>
        )}
      </Card>
    </>
  );
}
