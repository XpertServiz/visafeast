import type { Metadata } from "next";
import { siteConfig, type Locale } from "@/config/site";
import { LOCALES, localeMeta, lp } from "@/config/locales";
import { getT, seoReady } from "./i18n";
import type { SiteSettings } from "./types";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function orgJsonLd(s: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": `${siteConfig.url}/#org`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.jpg`,
        email: s.email,
        telephone: s.whatsapp_number,
        sameAs: [s.facebook_url].filter(Boolean),
        areaServed: "PK",
        address: { "@type": "PostalAddress", addressLocality: "Karachi", addressCountry: "PK" },
        // NOTE: no AggregateRating — Google ignores self-serving review markup (brief §6.6)
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#site`,
        url: siteConfig.url,
        name: siteConfig.name,
        inLanguage: LOCALES.map((l) => l.hreflang),
        potentialAction: { "@type": "SearchAction", target: `${siteConfig.url}/news?q={search_term_string}`, "query-input": "required name=search_term_string" },
      },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${siteConfig.url}${it.path}` })),
  };
}

export function faqJsonLd(faqs: { question: string; answer_md: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer_md } })),
  };
}

/** Video details for Google (VideoObject). uploadDate = the day the owner added the video to the site (we do not guess YouTube's date). */
export function videoJsonLd(v: { video_id: string; title: string | null; caption?: string | null; created_at?: string }) {
  return {
    "@context": "https://schema.org", "@type": "VideoObject", name: v.title || "Visafeast visa tips",
    thumbnailUrl: [`https://i.ytimg.com/vi/${v.video_id}/maxresdefault.jpg`, `https://i.ytimg.com/vi/${v.video_id}/hqdefault.jpg`],
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.video_id}`, contentUrl: `https://www.youtube.com/watch?v=${v.video_id}`,
    description: v.caption || v.title || "Visa tips from Visafeast",
    ...(v.created_at ? { uploadDate: v.created_at } : {}),
  };
}

/** Canonical address plus the address in every language (hreflang), for a path without language like "/visit-visa/x". */
export function alternates(path: string, locale: Locale, available?: Locale[]) {
  const list = available ?? LOCALES.map((l) => l.code);
  return {
    canonical: lp(locale, path),
    languages: { ...Object.fromEntries(list.map((c) => [localeMeta(c).hreflang, lp(c, path)])), "x-default": path },
  };
}

/** Title, description and social card of a page in its language. A page whose text is not translated yet stays out of Google until it is. */
export function seoMeta(locale: Locale, key: string, path: string): Metadata {
  const t = getT(locale);
  const title = t(`seo.${key}.t`), description = t(`seo.${key}.d`);
  return {
    title, description, alternates: alternates(path, locale),
    openGraph: { title, description, url: lp(locale, path), siteName: siteConfig.name, type: "website", locale: localeMeta(locale).og, images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.name }] },
    robots: seoReady(locale, key) ? undefined : { index: false, follow: true },
  };
}
