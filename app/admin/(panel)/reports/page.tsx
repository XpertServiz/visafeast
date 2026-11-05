import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { db } from "@/lib/server/admin-data";
import { Card, Empty, Grid, Stat, Title, pkr } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports" };

const count = (rows: (string | null)[]) => {
  const m = new Map<string, number>();
  for (const r of rows) { const k = r || "Not given"; m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
const nice = (k: string) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

function List({ title, rows }: { title: string; rows: [string, number][] }) {
  const total = rows.reduce((s, r) => s + r[1], 0);
  return (
    <Card title={title}>
      {rows.length ? (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 10 }}>
          {rows.slice(0, 10).map(([k, n]) => (
            <li key={k}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span>{nice(k)}</span><b>{n}</b></div>
              <div style={{ marginTop: 4, height: 6, borderRadius: 99, background: "#EEE8DC" }}><div style={{ height: 6, borderRadius: 99, background: "var(--navy)", width: `${Math.max(3, Math.round((n / total) * 100))}%` }} /></div>
            </li>
          ))}
        </ul>
      ) : <Empty text="Nothing in this period yet." />}
    </Card>
  );
}

export default async function Reports() {
  const admin = await getAdmin();
  if (!admin || !can.reports(admin.role)) redirect("/admin");
  const d = db();
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const s = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1)), e = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 1, 0));
    return { label: s.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }), from: s.toISOString().slice(0, 10), to: e.toISOString().slice(0, 10) };
  });
  const since = new Date(Date.now() - 90 * 86400_000).toISOString();
  const [profits, { data: leads }, { data: cases }] = await Promise.all([
    Promise.all(months.map((m) => d.rpc("report_profit", { p_from: m.from, p_to: m.to }))),
    d.from("leads").select("status,source,destination,visa_type").gte("created_at", since).limit(5000),
    d.from("cases").select("stage").is("deleted_at", null).limit(5000),
  ]);
  const rows = months.map((m, i) => ({ ...m, ...((profits[i].data as { income: number; expenses: number; profit: number }[] | null)?.[0] ?? { income: 0, expenses: 0, profit: 0 }) }));
  const six = rows.reduce((s, r) => ({ income: s.income + Number(r.income), expenses: s.expenses + Number(r.expenses) }), { income: 0, expenses: 0 });
  const L = leads ?? [];
  const lost = L.filter((l) => ["refused", "not_interested"].includes(l.status)).length, won = L.filter((l) => l.status === "approved").length;

  return (
    <>
      <Title sub="Money and enquiries at a glance. Visa and embassy fees collected for clients are never counted as your income.">Reports</Title>
      <Grid min={200}>
        <Stat label="Money in, last 6 months" value={pkr(six.income)} /><Stat label="Money out, last 6 months" value={pkr(six.expenses)} /><Stat label="Profit, last 6 months" value={pkr(six.income - six.expenses)} tone={six.income - six.expenses >= 0 ? "ok" : "bad"} />
        <Stat label="Enquiries, last 90 days" value={L.length} />
      </Grid>
      <div style={{ height: 16 }} />
      <Card title="Month by month">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
            <thead><tr>{["Month", "Money in", "Money out", "Profit"].map((h, i) => <th key={h} style={{ textAlign: i ? "end" : "start", padding: "8px", color: "var(--muted-2)", fontSize: 13 }}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.from} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "10px 8px" }}>{r.label}</td><td style={{ padding: "10px 8px", textAlign: "end" }}>{pkr(r.income)}</td><td style={{ padding: "10px 8px", textAlign: "end" }}>{pkr(r.expenses)}</td>
                <td style={{ padding: "10px 8px", textAlign: "end", fontWeight: 600, color: Number(r.profit) < 0 ? "var(--bad)" : undefined }}>{pkr(r.profit)}</td>
              </tr>))}</tbody>
          </table>
        </div>
        <p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 14 }}>For a date range, the invoice list and the accountant's CSV, open <a href="/admin/money">Money</a>.</p>
      </Card>
      <div style={{ height: 16 }} />
      <Grid min={320}>
        <List title="Enquiries by status (90 days)" rows={count(L.map((l) => l.status))} />
        <List title="Where enquiries came from (90 days)" rows={count(L.map((l) => l.source))} />
        <List title="Countries people ask about (90 days)" rows={count(L.map((l) => l.destination))} />
        <List title="Visa types asked about (90 days)" rows={count(L.map((l) => l.visa_type))} />
        <List title="Cases by stage (all open and closed)" rows={count((cases ?? []).map((c) => c.stage))} />
        <Card title="Outcomes (90 days)"><p style={{ margin: 0 }}><b>{won}</b> enquiries ended in an approved visa.<br /><b>{lost}</b> ended refused or not interested.</p></Card>
      </Grid>
    </>
  );
}
