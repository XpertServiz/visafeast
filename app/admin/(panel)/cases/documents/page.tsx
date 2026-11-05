import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/server/admin-data";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { Badge, Empty, Title, day } from "@/components/admin/ui";
import { reviewDoc } from "../../../actions";

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
  return (
    <>
      <Title sub="Every file your clients have sent.">Client documents</Title>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map(([k, l]) => <Link key={k} href={`/admin/cases/documents?show=${k}`} className="chip" style={{ textDecoration: "none", fontSize: 15, padding: "10px 16px", fontWeight: show === k ? 700 : 400 }}>{l}</Link>)}
      </div>
      {rows.length ? <div style={{ display: "grid", gap: 10 }}>{rows.map((r) => {
        const who = r.person ?? r.case?.person ?? null;
        return (
          <div key={r.id} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ minWidth: 0, overflowWrap: "anywhere" }}><b>{r.title}</b> · {who ? <Link href={`/admin/people/${who.id}`}>{who.full_name}</Link> : "—"}{r.case ? <> · <Link href={`/admin/cases/${r.case.ref}`} className="mono">{r.case.ref}</Link></> : null}<br />
              <span style={{ color: "var(--muted)", fontSize: 14 }}>{r.file_name} · {day(r.uploaded_at)} · from {r.uploaded_by === "staff" ? "consultant" : "client"}</span></span>
            <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Badge color={COLOUR[r.status]}>{LABEL[r.status] ?? r.status}</Badge>
              <a className="btn btn-outline" style={{ minHeight: 44 }} href={`/admin/docs/${r.id}`}>Open file</a>
              {r.status !== "approved" && <form action={reviewDoc}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="approved" /><input type="hidden" name="path" value="/admin/cases/documents" /><button className="btn btn-dark" style={{ minHeight: 44 }}>Approve</button></form>}
            </span>
          </div>
        );
      })}</div> : <Empty text="Nothing here right now." />}
    </>
  );
}
