import { db } from "@/lib/server/admin-data";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { Card, Empty, Grid, Stat } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const FLAG = (cc: string | null) => (cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0))) : "🌐");
function top<T>(rows: T[], key: (r: T) => string | null | undefined, n = 8) {
  const m = new Map<string, number>();
  for (const r of rows) { const k = key(r) || "(unknown)"; m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}
const Bars = ({ items, fmt }: { items: [string, number][]; fmt?: (k: string) => string }) => {
  const max = Math.max(1, ...items.map((i) => i[1]));
  return <div style={{ display: "grid", gap: 6 }}>{items.length ? items.map(([k, v]) => (
    <div key={k} style={{ display: "grid", gridTemplateColumns: "minmax(80px, 40%) 1fr 40px", gap: 8, alignItems: "center", fontSize: 15 }}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmt ? fmt(k) : k}</span>
      <span style={{ background: "#EEE8DC", borderRadius: 99, height: 10 }}><i style={{ display: "block", height: 10, borderRadius: 99, background: "var(--navy)", width: `${(v / max) * 100}%` }} /></span><b>{v}</b>
    </div>)) : <Empty text="No data yet." />}</div>;
};

export default async function Visitors({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = [1, 7, 30, 90].includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 7;
  const d = db();
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const [{ data: pv }, { data: live }, { data: ev }, { data: leads }] = await Promise.all([
    d.from("page_views").select("path,referrer_host,utm_source,country,city,device,browser,browser_language,site_locale,visitor_hash,is_new_visitor,landing,duration_ms,ts").gte("ts", since).order("ts", { ascending: false }).limit(20000),
    d.from("live_presence").select("country,city,path,device,browser_language,referrer_host").gte("last_seen", new Date(Date.now() - 2 * 60_000).toISOString()),
    d.from("events").select("name,path").gte("ts", since).limit(20000),
    d.from("leads").select("nationality,residence_country,source").gte("created_at", since).limit(5000),
  ]);
  const v = pv ?? [];
  const uniq = new Set(v.map((r) => r.visitor_hash)).size;
  const sessions = v.filter((r) => r.landing).length || 1;
  const avgMs = v.filter((r) => r.duration_ms).reduce((s, r, _, a) => s + (r.duration_ms ?? 0) / a.length, 0);
  const evc = (n: string) => (ev ?? []).filter((e) => e.name === n).length;
  const src = (r: (typeof v)[number]) => r.utm_source || (r.referrer_host ? (/google/.test(r.referrer_host) ? "Google" : /facebook|fb\./.test(r.referrer_host) ? "Facebook" : /instagram/.test(r.referrer_host) ? "Instagram" : /youtube|youtu\.be/.test(r.referrer_host) ? "YouTube" : /whatsapp|wa\.me/.test(r.referrer_host) ? "WhatsApp" : r.referrer_host) : "Direct");
  const liveRows = live ?? [];

  return (
    <>
      <AutoRefresh seconds={10} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>{[[1, "Today"], [7, "7 days"], [30, "30 days"], [90, "90 days"]].map(([k, l]) => <a key={k} className="chip" href={`?days=${k}`} style={{ textDecoration: "none", background: days === k ? "var(--navy)" : undefined, color: days === k ? "#fff" : undefined }}>{l}</a>)}</div>
      <Grid min={170}>
        <Stat label="On the site right now" value={liveRows.length} tone="ok" /><Stat label="People" value={uniq} /><Stat label="Pages viewed" value={v.length} />
        <Stat label="Pages per visit" value={(v.length / sessions).toFixed(1)} /><Stat label="Avg. time on page" value={`${Math.round(avgMs / 1000)} s`} /><Stat label="New people" value={v.filter((r) => r.is_new_visitor).length} />
      </Grid>
      <div style={{ height: 16 }} />
      <Grid min={340}>
        <Card title="Live now"><div style={{ display: "grid", gap: 6 }}>{liveRows.length ? liveRows.map((r, i) => <p key={i} style={{ margin: 0 }}>{FLAG(r.country)} {r.city ?? r.country ?? "?"} · <span className="mono" style={{ fontSize: 13 }}>{r.path}</span> · {r.device} · {r.browser_language} · {r.referrer_host ?? "direct"}</p>) : <Empty text="Nobody right now." />}</div></Card>
        <Card title="Countries"><Bars items={top(v, (r) => r.country)} fmt={(k) => `${FLAG(k)} ${k}`} /></Card>
        <Card title="Cities"><Bars items={top(v, (r) => r.city)} /></Card>
        <Card title="Top pages"><Bars items={top(v, (r) => r.path)} /></Card>
        <Card title="Where they came from"><Bars items={top(v, src)} /></Card>
        <Card title="Devices"><Bars items={top(v, (r) => r.device)} /></Card>
        <Card title="Browser language"><Bars items={top(v, (r) => r.browser_language)} /></Card>
        <Card title="Site language used"><Bars items={top(v, (r) => (r.site_locale === "ur" ? "اردو" : "English"))} /></Card>
        <Card title="Nationality (from enquiries)"><Bars items={top(leads ?? [], (r) => r.nationality)} /></Card>
        <Card title="Living in (from enquiries)"><Bars items={top(leads ?? [], (r) => r.residence_country)} /></Card>
        <Card title="What visitors did"><Bars items={[["WhatsApp clicks", evc("whatsapp_click")], ["Enquiries", (leads ?? []).length], ["Calls booked clicks", evc("booking_click")], ["Eligibility checks", evc("eligibility_complete")], ["Checklist downloads", evc("checklist_download")], ["Decoder used", evc("decoder_used")]]} /></Card>
      </Grid>
    </>
  );
}
