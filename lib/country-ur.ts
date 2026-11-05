import type { Country, Item } from "./types";
import type { Locale } from "@/config/locales";
import { applyRow, countrySource, type TranslationRow } from "./translate";

/** The text parts of a country page that get an Urdu version. Numbers, dates, fees and links are NOT here: they stay as published. */
export interface CountryUrText {
  h1?: string; meta_title?: string; meta_description?: string; intro?: string; funds_md?: string;
  who_for_md?: string[]; documents?: Item[]; steps?: Item[]; refusal_reasons?: Item[];
}
export const urSource = (c: Country): CountryUrText => ({
  h1: c.h1, meta_title: c.meta_title, meta_description: c.meta_description, intro: c.intro ?? undefined, funds_md: c.funds_md ?? undefined,
  who_for_md: c.who_for_md, documents: c.documents, steps: c.steps, refusal_reasons: c.refusal_reasons,
});

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const items = (v: unknown, base: Item[]): Item[] | undefined => {
  if (!Array.isArray(v) || v.length !== base.length) return undefined; // a different length means the draft is unreliable: keep English
  const out = v.map((x, i) => (x && typeof x === "object" && str((x as Item).title) ? { title: (x as Item).title, detail: str((x as Item).detail) ?? base[i].detail } : null));
  return out.every(Boolean) ? (out as Item[]) : undefined;
};

/** Safe-parse whatever the AI (or the admin) saved, keeping only well-formed parts that match the English structure. */
export function cleanUrdu(raw: unknown, c: Country): CountryUrText {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const who = Array.isArray(r.who_for_md) && r.who_for_md.length === c.who_for_md.length && r.who_for_md.every((x) => typeof x === "string" && x.trim()) ? (r.who_for_md as string[]) : undefined;
  return {
    h1: str(r.h1), meta_title: str(r.meta_title), meta_description: str(r.meta_description), intro: str(r.intro), funds_md: c.funds_md ? str(r.funds_md) : undefined,
    who_for_md: who, documents: items(r.documents, c.documents), steps: items(r.steps, c.steps), refusal_reasons: items(r.refusal_reasons, c.refusal_reasons),
  };
}

/** Visitors see the text of their language where it exists. Owner-saved Urdu wins over automatic translation. A translation made from older English is ignored. */
export function localizeCountry(c: Country, locale: Locale, row?: TranslationRow): Country {
  if (locale === "en") return { ...c, translated: true };
  const auto = applyRow(countrySource(c), row);
  const base: Country = auto.translated ? { ...c, ...auto.text } : c;
  const approved = locale === "ur" && c.ur_status === "approved";
  if (locale !== "ur" || !c.content_ur) return { ...base, translated: auto.translated };
  const u = cleanUrdu(c.content_ur, c);
  return {
    ...base,
    h1: u.h1 ?? base.h1, meta_title: u.meta_title ?? base.meta_title, meta_description: u.meta_description ?? base.meta_description,
    intro: u.intro ?? base.intro, funds_md: u.funds_md ?? base.funds_md, who_for_md: u.who_for_md ?? base.who_for_md,
    documents: u.documents ?? base.documents, steps: u.steps ?? base.steps, refusal_reasons: u.refusal_reasons ?? base.refusal_reasons,
    translated: auto.translated || approved,
  };
}

export const URDU_TRANSLATE_SYSTEM = `You translate visa-guide text from English into simple, natural Pakistani Urdu for ordinary readers.
Rules:
- TRANSLATE ONLY. Do not add, remove, soften or change any fact, number, date, fee, duration, name, place or link.
- Keep numbers, currency codes (GBP, PKR, USD), dates, URLs and official names (e.g. VFS Global, GOV.UK) exactly as written.
- Keep the same JSON keys and the SAME number of items in every list, in the same order.
- Do not add promises or guarantees about visa approval.
- Return ONLY valid JSON, no explanations.`;
