import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { Title } from "@/components/admin/ui";
import { COUNTRIES, COUNTRY_IDS } from "@/config/aiman";
import { Flag } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checklists" };

const KINDS = [["visit", "Visit"], ["study", "Study"], ["work", "Work permit"], ["immigration", "Immigration"]] as const;
const FLAG: Record<string, string> = { uk: "gb", usa: "us", schengen: "eu", dubai: "ae", saudi: "sa", korea: "kr", srilanka: "lk", newzealand: "nz" };

/** Staff only: a Visafeast-branded PDF document checklist for every country and every service. */
export default async function Checklists() {
  const a = await getAdmin(); if (!a || !can.people(a.role)) redirect("/admin");
  return (
    <>
      <Title sub="A document checklist (PDF with the Visafeast logo) for every country and service. Download it and send it to your client on WhatsApp.">Checklists</Title>
      <div style={{ overflowX: "auto" }}>
        <table className="card" style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead><tr style={{ textAlign: "start", fontSize: 13, color: "var(--muted)" }}>
            <th style={{ padding: 12, textAlign: "start" }}>Country</th>{KINDS.map(([, l]) => <th key={l} style={{ padding: 12, textAlign: "start" }}>{l}</th>)}
          </tr></thead>
          <tbody>
            {COUNTRY_IDS.map((c) => (
              <tr key={c} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, whiteSpace: "nowrap" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Flag code={FLAG[c] ?? c} size={20} />{COUNTRIES[c].en}</span></td>
                {KINDS.map(([k, l]) => (
                  <td key={k} style={{ padding: "6px 12px" }}>
                    <a className="btn btn-outline" style={{ minHeight: 40, padding: "6px 12px", fontSize: 14 }} href={`/admin/checklists/pdf?kind=${k}&c=${c}`} aria-label={`${COUNTRIES[c].en} ${l} checklist PDF`}>PDF</a>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 14 }}>Visit and study lists use each country page's own list when it has one. Work and immigration lists are the typical documents plus the items the official pages told us about; the PDF says so, and you confirm the exact list for each client.</p>
    </>
  );
}
