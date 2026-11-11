import type { Locale } from "@/config/locales";
import { localizeCountry } from "./country-ur";
import { regionName, staticFaq } from "./i18n";
import { applyRow, faqSource, postSource, type TranslationRow } from "./translate";
import "server-only";
import { cache } from "react";
import { anonClient } from "./supabase";
import { DEFAULT_SETTINGS, SEED_COUNTRIES, SEED_FAQS, SEED_UK_FAQS, SEED_NEWS, SEED_REVIEWS, SEED_VIDEOS } from "./seed";
import type { Country, Faq, HeroVideo, Kind, NewsItem, Post, Review, SiteSettings } from "./types";

// Drafts are visible in development so the owner can preview; production shows published rows only.
const showDrafts = () => process.env.NODE_ENV !== "production";

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const db = anonClient();
  if (db) {
    try {
      const { data } = await db.from("settings").select("*").eq("id", 1).maybeSingle();
      if (data) return { ...DEFAULT_SETTINGS, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null)) } as SiteSettings;
    } catch { /* fall through to defaults */ }
  }
  return DEFAULT_SETTINGS;
});

export const getCountries = cache(async (kind?: Kind): Promise<Country[]> => {
  const db = anonClient();
  let rows: Country[] | null = null;
  if (db) {
    try {
      const { data } = await db.from("countries").select("*").order("sort_order");
      if (data && data.length) rows = data as Country[];
    } catch { /* ignore */ }
  }
  rows ??= SEED_COUNTRIES;
  return rows.filter((c) => (showDrafts() || c.is_published) && (!kind || c.kind === kind)).sort((a, b) => a.sort_order - b.sort_order);
});

export const getCountry = cache(async (slug: string): Promise<Country | null> => (await getCountries()).find((c) => c.slug === slug) ?? null);

export const getFaqs = cache(async (countrySlug: string | null): Promise<Faq[]> => {
  const db = anonClient();
  if (db) {
    try {
      const { data } = await db.from("faqs").select("id,question,answer_md,sort_order,country:countries(slug)").eq("is_published", true).order("sort_order");
      if (data && data.length) {
        const rows = (data as unknown as { id: string; question: string; answer_md: string; sort_order: number; country: { slug: string } | null }[])
          .map((r) => ({ id: r.id, question: r.question, answer_md: r.answer_md, sort_order: r.sort_order, country_slug: r.country?.slug ?? null }));
        return rows.filter((r) => r.country_slug === countrySlug);
      }
    } catch { /* ignore */ }
  }
  return [...SEED_FAQS, ...SEED_UK_FAQS].filter((f) => f.country_slug === countrySlug);
});

export const getAllFaqs = cache(async (): Promise<Faq[]> => [...SEED_FAQS, ...SEED_UK_FAQS]);

export const getReviews = cache(async (): Promise<Review[]> => {
  const db = anonClient();
  if (db) {
    try {
      const { data } = await db.from("reviews").select("id,name,city,visa_type,rating,body,created_at").eq("status", "approved").order("approved_at", { ascending: false }).limit(50);
      if (data) return data as Review[];
    } catch { /* ignore */ }
  }
  return SEED_REVIEWS;
});

export const getNews = cache(async (opts: { country?: string; limit?: number } = {}): Promise<NewsItem[]> => {
  const db = anonClient();
  if (db) {
    try {
      let q = db.from("news_items").select("id,title,url,published_at,summary,country_codes,what_it_means,source:news_sources(name,is_official)").eq("is_relevant", true).order("published_at", { ascending: false }).limit(opts.limit ?? 30);
      if (opts.country) q = q.contains("country_codes", [opts.country]);
      const { data } = await q;
      if (data) {
        return (data as unknown as (Omit<NewsItem, "source" | "is_official"> & { source: { name: string; is_official: boolean } | null })[]).map((r) => ({
          ...r, source: r.source?.name ?? "News", is_official: r.source?.is_official ?? false,
        }));
      }
    } catch { /* ignore */ }
  }
  return SEED_NEWS.filter((n) => !opts.country || n.country_codes.includes(opts.country)).slice(0, opts.limit ?? 30);
});

