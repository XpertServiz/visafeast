import Link from "next/link";
import type { Locale } from "@/config/site";
import { waLink } from "@/config/site";
import { getT, lp } from "@/lib/i18n";
import { getCountriesFor } from "@/lib/data";
import type { SiteSettings } from "@/lib/types";
import { LangLinks } from "./LangSwitch";

export async function Footer({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  const t = getT(locale);
  const [visit, study] = await Promise.all([getCountriesFor(locale, "visit"), getCountriesFor(locale, "study")]);
  const visitLinks = ["GB", "CA", "EU"].map((code) => visit.find((c) => c.country_code === code)).filter((c) => c !== undefined);
  const germany = study.find((c) => c.country_code === "DE");
  const col = { display: "flex", flexDirection: "column", gap: 8 } as const;
  const h = { margin: "0 0 4px", fontSize: 12, letterSpacing: ".1em", color: "var(--amber)", textTransform: "uppercase" } as const;
  const wrap = { maxWidth: 1280, margin: "0 auto" } as const;
  const small = { display: "flex", flexWrap: "wrap", gap: "6px 16px" } as const;
  return (
    <footer className="sky foot" style={{ color: "var(--on-navy)", lineHeight: "normal" }}>
      <div className="g4 pad32" style={{ ...wrap, paddingBlock: "56px 28px", gap: 28, fontSize: 15 }}>
        <div>
          <p className="disp" style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 600, color: "#fff", letterSpacing: 0 }}>Visafeast</p>
          <p style={{ margin: 0, lineHeight: 1.6 }}>{t("home.footerBrand")}</p>
        </div>
        <div style={col}>
          <p className="mono" style={h}>{t("footer.visitStudy")}</p>
          {visitLinks.map((c) => <Link prefetch={false} key={c.slug} href={lp(locale, `/visit-visa/${c.slug}`)}>{t("ui.visitIn", { country: c.country_name })}</Link>)}
          {germany && <Link prefetch={false} href={lp(locale, `/study-visa/${germany.slug}`)}>{t("ui.studyIn", { country: germany.country_name })}</Link>}
        </div>
        <div style={col}>
          <p className="mono" style={h}>{t("footer.immigration")}</p>
          {[t("ui.immCanada"), t("ui.immAustralia"), t("ui.immGermany"), t("ui.immUk")].map((x) => <Link prefetch={false} key={x} href={lp(locale, "/immigration")}>{x}</Link>)}
        </div>
        <div style={col}>
          <p className="mono" style={h}>{t("footer.contact")}</p>
          <a href={waLink(undefined, settings.whatsapp_number)}><span dir="ltr">WhatsApp {settings.whatsapp_number}</span></a>
          <a href={`mailto:${settings.email}`}>{settings.email}</a>
          <a href={settings.facebook_url} rel="noopener">Facebook · /visafeast</a>
          <a href={lp(locale, "/#book")}>{t("nav.book")}</a>
        </div>
      </div>
      <div className="pad32" style={{ ...wrap, paddingBlock: "18px 32px", borderTop: "1px solid rgba(255,255,255,.1)", fontSize: 13, lineHeight: 1.6, color: "var(--on-navy-2)" }}>
        <p style={{ margin: 0 }}>{t("ui.disclaimerShort")} © {new Date().getFullYear()} Visafeast</p>
        <div style={{ ...small, marginTop: 12 }}>
          <Link prefetch={false} href={lp(locale, "/portal")}>{t("portal.navLink")}</Link>
          <Link prefetch={false} href={lp(locale, "/track")}>{t("track.title")}</Link>
          <Link prefetch={false} href={lp(locale, "/about")}>{t("ui.about")}</Link>
          <Link prefetch={false} href={lp(locale, "/contact")}>{t("ui.contact")}</Link>
          <Link prefetch={false} href={lp(locale, "/tools/fee-estimator")}>{t("ui.feeEstimator")}</Link>
          <Link prefetch={false} href={lp(locale, "/privacy")}>{t("ui.privacy")}</Link>
          <Link prefetch={false} href={lp(locale, "/terms")}>{t("ui.terms")}</Link>
          <Link prefetch={false} href={lp(locale, "/disclaimer")}>{t("ui.disclaimer")}</Link>
        </div>
        <div style={{ marginTop: 10 }}><LangLinks locale={locale} /></div>
        {locale !== "en" && <p style={{ margin: "10px 0 0" }}>{t("ui.autoNote")}</p>}
      </div>
    </footer>
  );
}
