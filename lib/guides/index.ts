import type { Country } from "../types";
import type { Locale } from "../../config/locales";
import { OUR_STEPS } from "../seed";
import { IMMIGRATION_GUIDES } from "./immigration";
import { GUIDES } from "./visit-study";
import type { GuideContent, ImmigrationGuide } from "./types";

export { IMMIGRATION_GUIDES, IMMIGRATION_SLUGS } from "./immigration";
export { GUIDES } from "./visit-study";
export type { GuideContent, ImmigrationGuide, Option, Source } from "./types";

/** Extra, source-backed content for any country page (Visit, Study or Immigration). */
export const getGuide = (slug: string): GuideContent | undefined => GUIDES[slug] ?? IMMIGRATION_GUIDES.find((g) => g.slug === slug);
export const getImmigrationGuide = (slug: string): ImmigrationGuide | undefined => IMMIGRATION_GUIDES.find((g) => g.slug === slug);

/**
 * An Immigration country page has no database row: it is built from the guide. It looks like any other country page,
 * so it gets the same header, sidebar, news and call-to-action. Only the English page is offered to Google until it is translated.
 */
export function immigrationCountry(g: ImmigrationGuide, locale: Locale): Country {
  const i = IMMIGRATION_GUIDES.indexOf(g);
  return {
    translated: locale === "en",
    id: `guide:${g.slug}`, slug: g.slug, kind: "immigration",
    country_name: g.name, country_code: g.code, flag: g.flag, from_code: "KHI", to_code: g.to,
    visa_name: "Immigration programmes", card_note: `${g.options.length} programmes`,
    h1: g.h1, meta_title: g.metaTitle, meta_description: g.metaDescription, intro: g.intro,
    embassy_fee_text: null, embassy_fee_pkr: null, vfs_fee_text: null, service_fee_pkr: null,
    processing_time_text: null, max_stay_text: null, apply_window_text: null, biometrics_text: null,
    facts_source_url: g.sources[0]?.url ?? null, facts_last_checked: g.checked,
    who_for_md: [], documents: [], funds_md: null, steps: OUR_STEPS, refusal_reasons: [], extra_sections: [],
    related_slugs: [], keywords: [], pathways: g.options.map((o) => ({ name: o.name })),
    licensed_partner: null, is_published: true, sort_order: 100 + i, updated_at: `${g.checked}T00:00:00Z`,
  };
}
