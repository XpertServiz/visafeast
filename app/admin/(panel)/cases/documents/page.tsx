import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/server/admin-data";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { Badge, Empty, Title, day } from "@/components/admin/ui";
import { reviewDoc } from "../../../actions";
import { storageUsed } from "@/lib/server/storage";
import { KEEP_DAYS, capBytes, daysLeft, mb, usedPercent } from "@/lib/storage-policy";

export const dynamic = "force-dynamic";
const FILTERS = [["uploaded", "To check"], ["rejected", "Asked again"], ["approved", "Approved"], ["all", "All"]] as const;
const COLOUR: Record<string, string> = { uploaded: "var(--amber-text)", approved: "var(--ok)", rejected: "var(--bad)" };
const LABEL: Record<string, string> = { uploaded: "To check", approved: "Approved", rejected: "Asked again" };

/** Every client document that has a file, newest first. */
export default async function AllDocuments({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const a = (await getAdmin())!;
  if (!can.people(a.role)) redirect("/admin");
  const { show = "uploaded" } = await searchParams;
  let q = db().from("case_documents").select("id,title,status,file_name,uploaded_at,uploaded_by,person_id,person:people(id,full_name),case:cases(ref,person_id,person:people(id,full_name))").not("file_path", "is", null).order("uploaded_at", { ascending: false }).limit(200);
  if (show !== "all") q = q.eq("status", show);
  const { data } = await q;
  type Who = { id: string; full_name: string | null } | null;
  type Row = { id: string; title: string; status: string; file_name: string | null; uploaded_at: string | null; uploaded_by: string | null; person: Who; case: { ref: string; person: Who } | null };
  const rows = (data ?? []) as unknown as Row[];
  const used = await storageUsed(db()), cap = capBytes(), pct = usedPercent(used, cap);
  // one block per file (Client ID), the newest upload first
  const groups: { key: string; ref: string | null; who: Who; rows: Row[] }[] = [];
  for (const r of rows) {
    const who = r.person ?? r.case?.person ?? null;
    const key = r.case?.ref ?? `p:${who?.id ?? r.id}`;
    const g = groups.find((x) => x.key === key);
    if (g) g.rows.push(r); else groups.push({ key, ref: r.case?.ref ?? null, who, rows: [r] });
  }
  return (
    <>
      <Title sub="Every document your clients have sent, grouped by their file (Client ID).">Documents by file</Title>
      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <p style={{ margin: "0 0 8px" }}><b>Storage: {mb(used)} of {mb(cap)} ({pct}%)</b> <span style={{ color: "var(--muted)" }}>· Files are removed automatically {KEEP_DAYS} days after upload. Download what you need before then.</span></p>
        <div aria-hidden style={{ height: 10, borderRadius: 99, background: "#E4DED3", overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: pct >= 80 ? "var(--bad)" : "var(--ok)" }} /></div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map(([k, l]) => <Link key={k} href={`/admin/cases/documents?show=${k}`} className="chip" style={{ textDecoration: "none", fontSize: 15, padding: "10px 16px", fontWeight: show === k ? 700 : 400 }}>{l}</Link>)}
      </div>
      {rows.length ? (
        <div style={{ display: "grid", gap: 16 }}>
          {groups.map((g) => (
            <section key={g.key} className="card" style={{ padding: 16 }}>
              <h2 style={{ margin: "0 0 10px", fontSize: 18, display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                {g.ref ? <Link href={`/admin/cases/${g.ref}`} className="mono">{g.ref}</Link> : <span>No file yet</span>}
                <span style={{ fontWeight: 400 }}>{g.who ? <Link href={`/admin/people/${g.who.id}`}>{g.who.full_name}</Link> : "—"}</span>
                <span style={{ color: "var(--muted)", fontSize: 14, fontWeight: 400 }}>{g.rows.length} document{g.rows.length === 1 ? "" : "s"}</span>
              </h2>
              <div style={{ display: "grid", gap: 8 }}>
                {g.rows.map((r) => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--line)" }}>
                    <span style={{ minWidth: 0, overflowWrap: "anywhere" }}><b>{r.title}</b><br />
                      <span style={{ color: "var(--muted)", fontSize: 14 }}>{r.file_name} · {day(r.uploaded_at)} · from {r.uploaded_by === "staff" ? "consultant" : "client"} · <b style={{ color: r.uploaded_at && daysLeft(r.uploaded_at) <= 7 ? "var(--bad)" : undefined }}>{r.uploaded_at ? `removed in ${Math.max(0, daysLeft(r.uploaded_at))} days` : ""}</b></span></span>
                    <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <Badge color={COLOUR[r.status]}>{LABEL[r.status] ?? r.status}</Badge>
                      <a className="btn btn-outline" style={{ minHeight: 44 }} href={`/admin/docs/${r.id}`}>Open file</a>
                      {r.status !== "approved" && <form action={reviewDoc}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="approved" /><input type="hidden" name="path" value="/admin/cases/documents" /><button className="btn btn-dark" style={{ minHeight: 44 }}>Approve</button></form>}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : <Empty text="Nothing here right now." />}
    </>
  );
}
