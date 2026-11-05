import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { getCountries, getCountry } from "@/lib/data";
import { alternates } from "@/lib/seo";
import { lp } from "@/lib/i18n";
import type { Kind } from "@/lib/types";
import { CountryPage } from "./CountryPage";
import { localizeCountry } from "@/lib/country-ur";
import { BoardingPass, Section } from "@/components/ui";
import { BreadcrumbItems } from "./Breadcrumb";
import { IMMIGRATION_HUB } from "@/lib/seed";
import { Flag } from "@/components/ui";

const BASE = { visit: "visit-visa", study: "study-visa", immigration: "immigration" } as const;
type P = { params: Promise<{ locale: string }> };
type PS = { params: Promise<{ locale: string; slug: string }> };

const HUB = {
  visit: { h1: "Visit Visas from Pakistan", meta: "Visit Visas from Pakistan: UK, Canada, USA, Schengen | Visafeast", desc: "Choose your destination: UK, Canada, USA, Australia, New Zealand, Schengen, Azerbaijan, Thailand and Singapore visit visas from Pakistan.", intro: "Pick a country to see documents, fees and timelines — each with the date we last checked it." },
  study: { h1: "Study Visas from Pakistan", meta: "Study Abroad from Pakistan: Student Visa Guides | Visafeast", desc: "Study in Germany, the UK, Canada, USA, Australia, Italy, Greece and Europe from Pakistan: student visa guides with official sources.", intro: "Pick a country to see how the student visa works and what to prepare." },
  immigration: { h1: "Immigration Pathways from Pakistan", meta: "Immigration Consultant in Pakistan: PR & Work Visas | Visafeast", desc: "Immigration pathways from Pakistan for Canada, Australia, the UK, USA, Germany, New Zealand and Europe, shown with official sources and dates.", intro: "Skilled, family and business pathways. Rules change often — every page shows its official source and the date we last checked it." },
} as const;

export function hubRoute(kind: Kind) {
  async function generateMetadata({ params }: P): Promise<Metadata> {
    const { locale } = await pageCtx(params);
    return { title: HUB[kind].meta, description: HUB[kind].desc, alternates: alternates(`/${BASE[kind]}`, locale) };
  }
  async function Page({ params }: P) {
    const { locale, t } = await pageCtx(params);
    const list = await getCountries(kind);
    const pub = new Set(list.map((c) => c.slug));
    return (
      <>
        <header className="sky" style={{ paddingBlock: "36px 56px", color: "#fff" }}>
          <div className="wrap">
            <BreadcrumbItems items={[{ label: t("common.home"), href: lp(locale, "/") }, { label: HUB[kind].h1 }]} />
            <h1 className="disp h1" style={{ margin: "18px 0 8px", fontSize: 52, fontWeight: 600 }}>{HUB[kind].h1}</h1>
            <p style={{ color: "var(--on-navy)", fontSize: 19, maxWidth: 720, margin: 0 }}>{HUB[kind].intro}</p>
          </div>
        </header>
        <Section>
          {kind === "immigration" ? (
            <>
              <div className="g3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                {IMMIGRATION_HUB.map((h) => (
                  <div key={h.name} className="card" style={{ padding: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><Flag code={h.flag} /><h2 className="disp" style={{ margin: 0, fontSize: 24 }}>{h.name}</h2></div>
                    {h.chips.map((c) => <span key={c} className="chip">{c}</span>)}
                    <p style={{ marginBottom: 0 }}>{h.slug && pub.has(h.slug) ? <Link href={lp(locale, `/immigration/${h.slug}`)} style={{ fontWeight: 600 }}>{t("cta.guide")}</Link> : <Link href={lp(locale, "/tools/eligibility")} style={{ fontWeight: 600 }}>{t("cta.qualify")}</Link>}</p>
                  </div>
                ))}
              </div>
              <p style={{ maxWidth: 800, marginInline: "auto", textAlign: "center", color: "var(--muted)", marginTop: 28 }}>{t("choose.immNote")}</p>
            </>
          ) : (
            <div className="g4">{list.map((c) => <BoardingPass key={c.slug} c={c} locale={locale} cta={t("cta.guide")} />)}</div>
          )}
        </Section>
      </>
    );
  }
  return { generateMetadata, Page };
}

export function detailRoute(kind: Kind) {
  async function generateMetadata({ params }: PS): Promise<Metadata> {
    const { locale } = await pageCtx(params);
    const { slug } = await params;
    const c0 = await getCountry(slug);
    if (!c0 || c0.kind !== kind) return {};
    const c = localizeCountry(c0, locale);
    const ur = locale === "ur" && c.ur_status !== "approved";
    return {
      title: c.meta_title, description: c.meta_description, alternates: alternates(`/${BASE[kind]}/${c.slug}`, locale),
      robots: ur ? { index: false, follow: true } : undefined, // unapproved Urdu is noindex (brief §14.3)
      openGraph: { title: c.meta_title, description: c.meta_description },
    };
  }
  async function Page({ params }: PS) {
    const { locale } = await pageCtx(params);
    const { slug } = await params;
    const c = await getCountry(slug);
    if (!c || c.kind !== kind) notFound();
    return <CountryPage c={localizeCountry(c, locale)} locale={locale} />;
  }
  async function generateStaticParams() {
    const list = await getCountries(kind);
    return ["en", "ur"].flatMap((locale) => list.map((c) => ({ locale, slug: c.slug })));
  }
  return { generateMetadata, Page, generateStaticParams };
}
