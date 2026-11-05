import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { LOCALES, localeMeta, lp, type Locale } from "@/config/locales";
import { getCountries, getPosts, getTranslationIndex } from "@/lib/data";
import { seoReady } from "@/lib/i18n";
import { countrySource, postSource, sourceHash } from "@/lib/translate";
import { IMMIGRATION_GUIDES } from "@/lib/guides";

const STATIC: [string, string][] = [["/", "home"], ["/visit-visa", "hubVisit"], ["/study-visa", "hubStudy"], ["/immigration", "hubImm"], ["/news", "news"], ["/reviews", "reviews"], ["/reviews/write", "reviewsWrite"], ["/about", "about"], ["/contact", "contact"], ["/book", "book"], ["/visa-consultant-karachi", "karachi"], ["/tools/eligibility", "eligibility"], ["/tools/refusal-decoder", "decoder"], ["/tools/fee-estimator", "feeEstimator"], ["/tools/checklists", "checklists"], ["/privacy", "privacy"], ["/terms", "terms"], ["/disclaimer", "disclaimer"]];
const KIND_BASE = { visit: "visit-visa", study: "study-visa", immigration: "immigration" } as const;
// Newly translated pages join the sitemap within the hour.
export const revalidate = 3600;
const ALL = LOCALES.map((l) => l.code);

/** Every public page in every language that has its text. Each entry also lists its versions in the other languages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [countries, posts, index] = await Promise.all([getCountries(), getPosts(), getTranslationIndex()]);
  const u = (p: string) => `${siteConfig.url}${p === "/" ? "" : p}`;
  const entries = (path: string, locales: Locale[], lastModified: Date, priority: number): MetadataRoute.Sitemap => {
    const languages = { ...Object.fromEntries(locales.map((l) => [localeMeta(l).hreflang, u(lp(l, path))])), "x-default": u(path) };
    return locales.map((l) => ({ url: u(lp(l, path)), lastModified, changeFrequency: "weekly" as const, priority: l === "en" ? priority : Math.round(priority * 80) / 100, alternates: { languages } }));
  };
  const translated = (entity: string, id: string, hash: string, extra: Locale[] = []): Locale[] => {
    const done = new Set(index.filter((r) => r.entity === entity && r.entity_id === id && r.source_hash === hash).map((r) => r.locale));
    return ALL.filter((l) => l === "en" || done.has(l) || extra.includes(l));
  };
  return [
    ...STATIC.flatMap(([path, key]) => entries(path, ALL.filter((l) => seoReady(l, key)), new Date(), path === "/" ? 1 : 0.7)),
    ...countries.filter((c) => c.is_published).flatMap((c) => entries(`/${KIND_BASE[c.kind]}/${c.slug}`, translated("country", c.id, sourceHash(countrySource(c)), c.ur_status === "approved" ? ["ur"] : []), new Date(c.updated_at), 0.9)),
    ...IMMIGRATION_GUIDES.flatMap((g) => entries(`/immigration/${g.slug}`, ["en"], new Date(g.checked), 0.8)),
    ...posts.flatMap((p) => entries(`/news/${p.slug}`, translated("post", p.id, sourceHash(postSource(p))), new Date(p.published_at ?? Date.now()), 0.6)),
  ];
}
