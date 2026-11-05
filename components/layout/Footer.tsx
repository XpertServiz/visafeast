import Link from "next/link";
import type { Locale } from "@/config/site";
import { siteConfig, waLink } from "@/config/site";
import { getT, lp } from "@/lib/i18n";
import { getCountries } from "@/lib/data";
import type { SiteSettings } from "@/lib/types";
import { LogoMark } from "./Logo";

export async function Footer({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  const t = getT(locale);
  const [visit, study] = await Promise.all([getCountries("visit"), getCountries("study")]);
  const a = { color: "var(--on-navy)", textDecoration: "none" } as const;
  const h = { margin: "0 0 12px", fontSize: 13, color: "var(--amber)" } as const;
  const li = { margin: "8px 0" } as const;
  return (
    <footer className="sky foot" style={{ color: "var(--on-navy)", marginTop: 64 }}>
      <div className="wrap" style={{ paddingBlock: 48 }}>
        <div className="g4" style={{ gridTemplateColumns: "1.3fr 1fr 1fr 1fr" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><LogoMark /><span className="disp" style={{ fontSize: 24, fontWeight: 600, color: "#fff" }}>Visafeast</span></div>
            <p style={{ fontSize: 15, marginTop: 14 }}>{siteConfig.disclaimer}</p>
          </div>
          <div>
            <p className="eyebrow" style={h}>{t("footer.visitStudy")}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 15 }}>
              {visit.slice(0, 5).map((c) => <li key={c.slug} style={li}><Link style={a} href={lp(locale, `/visit-visa/${c.slug}`)}>{c.country_name} visit</Link></li>)}
              {study.slice(0, 3).map((c) => <li key={c.slug} style={li}><Link style={a} href={lp(locale, `/study-visa/${c.slug}`)}>Study in {c.country_name}</Link></li>)}
              <li style={li}><Link style={a} href={lp(locale, "/visit-visa")}>All visit visas →</Link></li>
              <li style={li}><Link style={a} href={lp(locale, "/study-visa")}>All study visas →</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow" style={h}>{t("footer.immigration")}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 15 }}>
              {["Canada Express Entry", "Australia skilled visas", "Germany Opportunity Card", "UK Skilled Worker"].map((x) => <li key={x} style={li}><Link style={a} href={lp(locale, "/immigration")}>{x}</Link></li>)}
              <li style={li}><Link style={a} href={lp(locale, "/tools/refusal-decoder")}>{t("nav.decoder")}</Link></li>
              <li style={li}><Link style={a} href={lp(locale, "/tools/fee-estimator")}>Fee estimator</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow" style={h}>{t("footer.contact")}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 15 }}>
              <li style={li}><a style={a} href={waLink(undefined, settings.whatsapp_number)}>WhatsApp {settings.whatsapp_number}</a></li>
              <li style={li}><a style={a} href={`mailto:${settings.email}`}>{settings.email}</a></li>
              <li style={li}><a style={a} href={settings.facebook_url} rel="noopener">Facebook</a></li>
              <li style={li}>{settings.address_line}</li>
              <li style={li}>{settings.office_hours}</li>
              <li style={li}><Link style={a} href={lp(locale, "/about")}>About</Link> · <Link style={a} href={lp(locale, "/contact")}>Contact</Link> · <Link style={a} href={lp(locale, "/track")}>{t("track.title")}</Link></li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", marginTop: 32, paddingTop: 18, fontSize: 14, color: "var(--on-navy-2)", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between" }}>
          <span>© {new Date().getFullYear()} Visafeast. {t("footer.rights")}</span>
          <span style={{ display: "flex", gap: 16 }}>
            <Link style={a} href={lp(locale, "/privacy")}>Privacy</Link>
            <Link style={a} href={lp(locale, "/terms")}>Terms</Link>
            <Link style={a} href={lp(locale, "/disclaimer")}>Disclaimer</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
