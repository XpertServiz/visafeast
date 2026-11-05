import Link from "next/link";
import { Calendar, Menu } from "lucide-react";
import type { Locale } from "@/config/site";
import { getT, lp } from "@/lib/i18n";
import { LangSwitch } from "./LangSwitch";
import { LogoMark } from "./Logo";

export function Nav({ locale }: { locale: Locale }) {
  const t = getT(locale);
  const links = [
    { href: lp(locale, "/#visas"), label: t("nav.visas") },
    { href: lp(locale, "/tools/eligibility"), label: t("nav.eligibility") },
    { href: lp(locale, "/tools/refusal-decoder"), label: t("nav.decoder") },
    { href: lp(locale, "/news"), label: t("nav.news") },
    { href: lp(locale, "/reviews"), label: t("nav.reviews") },
    { href: lp(locale, "/portal"), label: t("portal.navLink") },
  ];
  const linkStyle = { color: "#D6DEEA", textDecoration: "none", fontWeight: 500, fontSize: 15 } as const;
  return (
    <header className="sky" style={{ position: "relative", zIndex: 5, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
      <nav aria-label="Main" className="wrap nav-inner" style={{ paddingBlock: 14, display: "flex", alignItems: "center", gap: 24 }}>
        <Link href={lp(locale, "/")} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <LogoMark />
          <span className="disp" style={{ fontSize: 24, fontWeight: 600, color: "#fff" }}>Visafeast</span>
        </Link>
        <div className="hide-sm" style={{ display: "flex", gap: 22, flexGrow: 1, marginInlineStart: 8 }}>
          {links.map((l) => <Link key={l.href} href={l.href} style={linkStyle}>{l.label}</Link>)}
        </div>
        <div style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <LangSwitch locale={locale} />
          <Link className="btn btn-primary hide-sm" href={lp(locale, "/book")}><Calendar size={18} aria-hidden />{t("nav.book")}</Link>
          <details className="show-sm" style={{ position: "relative" }}>
            <summary aria-label={t("nav.menu")} style={{ listStyle: "none", cursor: "pointer", color: "#fff", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}><Menu /></summary>
            <div style={{ position: "absolute", insetInlineEnd: 0, top: 48, background: "var(--navy-2)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 14, padding: 14, minWidth: 240, display: "grid", gap: 4, zIndex: 20 }}>
              {links.map((l) => <Link key={l.href} href={l.href} style={{ ...linkStyle, padding: "12px 10px", fontSize: 17 }}>{l.label}</Link>)}
              <Link className="btn btn-primary" href={lp(locale, "/book")} style={{ marginTop: 8 }}>{t("nav.book")}</Link>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
