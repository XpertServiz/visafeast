"use client";
import { useState } from "react";
import { waLink, type Locale } from "@/config/site";
import { useDict } from "@/components/DictProvider";
import { LocalPrice } from "@/components/LocalPrice";

interface Row { slug: string; label: string; embassy: string | null; embassyPkr: number | null; vfs: string | null; service: number | null; checked: string | null; visa: string }

export function FeeEstimator({ locale, rows, mode, whatsapp, fallback }: { locale: Locale; rows: Row[]; mode: "exact" | "from" | "quote"; whatsapp: string; fallback: string }) {
  const u = useDict().ui;
  const [slug, setSlug] = useState(rows[0]?.slug ?? "");
  const r = rows.find((x) => x.slug === slug);
  const wa = (r && waLink(`Hi, what's the current ${r.visa} fee?`, whatsapp)) || "#";
  const unknown = <a href={wa}>{fallback}</a>;
  const svc = mode === "quote" || !r?.service ? u.contactQuote : `${mode === "from" ? `${u.from} ` : ""}PKR ${r.service.toLocaleString("en-PK")}`;
  const total = r && r.embassyPkr && r.service && mode === "exact" ? r.embassyPkr + r.service : null;
  return (
    <div className="card" style={{ padding: 26, maxWidth: 820, marginInline: "auto" }}>
      <label className="lbl" htmlFor="fe-sel">{u.chooseVisa}</label>
      <select id="fe-sel" className="field" value={slug} onChange={(e) => setSlug(e.target.value)}>{rows.map((x) => <option key={x.slug} value={x.slug}>{x.label}</option>)}</select>
      {r && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
          <tbody>
            {[
              [u.embassyGovFee, r.embassy ? <>{r.embassy}<LocalPrice text={r.embassy} locale={locale} /></> : unknown, r.embassyPkr ? `≈ PKR ${r.embassyPkr.toLocaleString("en-PK")}` : ""],
              [u.vfsFee, r.vfs ?? unknown, ""],
              [u.serviceFee, svc, ""],
            ].map(([a, b, c]) => (
              <tr key={String(a)} style={{ borderTop: "1px solid var(--line)" }}><th scope="row" style={{ textAlign: "start", padding: "14px 8px", fontWeight: 600 }}>{a}</th><td style={{ padding: "14px 8px" }}>{b}</td><td className="mono" style={{ padding: 8, fontSize: 13 }}>{c}</td></tr>
            ))}
            {total && <tr style={{ borderTop: "2px solid var(--navy)" }}><th scope="row" style={{ textAlign: "start", padding: 14 }}>{u.totalApprox}</th><td colSpan={2} style={{ padding: 14, fontWeight: 600 }}>PKR {total.toLocaleString("en-PK")}</td></tr>}
          </tbody>
        </table>
      )}
      <p className="mono" style={{ fontSize: 13, color: "var(--muted-2)", marginTop: 14 }}>{r?.checked ? `${u.lastChecked} ${r.checked}` : u.notVerified} · {u.pkrNote} {u.approxNote}</p>
    </div>
  );
}
