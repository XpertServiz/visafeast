import { siteConfig } from "@/config/site";
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
        inLanguage: ["en-PK", "ur-PK"],
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

export function videoJsonLd(v: { video_id: string; title: string | null }) {
  return {
    "@context": "https://schema.org", "@type": "VideoObject", name: v.title || "Visafeast visa tips",
    thumbnailUrl: `https://i.ytimg.com/vi/${v.video_id}/hqdefault.jpg`, embedUrl: `https://www.youtube-nocookie.com/embed/${v.video_id}`,
    description: v.title || "Visa tips from Visafeast", uploadDate: new Date().toISOString().slice(0, 10),
  };
}

/** Alternates incl. hreflang for a locale-neutral path like "/visit-visa/x". */
export function alternates(path: string, locale: "en" | "ur") {
  const en = path, ur = `/ur${path === "/" ? "" : path}`;
  return {
    canonical: locale === "ur" ? ur : en,
    languages: { "en-PK": en, "ur-PK": ur, "x-default": en },
  };
}
