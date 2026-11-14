import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { db } from "@/lib/server/admin-data";
import { Badge, Empty, Title, day } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aiman leads" };

export interface LeadFilters { status?: string; country?: string; purpose?: string; from?: string; to?: string; q?: string; contacted?: string }
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** One query used by the list and the CSV export, so both always show the same people. */
export function leadQuery(f: LeadFilters, columns: string, limit: number) {
  let q = db().from("aiman_leads").select(columns).order("created_at", { ascending: false }).limit(limit);
  if (f.status === "qualified" || f.status === "not_qualified") q = q.eq("status", f.status);
  if (f.country) { const t = f.country.replace(/[^\p{L}\p{N} ]/gu, "").slice(0, 40); if (t) q = q.ilike("target_country", `%${t}%`); }
  if (f.purpose && ["visit", "study", "work", "immigration"].includes(f.purpose)) q = q.eq("purpose", f.purpose);
  if (f.from && ISO.test(f.from)) q = q.gte("created_at", `${f.from}T00:00:00Z`);
  if (f.to && ISO.test(f.to)) q = q.lte("created_at", `${f.to}T23:59:59Z`);
  if (f.contacted === "no") q = q.eq("contacted", false);
  if (f.q) { const t = f.q.replace(/[^\p{L}\p{N} +@.-]/gu, "").slice(0, 40); if (t) q = q.or(`name.ilike.%${t}%,phone.ilike.%${t}%,city.ilike.%${t}%`); }
  return q;
}

type Row = { id: string; created_at: string; status: string; name: string; phone: string | null; city: string | null; purpose: string | null; target_country: string | null; family_size: number | null; program: string | null; seen: boolean; contacted: boolean; completed_at: string | null; ready: string | null; docs: string | null };

export default async function AimanLeads({ searchParams }: { searchParams: Promise<LeadFilters> }) {
  const admin = await getAdmin(); if (!admin || !can.people(admin.role)) redirect("/admin");
  const f = await searchParams;
  const { data } = await leadQuery(f, "id,created_at,status,name,phone,city,purpose,target_country,family_size,program,seen,contacted,completed_at,ready:answers->>ready,docs:answers->>wantsChecklist", 200);
  const rows = (data ?? []) as unknown as Row[];
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  const field = { minHeight: 44 } as const;

  return (
    <>
      <Title sub="People who finished the Talk with Aiman chat. Green = qualified, amber = not yet qualified." action={<a className="btn btn-outline" href={`/admin/aiman-leads/export${qs ? `?${qs}` : ""}`}>Download CSV</a>}>Aiman leads</Title>
      <form method="get" className="card" style={{ padding: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end", marginBottom: 16 }}>
        <select name="status" defaultValue={f.status ?? ""} className="field" style={field} aria-label="Status"><option value="">Any status</option><option value="qualified">Qualified</option><option value="not_qualified">Not yet qualified</option></select>
        <select name="purpose" defaultValue={f.purpose ?? ""} className="field" style={field} aria-label="Purpose"><option value="">Any purpose</option><option value="visit">Visit</option><option value="study">Study</option><option value="work">Work</option><option value="immigration">Immigration</option></select>
        <input name="country" defaultValue={f.country ?? ""} className="field" style={field} placeholder="Country (e.g. UK)" aria-label="Country" />
        <input name="from" type="date" defaultValue={f.from ?? ""} className="field" style={field} aria-label="From date" />
        <input name="to" type="date" defaultValue={f.to ?? ""} className="field" style={field} aria-label="To date" />
        <input name="q" defaultValue={f.q ?? ""} className="field" style={{ ...field, flex: "1 1 160px" }} placeholder="Name, phone or city" aria-label="Search" />
        <select name="contacted" defaultValue={f.contacted ?? ""} className="field" style={field} aria-label="Contacted"><option value="">All</option><option value="no">Not contacted yet</option></select>
        <button className="btn btn-primary">Filter</button>{qs && <Link className="btn btn-outline" href="/admin/aiman-leads">Clear</Link>}
      </form>
      {rows.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((r) => (
            <Link key={r.id} href={`/admin/aiman-leads/${r.id}`} className="card lift" style={{ padding: 14, textDecoration: "none", color: "var(--ink)", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                {!r.seen && <Badge color="var(--amber-text)">NEW</Badge>} {r.ready === "yes" && <Badge color="var(--ok)">READY TO ENROLL</Badge>} {r.docs === "true" && <Badge color="var(--navy)">WANTS CHECKLIST</Badge>} <b>{r.name}</b> · {r.phone ?? <span style={{ color: "var(--muted)" }}>no phone yet</span>}{r.city ? ` · ${r.city}` : ""}
                <br /><span style={{ color: "var(--muted)", fontSize: 14 }}>{r.purpose} · {r.target_country} · {r.family_size ?? 1} {r.family_size === 1 ? "person" : "people"} · {r.program ?? "—"} · {day(r.created_at)}{r.contacted ? " · contacted" : ""}</span>
              </span>
              <Badge color={r.status === "qualified" ? "var(--ok)" : "var(--amber-text)"}>{r.status === "qualified" ? "QUALIFIED" : "NOT YET QUALIFIED"}</Badge>
            </Link>
          ))}
        </div>
      ) : <Empty text="No leads match. They appear here when someone finishes the chat on /talk-with-aiman." />}
    </>
  );
}
