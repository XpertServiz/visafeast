import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { db } from "@/lib/server/admin-data";
import { Card, Empty, Title } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activity log" };

const PAGE = 50;

export default async function Activity({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const admin = await getAdmin();
  if (!admin || !can.reports(admin.role)) redirect("/admin");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").replace(/[^a-zA-Z0-9_ -]/g, "").trim().slice(0, 40);
  const d = db();
  let query = d.from("activity_log").select("id,action,target_table,target_id,meta,ts,actor", { count: "exact" }).order("ts", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  if (q) query = query.or(`action.ilike.%${q}%,target_table.ilike.%${q}%`);
  const [{ data, count }, { data: team }] = await Promise.all([query, d.from("profiles").select("id,full_name")]);
  const who = new Map((team ?? []).map((p) => [p.id, p.full_name ?? "Team member"]));
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const link = (p: number) => `?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <>
      <Title sub="Who did what in the admin: documents opened, money posted, videos and pages changed.">Activity log</Title>
      <form style={{ display: "flex", gap: 8, marginBottom: 14, maxWidth: 480 }}><input name="q" defaultValue={q} className="field" placeholder="Search an action, e.g. doc_download" aria-label="Search the activity log" /><button className="btn btn-outline">Search</button></form>
      <Card>
        {data?.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520, fontSize: 14 }}>
              <thead><tr>{["When", "Who", "What", "On"].map((h) => <th key={h} style={{ textAlign: "start", padding: "6px 8px", color: "var(--muted-2)", fontWeight: 600 }}>{h}</th>)}</tr></thead>
              <tbody>{data.map((l) => (
                <tr key={l.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{new Date(l.ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" })}</td>
                  <td style={{ padding: "8px" }}>{l.actor ? who.get(l.actor) ?? "Team member" : "System"}</td>
                  <td className="mono" style={{ padding: "8px", fontSize: 13 }}>{l.action}</td>
                  <td style={{ padding: "8px", color: "var(--muted)" }}>{l.target_table ?? ""} {l.target_id ? <span className="mono" style={{ fontSize: 12 }}>{String(l.target_id).slice(0, 8)}</span> : null}</td>
                </tr>))}</tbody>
            </table>
          </div>
        ) : <Empty text="Nothing recorded yet." />}
      </Card>
      {pages > 1 && (
        <p style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 14 }}>
          {page > 1 && <a className="btn btn-outline" href={link(page - 1)}>← Newer</a>}
          <span style={{ color: "var(--muted)" }}>Page {page} of {pages}</span>
          {page < pages && <a className="btn btn-outline" href={link(page + 1)}>Older →</a>}
        </p>
      )}
    </>
  );
}
