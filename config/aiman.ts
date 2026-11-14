// Everything about "Talk with Aiman" that the owner may want to tune. The funds figures below are the DEFAULTS from the approved prototype;
// the admin can change them in Admin → Settings → "Aiman funds" (saved in the database and used by both the page and the server).

export type Purpose = "visit" | "study" | "work" | "immigration";
export type CountryId = "uk" | "canada" | "usa" | "australia" | "newzealand" | "schengen" | "germany" | "france" | "italy" | "netherlands" | "portugal" | "ireland" | "greece" | "japan" | "korea" | "turkey" | "dubai" | "saudi" | "malaysia" | "singapore" | "thailand" | "srilanka" | "azerbaijan";

/** English and Urdu names shown in the country list and results (Arabic names live in lib/aiman/copy.ts). `strict` countries need stronger files. */
export const COUNTRIES: Record<CountryId, { en: string; ur: string; strict: boolean }> = {
  uk: { en: "UK", ur: "یو کے", strict: true }, canada: { en: "Canada", ur: "کینیڈا", strict: true }, usa: { en: "USA", ur: "امریکہ", strict: true },
  australia: { en: "Australia", ur: "آسٹریلیا", strict: true }, newzealand: { en: "New Zealand", ur: "نیوزی لینڈ", strict: true },
  schengen: { en: "Europe (Schengen)", ur: "یورپ (شینگن)", strict: true }, germany: { en: "Germany", ur: "جرمنی", strict: true }, france: { en: "France", ur: "فرانس", strict: true },
  italy: { en: "Italy", ur: "اٹلی", strict: true }, netherlands: { en: "Netherlands", ur: "نیدرلینڈز", strict: true }, portugal: { en: "Portugal", ur: "پرتگال", strict: true },
  ireland: { en: "Ireland", ur: "آئرلینڈ", strict: true }, greece: { en: "Greece", ur: "یونان", strict: true }, japan: { en: "Japan", ur: "جاپان", strict: true }, korea: { en: "South Korea", ur: "جنوبی کوریا", strict: true },
  turkey: { en: "Turkey", ur: "ترکی", strict: false }, dubai: { en: "Dubai / UAE", ur: "دبئی / یو اے ای", strict: false }, saudi: { en: "Saudi Arabia", ur: "سعودی عرب", strict: false },
  malaysia: { en: "Malaysia", ur: "ملائیشیا", strict: false }, singapore: { en: "Singapore", ur: "سنگاپور", strict: false }, thailand: { en: "Thailand", ur: "تھائی لینڈ", strict: false },
  srilanka: { en: "Sri Lanka", ur: "سری لنکا", strict: false }, azerbaijan: { en: "Azerbaijan", ur: "آذربائیجان", strict: false },
};
export const COUNTRY_IDS = Object.keys(COUNTRIES) as CountryId[];
export const LABEL = Object.fromEntries(COUNTRY_IDS.map((c) => [c, [COUNTRIES[c].en, COUNTRIES[c].ur]])) as Record<CountryId, [string, string]>;
export const isCountry = (v: string): v is CountryId => v in COUNTRIES;

/** Every country can be chosen for every purpose. */
export const OPTIONS: Record<Purpose, CountryId[]> = { visit: COUNTRY_IDS, study: COUNTRY_IDS, work: COUNTRY_IDS, immigration: COUNTRY_IDS };

const KNOWN: Record<Purpose, Partial<Record<CountryId, string>>> = {
  visit: { uk: "UK Standard Visitor Visa", canada: "Canada Visitor Visa (TRV)", schengen: "Schengen Short-Stay Visa", usa: "USA B1/B2 Visitor Visa", australia: "Australia Visitor Visa (600)", turkey: "Turkey Visit Visa", dubai: "UAE Visit Visa", malaysia: "Malaysia Visit Visa / eVisa" },
  study: { uk: "UK Student Visa", canada: "Canada Study Permit", australia: "Australia Student Visa (500)", usa: "USA F-1 Student Visa", germany: "Germany Student Visa" },
  work: { uk: "UK Skilled Worker Visa", canada: "Canada Work Permit", germany: "Germany Skilled Worker / Opportunity Card", dubai: "UAE Employment Visa", australia: "Australia Skilled Work Visa", newzealand: "New Zealand Accredited Employer Work Visa", ireland: "Ireland Critical Skills / General Employment Permit", netherlands: "Netherlands Highly Skilled Migrant", japan: "Japan Specified Skilled Worker (SSW)", usa: "USA H-1B Work Visa" },
  immigration: { canada: "Canada Express Entry (PR)", australia: "Australia Skilled Independent (PR)", uk: "UK Skilled Worker → settlement route", germany: "Germany Opportunity Card → PR route", newzealand: "New Zealand Skilled Migrant Category (Residence)" },
};
const SUFFIX: Record<Purpose, string> = { visit: "Visit Visa", study: "Student Visa", work: "Work Visa", immigration: "Residence / PR route" };
/** The program named in results: a known official name where we have one, otherwise "<Country> <Visit Visa / Student Visa / Work Visa / Residence route>". */
export const programName = (p: Purpose, c: CountryId) => KNOWN[p][c] ?? `${COUNTRIES[c].en} ${SUFFIX[p]}`;

/** Countries that need stronger files (large recent deposits and no travel history count against the applicant). */
export const STRICT: CountryId[] = COUNTRY_IDS.filter((c) => COUNTRIES[c].strict);

/** Funds in lacs of PKR. `visit` is per person; `study` is for the first applicant (+ `studyPerDependant` for each extra person). */
export interface FundsConfig {
  visit: Partial<Record<CountryId, number>>;
  study: Partial<Record<CountryId, number>>;
  studyPerDependant: number;
  workPerPerson: number;
  prPerPerson: number;
}

export const DEFAULT_FUNDS: FundsConfig = {
  visit: Object.fromEntries(COUNTRY_IDS.map((c) => [c, COUNTRIES[c].strict ? 15 : 5])) as Partial<Record<CountryId, number>>,
  study: Object.fromEntries(COUNTRY_IDS.map((c) => [c, { uk: 30, canada: 30, australia: 35, usa: 40, germany: 35 }[c as string] ?? (COUNTRIES[c].strict ? 30 : 15)])) as Partial<Record<CountryId, number>>,
  studyPerDependant: 10,
  workPerPerson: 5,
  prPerPerson: 12,
};

/** Merges figures saved by the admin over the defaults. Anything missing or not a sensible number falls back to the default. */
export function mergeFunds(saved: unknown): FundsConfig {
  const s = (saved && typeof saved === "object" ? saved : {}) as Record<string, unknown>;
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1000 ? v : d);
  const group = (g: unknown, base: Partial<Record<CountryId, number>>) => {
    const o = (g && typeof g === "object" ? g : {}) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(base).map(([k, d]) => [k, num(o[k], d as number)])) as Partial<Record<CountryId, number>>;
  };
  return {
    visit: group(s.visit, DEFAULT_FUNDS.visit), study: group(s.study, DEFAULT_FUNDS.study),
    studyPerDependant: num(s.studyPerDependant, DEFAULT_FUNDS.studyPerDependant),
    workPerPerson: num(s.workPerPerson, DEFAULT_FUNDS.workPerPerson), prPerPerson: num(s.prPerPerson, DEFAULT_FUNDS.prPerPerson),
  };
}

export const AIMAN_PATH = "/talk-with-aiman";
export const LEAD_LIMIT_PER_HOUR = 12;
