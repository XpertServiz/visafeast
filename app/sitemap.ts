import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getCountries, getPosts } from "@/lib/data";

const STATIC = ["/", "/visit-visa", "/study-visa", "/immigration", "/news", "/reviews", "/about", "/contact", "/book", "/visa-consultant-karachi", "/tools/eligibility", "/tools/refusal-decoder", "/tools/fee-estimator", "/tools/checklists", "/privacy", "/terms", "/disclaimer"];
const KIND_BASE = { visit: "visit-visa", study: "study-visa", immigration: "immigration" } as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [countries, posts] = await Promise.all([getCountries(), getPosts()]);
  const u = (p: string) => `${siteConfig.url}${p === "/" ? "" : p}`;
  const entry = (path: string, lastModified: Date, priority: number, urdu = true): MetadataRoute.Sitemap => {
    const en = { url: u(path), lastModified, changeFrequency: "weekly" as const, priority, alternates: { languages: { "en-PK": u(path), "ur-PK": u(`/ur${path === "/" ? "" : path}`) } } };
    // Only APPROVED Urdu pages are indexable (brief §14.3): static pages are listed in both; country pages only when ur_status = approved.
    return urdu ? [en, { ...en, url: u(`/ur${path === "/" ? "" : path}`), priority: priority * 0.8 }] : [en];
  };
  return [
    ...STATIC.flatMap((p) => entry(p, new Date(), p === "/" ? 1 : 0.7)),
    ...countries.filter((c) => c.is_published).flatMap((c) => entry(`/${KIND_BASE[c.kind]}/${c.slug}`, new Date(c.updated_at), 0.9, c.ur_status === "approved")),
    ...posts.flatMap((p) => entry(`/news/${p.slug}`, new Date(p.published_at ?? Date.now()), 0.6, false)),
  ];
}
