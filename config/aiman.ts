// Everything about "Talk with Aiman" that the owner may want to tune. The funds figures below are the DEFAULTS from the approved prototype;
// the admin can change them in Admin → Settings → "Aiman funds" (saved in the database and used by both the page and the server).

export type Purpose = "visit" | "study" | "work" | "immigration";
export type CountryId = "uk" | "canada" | "schengen" | "usa" | "australia" | "turkey" | "dubai" | "malaysia" | "germany";

/** English and Urdu names shown in chips and results (Arabic names live in lib/aiman/copy.ts). */
export const LABEL: Record<CountryId, [string, string]> = {
  uk: ["UK", "یو کے"], canada: ["Canada", "کینیڈا"], schengen: ["Europe (Schengen)", "یورپ (شینگن)"], usa: ["USA", "امریکہ"],
  australia: ["Australia", "آسٹریلیا"], turkey: ["Turkey", "ترکی"], dubai: ["Dubai / UAE", "دبئی / یو اے ای"], malaysia: ["Malaysia", "ملائیشیا"], germany: ["Germany", "جرمنی"],
};

/** Countries offered for each purpose. */
export const OPTIONS: Record<Purpose, CountryId[]> = {
  visit: ["uk", "canada", "schengen", "usa", "australia", "turkey", "dubai", "malaysia"],
  study: ["uk", "canada", "australia", "usa", "germany"],
  work: ["uk", "canada", "germany", "dubai", "australia"],
  immigration: ["canada", "australia", "uk", "germany"],
};

export const PROGRAM: Record<Purpose, Partial<Record<CountryId, string>>> = {
  visit: { uk: "UK Standard Visitor Visa", canada: "Canada Visitor Visa (TRV)", schengen: "Schengen Short-Stay Visa", usa: "USA B1/B2 Visitor Visa", australia: "Australia Visitor Visa (600)", turkey: "Turkey Visit Visa", dubai: "UAE Visit Visa", malaysia: "Malaysia Visit Visa / eVisa" },
  study: { uk: "UK Student Visa", canada: "Canada Study Permit", australia: "Australia Student Visa (500)", usa: "USA F-1 Student Visa", germany: "Germany Student Visa" },
  work: { uk: "UK Skilled Worker Visa", canada: "Canada Work Permit", germany: "Germany Skilled Worker / Opportunity Card", dubai: "UAE Employment Visa", australia: "Australia Skilled Work Visa" },
  immigration: { canada: "Canada Express Entry (PR)", australia: "Australia Skilled Independent (PR)", uk: "UK Skilled Worker → settlement route", germany: "Germany Opportunity Card → PR route" },
};

/** Countries that need stronger files (large recent deposits and no travel history count against the applicant). */
export const STRICT: CountryId[] = ["uk", "canada", "schengen", "usa", "australia"];

/** Funds in lacs of PKR. `visit` is per person; `study` is for the first applicant (+ `studyPerDependant` for each extra person). */
export interface FundsConfig {
  visit: Partial<Record<CountryId, number>>;
  study: Partial<Record<CountryId, number>>;
  studyPerDependant: number;
  workPerPerson: number;
  prPerPerson: number;
}

export const DEFAULT_FUNDS: FundsConfig = {
  visit: { uk: 15, canada: 15, schengen: 15, usa: 15, australia: 15, turkey: 5, dubai: 5, malaysia: 5 },
  study: { uk: 30, canada: 30, australia: 35, usa: 40, germany: 35 },
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
