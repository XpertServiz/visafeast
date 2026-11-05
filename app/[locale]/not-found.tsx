"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDict } from "@/components/DictProvider";
import { isLocale, lp } from "@/config/locales";

export default function NotFound() {
  const raw = useParams().locale;
  const locale = isLocale(raw) ? raw : "en";
  const d = useDict();
  const links = [["/visit-visa", d.ui.allVisit], ["/study-visa", d.ui.allStudy], ["/tools/eligibility", d.cta.eligibility], ["/contact", d.ui.contactUs]];
  return (
    <div className="wrap" style={{ paddingBlock: 80, textAlign: "center" }}>
      <p className="mono" style={{ color: "var(--amber-text)", margin: 0 }}>404</p>
      <h1 className="disp" style={{ fontSize: 48, margin: "8px 0" }}>{d.ui.notFoundTitle}</h1>
      <p style={{ color: "var(--muted)" }}>{d.ui.notFoundBody}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
        {links.map(([h, l]) => <Link key={h} href={lp(locale, h)} className="btn btn-outline">{l}</Link>)}
      </div>
    </div>
  );
}
