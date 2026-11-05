import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { getCountries, getCountriesFor, getCountryFor, getTranslationIndex } from "@/lib/data";
import { alternates, seoMeta } from "@/lib/seo";
import { lp, regionName } from "@/lib/i18n";
import { LOCALES, localeMeta, type Locale } from "@/config/locales";
import { countrySource, sourceHash } from "@/lib/translate";
import type { Kind } from "@/lib/types";
import { CountryPage } from "./CountryPage";
import { BoardingPass, Section } from "@/components/ui";
import { BreadcrumbItems } from "./Breadcrumb";
import { IMMIGRATION_HUB } from "@/lib/seed";
import { Flag } from "@/components/ui";

const BASE = { visit: "visit-visa", study: "study-visa", immigration: "immigration" } as const;
type P = { params: Promise<{ locale: string }> };
type PS = { params: Promise<{ locale: string; slug: string }> };

const HUB = {
  visit: { h1: "hub.visitH1", intro: "hub.visitIntro", seo: "hubVisit" },
  study: { h1: "hub.studyH1", intro: "hub.studyIntro", seo: "hubStudy" },
  immigration: { h1: "hub.immH1", intro: "hub.immIntro", seo: "hubImm" },
} as const;
const KIND_LABEL = { visit: "ui.kindVisit", study: "ui.kindStudy", immigration: "ui.kindImmigration" } as const;

export function hubRoute(kind: Kind) {
  async function generateMetadata({ params }: P): Promise<Metadata> {
    const { locale } = await pageCtx(params);
    return seoMeta(locale, HUB[kind].seo, `/${BASE[kind]}`);
  }
  async function Page({ params }: P) {
    const { locale, t } = await pageCtx(params);
    const list = await getCountriesFor(locale, kind);
    const pub = new Set(list.map((c) => c.slug));
    return (
      <>
        <header className="sky" style={{ paddingBlock: "36px 56px", color: "#fff" }}>
          <div className="wrap">
            <BreadcrumbItems items={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t(HUB[kind].h1) }]} />
            <h1 className="disp h1" style={{ margin: "18px 0 8px", fontSize: 52, fontWeight: 600 }}>{t(HUB[kind].h1)}</h1>
            <p style={{ color: "var(--on-navy)", fontSize: 19, maxWidth: 720, margin: 0 }}>{t(HUB[kind].intro)}</p>
          </div>
        </header>
        <Section>
          {kind === "immigration" ? (
            <>
              <div className="g3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                {IMMIGRATION_HUB.map((h) => (
                  <div key={h.name} className="card" style={{ padding: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><Flag code={h.flag} /><h2 className="disp" style={{ margin: 0, fontSize: 24 }}>{h.code === "EU" ? t("hero.europe") : regionName(h.code, locale, h.name)}</h2></div>
                    {h.chips.map((c) => <span key={c} className="chip">{c}</span>)}
                    <p style={{ marginBottom: 0 }}>{h.slug && pub.has(h.slug) ? <Link href={lp(locale, `/immigration/${h.slug}`)} style={{ fontWeight: 600 }}>{t("cta.guide")}</Link> : <Link href={lp(locale, "/tools/eligibility")} style={{ fontWeight: 600 }}>{t("cta.qualify")}</Link>}</p>
                  </div>
                ))}
              </div>
              <p style={{ maxWidth: 800, marginInline: "auto", textAlign: "center", color: "var(--muted)", marginTop: 28 }}>{t("choose.immNote")}</p>
            </>
          ) : (
            <div className="g4">{list.map((c) => <BoardingPass key={c.slug} c={c} locale={locale} cta={t("cta.guide")} kindLabel={t(KIND_LABEL[c.kind])} />)}</div>
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
    const c = await getCountryFor(locale, slug);
    if (!c || c.kind !== kind) return {};
    const path = `/${BASE[kind]}/${c.slug}`;
    // Language links only to versions that really have the text. A version without it stays out of Google until it is translated.
    const [en, index] = await Promise.all([getCountryFor("en", slug), getTranslationIndex()]);
    const hash = en ? sourceHash(countrySource(en)) : "";
    const done = new Set(index.filter((r) => r.entity === "country" && r.entity_id === c.id && r.source_hash === hash).map((r) => r.locale));
    const available = LOCALES.map((l) => l.code).filter((l) => l === "en" || done.has(l) || (l === "ur" && c.ur_status === "approved")) as Locale[];
    return {
      title: c.meta_title, description: c.meta_description, alternates: alternates(path, locale, available),
      robots: c.translated ? undefined : { index: false, follow: true },
      openGraph: { title: c.meta_title, description: c.meta_description, url: lp(locale, path), type: "article", locale: localeMeta(locale).og, images: ["/logo.jpg"] },
    };
  }
  async function Page({ params }: PS) {
    const { locale } = await pageCtx(params);
    const { slug } = await params;
    const c = await getCountryFor(locale, slug);
    if (!c || c.kind !== kind) notFound();
    return <CountryPage c={c} locale={locale} />;
  }
  async function generateStaticParams() {
    const list = await getCountries(kind);
    return ["en", "ur"].flatMap((locale) => list.map((c) => ({ locale, slug: c.slug })));
  }
  return { generateMetadata, Page, generateStaticParams };
}
