import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { db } from "@/lib/server/admin-data";
import { Badge, Card, Empty, Title, day } from "@/components/admin/ui";
import { REVIEW_DUE_DAYS, TYPE_LABEL, VERDICT_LABEL } from "@/config/reality-check";
import { reviewDue, type RealityCheck } from "@/lib/reality";
import { saveDoNotName } from "../../reality-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reality Check" };

export default async function RealityAdmin({ searchParams }: { searchParams: Promise<{ filter?: string; ok?: string }> }) {
  const admin = await getAdmin(); if (!admin || !can.website(admin.role)) redirect("/admin");
  const { filter, ok } = await searchParams;
  const [{ data }, { data: set }] = await Promise.all([
    db().from("reality_checks").select("id,slug,title,country,type,verdict,status,verified_on,updated_at").order("updated_at", { ascending: false }),
    db().from("reality_settings").select("do_not_name").eq("id", 1).maybeSingle(),
  ]);
  const all = (data ?? []) as Pick<RealityCheck, "id" | "slug" | "title" | "country" | "type" | "verdict" | "status" | "verified_on" | "updated_at">[];
  const due = all.filter((r) => reviewDue(r.verified_on));
  const rows = filter === "due" ? due : filter === "draft" ? all.filter((r) => r.status === "draft") : filter === "published" ? all.filter((r) => r.status === "published") : all;
  const chip = (k: string, label: string) => <Link key={k} className="chip" href={k ? `?filter=${k}` : "?"} style={{ textDecoration: "none", background: (filter ?? "") === k ? "var(--navy)" : undefined, color: (filter ?? "") === k ? "#fff" : undefined }}>{label}</Link>;
  return (
    <>
      <Title sub="Short fact-checks of visa claims. Every post needs an official source link before it can go live." action={<Link className="btn btn-primary" href="/admin/reality-check/new">New fact-check</Link>}>Reality Check</Title>
      {ok && <p role="status" className="card" style={{ padding: 12, borderColor: "var(--ok)" }}>{ok}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>{chip("", "All")}{chip("published", "Live")}{chip("draft", "Drafts")}{chip("due", `Review due (${due.length})`)}</div>
      {rows.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((r) => (
            <Link key={r.id} href={`/admin/reality-check/${r.id}`} className="card lift" style={{ padding: 14, textDecoration: "none", color: "var(--ink)", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                <b>{r.title}</b><br />
                <span style={{ color: "var(--muted)", fontSize: 14 }}>{[r.country, TYPE_LABEL[r.type], VERDICT_LABEL[r.verdict]].filter(Boolean).join(" · ")} · verified {day(r.verified_on)}</span>
              </span>
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {reviewDue(r.verified_on) && <Badge color="var(--amber-text)">REVIEW DUE</Badge>}
                <Badge color={r.status === "published" ? "var(--ok)" : "var(--muted-2)"}>{r.status === "published" ? "LIVE" : "DRAFT"}</Badge>
              </span>
            </Link>
          ))}
        </div>
      ) : <Empty text={filter === "due" ? `Nothing is older than ${REVIEW_DUE_DAYS} days. Good.` : "No fact-checks yet."} />}
      <div style={{ marginTop: 24, maxWidth: 560 }}>
        <Card title="Names that must never appear">
          <form action={saveDoNotName} style={{ display: "grid", gap: 10 }}>
            <p style={{ margin: 0, color: "var(--muted)" }}>Type any agency, page or person you must not name. One per line. A post that contains one cannot be published.</p>
            <textarea name="names" rows={3} className="field" defaultValue={(set?.do_not_name ?? []).join("\n")} maxLength={2000} aria-label="Names that must never appear" />
            <button className="btn btn-outline" style={{ justifySelf: "start" }}>Save names</button>
          </form>
        </Card>
      </div>
    </>
  );
}
