import Link from "next/link";
import { Menu } from "lucide-react";
import type { Locale } from "@/config/site";
import { getT, lp } from "@/lib/i18n";
import { LangSwitch } from "./LangSwitch";
import { Brand } from "./Logo";
import { MobileMenu } from "./MobileMenu";

export function Nav({ locale }: { locale: Locale }) {
  const t = getT(locale);
  const links = [
    { href: lp(locale, "/#visas"), label: t("nav.visas") },
    { href: lp(locale, "/#eligibility"), label: t("nav.eligibility") },
    { href: lp(locale, "/#decoder"), label: t("nav.decoder") },
    { href: lp(locale, "/#news"), label: t("nav.news") },
    { href: lp(locale, "/#reviews"), label: t("nav.reviews") },
  ];
  const linkStyle = { color: "#D6DEEA", textDecoration: "none", fontWeight: 500, fontSize: 15 } as const;
  return (
    <header className="sky" style={{ position: "relative", zIndex: 5, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
      <nav aria-label="Main" className="pad32 nav-inner" style={{ maxWidth: 1280, margin: "0 auto", paddingBlock: 16, display: "flex", alignItems: "center", gap: 28, lineHeight: "normal" }}>
        <Link prefetch={false} href={lp(locale, "/")} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Brand size={40} className="brand-nav" />
        </Link>
        <div className="hide-sm" style={{ display: "flex", gap: 22, flexGrow: 1 }}>
          {links.map((l) => <a key={l.href} href={l.href} style={linkStyle}>{l.label}</a>)}
        </div>
        <div style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 28 }}>
          <LangSwitch locale={locale} />
          <a className="btn btn-primary hide-sm" href={lp(locale, "/#book")} style={{ padding: "12px 20px", minHeight: 44, fontSize: 15, borderWidth: 0 }}>{t("nav.book")}</a>
          <MobileMenu className="show-sm" style={{ position: "relative", marginInlineStart: -16 }}>
            <summary aria-label={t("nav.menu")} style={{ listStyle: "none", cursor: "pointer", color: "#fff", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}><Menu /></summary>
            <div style={{ position: "absolute", insetInlineEnd: 0, top: 48, background: "var(--navy-2)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 14, padding: 14, minWidth: 240, display: "grid", gap: 4, zIndex: 20 }}>
              {[...links, { href: lp(locale, "/portal"), label: t("portal.navLink") }].map((l) => <a key={l.href} href={l.href} style={{ ...linkStyle, padding: "12px 10px", fontSize: 17 }}>{l.label}</a>)}
              <a className="btn btn-primary" href={lp(locale, "/#book")} style={{ marginTop: 8 }}>{t("nav.book")}</a>
            </div>
          </MobileMenu>
        </div>
      </nav>
    </header>
  );
}