export const getPosts = cache(async (type?: Post["type"]): Promise<Post[]> => {
  const db = anonClient();
  if (db) {
    try {
      let q = db.from("posts").select("id,slug,type,title,excerpt,body_md,sources,published_at").eq("status", "published").order("published_at", { ascending: false });
      if (type) q = q.eq("type", type);
      const { data } = await q;
      if (data) return data as Post[];
    } catch { /* ignore */ }
  }
  return [];
});

export const getVideos = cache(async (): Promise<HeroVideo[]> => {
  const db = anonClient();
  if (db) {
    try {
      const { data } = await db.from("hero_videos").select("id,video_id,title,caption,is_short,sort_order,created_at").eq("is_active", true).order("sort_order");
      if (data) return data as HeroVideo[];
    } catch { /* ignore */ }
  }
  return SEED_VIDEOS;
});

/** §6.4 — a fact is "unknown" if null, or if the page's facts were last checked > 90 days ago. */
export function isStale(lastChecked: string | null, days = 90): boolean {
  if (!lastChecked) return true;
  const ms = Date.now() - new Date(lastChecked).getTime();
  return ms > days * 86400_000;
}

// ---------- content in the visitor's language
const ROW_KEY = (entity: string, id: string) => `${entity}:${id}`;

export const getTranslationRows = cache(async (locale: Locale): Promise<Map<string, TranslationRow>> => {
  const out = new Map<string, TranslationRow>();
  const db = anonClient();
  if (locale === "en" || !db) return out;
  try {
    const { data } = await db.from("content_translations").select("entity,entity_id,locale,source_hash,content").eq("locale", locale);
    for (const r of (data ?? []) as TranslationRow[]) out.set(ROW_KEY(r.entity, r.entity_id), r);
  } catch { /* English is shown instead */ }
  return out;
});

/** Which languages each item is translated into right now (fingerprint included). Used for the sitemap and language links. */
export const getTranslationIndex = cache(async (): Promise<Pick<TranslationRow, "entity" | "entity_id" | "locale" | "source_hash">[]> => {
  const db = anonClient();
  if (!db) return [];
  try {
    const { data } = await db.from("content_translations").select("entity,entity_id,locale,source_hash").limit(5000);
    return (data ?? []) as Pick<TranslationRow, "entity" | "entity_id" | "locale" | "source_hash">[];
  } catch { return []; }
});

export const getCountriesFor = cache(async (locale: Locale, kind?: Kind): Promise<Country[]> => {
  const [list, rows] = await Promise.all([getCountries(kind), getTranslationRows(locale)]);
  return list.map((c) => ({ ...localizeCountry(c, locale, rows.get(ROW_KEY("country", c.id))), country_name: regionName(c.country_code, locale, c.country_name) }));
});

export const getCountryFor = cache(async (locale: Locale, slug: string): Promise<Country | null> => (await getCountriesFor(locale)).find((c) => c.slug === slug) ?? null);

export const getFaqsFor = cache(async (locale: Locale, countrySlug: string | null): Promise<Faq[]> => {
  const [list, rows] = await Promise.all([getFaqs(countrySlug), getTranslationRows(locale)]);
  return list.map((f) => {
    const written = staticFaq(locale, f.question, f.answer_md);
    if (written) return { ...f, ...written };
    const a = applyRow(faqSource(f), f.id ? rows.get(ROW_KEY("faq", f.id)) : undefined);
    return { ...f, ...a.text };
  });
});

export const getPostsFor = cache(async (locale: Locale, type?: Post["type"]): Promise<Post[]> => {
  const [list, rows] = await Promise.all([getPosts(type), getTranslationRows(locale)]);
  return list.map((p) => ({ ...p, ...applyRow(postSource(p), rows.get(ROW_KEY("post", p.id))).text }));
});
