// The website's languages, and which language and currency belong to each country. Plain data with no imports, so it is
// safe everywhere: the proxy, server pages and browser code. To add a language: one line here + one messages/<code>.json.
export const LOCALES = [
  { code: "en", native: "English", short: "EN", english: "English", dir: "ltr", hreflang: "en", og: "en_US", intl: "en-GB" },
  { code: "ur", native: "اردو", short: "اردو", english: "Urdu", dir: "rtl", hreflang: "ur", og: "ur_PK", intl: "ur-PK" },
  { code: "ar", native: "العربية", short: "العربية", english: "Arabic", dir: "rtl", hreflang: "ar", og: "ar_SA", intl: "ar" },
  { code: "de", native: "Deutsch", short: "DE", english: "German", dir: "ltr", hreflang: "de", og: "de_DE", intl: "de-DE" },
  { code: "fr", native: "Français", short: "FR", english: "French", dir: "ltr", hreflang: "fr", og: "fr_FR", intl: "fr-FR" },
  { code: "es", native: "Español", short: "ES", english: "Spanish", dir: "ltr", hreflang: "es", og: "es_ES", intl: "es-ES" },
  { code: "zh", native: "中文", short: "中文", english: "Chinese (Simplified)", dir: "ltr", hreflang: "zh-Hans", og: "zh_CN", intl: "zh-CN" },
  { code: "hi", native: "हिन्दी", short: "हिन्दी", english: "Hindi", dir: "ltr", hreflang: "hi", og: "hi_IN", intl: "hi-IN" },
  { code: "tr", native: "Türkçe", short: "TR", english: "Turkish", dir: "ltr", hreflang: "tr", og: "tr_TR", intl: "tr-TR" },
  { code: "it", native: "Italiano", short: "IT", english: "Italian", dir: "ltr", hreflang: "it", og: "it_IT", intl: "it-IT" },
  { code: "pt", native: "Português", short: "PT", english: "Portuguese", dir: "ltr", hreflang: "pt", og: "pt_BR", intl: "pt-BR" },
  { code: "nl", native: "Nederlands", short: "NL", english: "Dutch", dir: "ltr", hreflang: "nl", og: "nl_NL", intl: "nl-NL" },
  { code: "pl", native: "Polski", short: "PL", english: "Polish", dir: "ltr", hreflang: "pl", og: "pl_PL", intl: "pl-PL" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export const LOCALE_CODES = LOCALES.map((l) => l.code) as Locale[];
export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALE_CODES as string[]).includes(v);
export const localeMeta = (code: Locale) => LOCALES.find((l) => l.code === code) ?? LOCALES[0];
export const dirOf = (l: Locale) => localeMeta(l).dir;

/** Public address of a page in a language: lp("de", "/book") -> "/de/book". English has no prefix. */
export function lp(locale: Locale, path: string): string {
  if (locale === "en") return path;
  if (path === "/") return `/${locale}`;
  return path.startsWith("/#") || path.startsWith("/?") ? `/${locale}${path.slice(1)}` : `/${locale}${path}`;
}

/** Splits "/de/book" into { locale: "de", path: "/book" }. Without a language prefix, locale is null. */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const first = pathname.split("/")[1];
  if (!isLocale(first) || first === "en") return { locale: null, path: pathname };
  return { locale: first, path: pathname.slice(first.length + 1) || "/" };
}

// Languages spoken in each country. The first is the default; browser language picks between them in multilingual countries.
const LANG_GROUPS: [Locale[], string][] = [
  [["ur"], "PK"],
  [["ar"], "SA AE QA KW BH OM EG JO IQ LB YE SY PS LY SD TN DZ MA MR"],
  [["de"], "DE AT LI"],
  [["fr"], "FR MC SN CI ML BF NE GN TG BJ CD CG GA CM"],
  [["es"], "ES MX AR CO CL PE VE EC GT CU BO DO HN PY SV NI CR PA UY"],
  [["zh"], "CN TW HK MO"],
  [["hi"], "IN"],
  [["tr"], "TR"],
  [["it"], "IT SM VA"],
  [["pt"], "PT BR AO MZ"],
  [["nl"], "NL SR"],
  [["pl"], "PL"],
  [["de", "fr", "it"], "CH"],
  [["nl", "fr"], "BE"],
  [["fr", "de"], "LU"],
  [["en", "fr"], "CA"],
];
const COUNTRY_LANGS = new Map<string, Locale[]>(LANG_GROUPS.flatMap(([langs, list]) => list.split(" ").map((c) => [c, langs] as [string, Locale[]])));

/** The language for a visitor's country. Countries not listed (USA, UK, Australia...) stay in English. */
export function localeForCountry(country: string | null | undefined, acceptLanguage?: string | null): Locale {
  const langs = COUNTRY_LANGS.get((country ?? "").toUpperCase());
  if (!langs) return "en";
  if (langs.length > 1 && acceptLanguage) {
    for (const part of acceptLanguage.split(",")) {
      const code = part.trim().slice(0, 2).toLowerCase() as Locale;
      if (langs.includes(code)) return code;
    }
  }
  return langs[0];
}

const EURO = "AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK BG".split(" ");
const CURRENCY: Record<string, string> = {
  PK: "PKR", AE: "AED", SA: "SAR", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR", EG: "EGP", JO: "JOD", IQ: "IQD", LB: "LBP", MA: "MAD", TN: "TND", DZ: "DZD",
  GB: "GBP", US: "USD", CA: "CAD", AU: "AUD", NZ: "NZD", CH: "CHF", LI: "CHF", NO: "NOK", SE: "SEK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON",
  TR: "TRY", CN: "CNY", HK: "HKD", TW: "TWD", IN: "INR", BD: "BDT", LK: "LKR", NP: "NPR", JP: "JPY", KR: "KRW", SG: "SGD", MY: "MYR", TH: "THB", ID: "IDR", PH: "PHP", VN: "VND",
  MX: "MXN", AR: "ARS", CO: "COP", CL: "CLP", PE: "PEN", BR: "BRL", ZA: "ZAR", NG: "NGN", KE: "KES", RU: "RUB", UA: "UAH", AZ: "AZN",
  ...Object.fromEntries(EURO.map((c) => [c, "EUR"])),
};
export const currencyForCountry = (country: string | null | undefined): string | null => CURRENCY[(country ?? "").toUpperCase()] ?? null;

/** Search engines, link previews and monitoring tools: always shown the language of the address they asked for. */
export const BOT_RE = /bot\b|bot\/|crawl|spider|slurp|bingpreview|duckduck|baidu|yandex|sogou|facebookexternalhit|embedly|preview|lighthouse|headless|google-inspectiontool|apis-google|mediapartners|adsbot|whatsapp|telegram|linkedin|pinterest|semrush|ahrefs/i;
