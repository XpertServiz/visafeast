// Document checklists for every country and service (visit, study, work, immigration). Used by the admin Checklists tab and by the Aiman page.
// Visit and study lists come from each country page's own official documents list when there is one. Work lists add the items that official
// government pages told us about (read 12–13 November 2026; sources are the Work permit guides). Everything else is the standard set of papers
// nearly every application asks for, clearly labelled "typical": the consultant confirms the exact list for the client's case.
import type { CountryId } from "@/config/aiman";

export type ChecklistKind = "visit" | "study" | "work" | "immigration";
export interface CheckItem { title: string; detail?: string }
export interface ChecklistModel { title: string; subtitle: string; items: CheckItem[]; note: string; checked: string | null; official: boolean }

/** Country page code in the database and in the guides (Schengen is "EU"). */
export const COUNTRY_CODE: Record<CountryId, string> = {
  uk: "GB", canada: "CA", usa: "US", australia: "AU", newzealand: "NZ", schengen: "EU", germany: "DE", france: "FR", italy: "IT", netherlands: "NL", portugal: "PT", ireland: "IE",
  greece: "GR", japan: "JP", korea: "KR", turkey: "TR", dubai: "AE", saudi: "SA", malaysia: "MY", singapore: "SG", thailand: "TH", srilanka: "LK", azerbaijan: "AZ",
};

const ID: CheckItem[] = [
  { title: "Passport", detail: "Valid for at least 6 months, with blank pages. Bring old passports too." },
  { title: "Passport-size photographs", detail: "Recent, plain background, as the embassy specifies." },
  { title: "CNIC copy", detail: "Front and back." },
];
const FAMILY: CheckItem[] = [{ title: "Family papers (if family applies)", detail: "Marriage certificate, children's birth certificates, family registration certificate (FRC)." }];

export const COMMON: Record<ChecklistKind, CheckItem[]> = {
  visit: [...ID,
    { title: "Bank statements", detail: "Last 6 months, stamped by the bank, with a steady balance. Source of any large deposit explained." },
    { title: "Proof of income", detail: "Salary slips and employment letter, or business registration (NTN / SECP) and tax records." },
    { title: "Travel plan", detail: "Flight and hotel bookings or an invitation, and a short cover letter on why you will return to Pakistan." },
    { title: "Proof of ties to Pakistan", detail: "Property papers, family, job or business." }, ...FAMILY],
  study: [...ID,
    { title: "Offer / admission letter", detail: "From the university or college." },
    { title: "Academic documents", detail: "Matric, Inter and degree certificates and transcripts." },
    { title: "English test result", detail: "IELTS, PTE or Duolingo, if the programme asks for it." },
    { title: "Proof of funds", detail: "Bank statements, sponsor letter and sponsor's documents, with the source of funds explained." },
    { title: "Statement of purpose", detail: "Why this course and country, and your plan after study." }, ...FAMILY],
  work: [...ID,
    { title: "Job offer or employment contract", detail: "From a real employer. Never pay anyone for a job offer." },
    { title: "CV", detail: "Up to date, matching your documents." },
    { title: "Education documents", detail: "Degrees, diplomas and transcripts, and their recognition or assessment where the country asks for it." },
    { title: "Work experience proof", detail: "Experience letters, salary slips, tax records or bank statements showing the salary." },
    { title: "Language test result", detail: "IELTS / PTE / Japanese or Korean test etc., where the route needs it." },
    { title: "Police clearance certificate", detail: "Where the country asks for it." },
    { title: "Medical examination", detail: "Where the country asks for it." },
    { title: "Proof of funds", detail: "Where the route asks for savings." }, ...FAMILY],
  immigration: [...ID,
    { title: "Education documents and credential assessment", detail: "Degrees and transcripts, and the assessment report the programme asks for." },
    { title: "Language test result", detail: "IELTS / PTE / CELPIP etc.; the points depend on the score." },
    { title: "Work experience proof", detail: "Experience letters, salary slips, tax records and job descriptions." },
    { title: "Police clearance certificates", detail: "For every country you lived in for the period the programme asks." },
    { title: "Medical examination", detail: "By an approved doctor, when requested." },
    { title: "Proof of funds", detail: "Bank statements, if the programme asks for settlement funds." }, ...FAMILY],
};

/** Extra work-permit items taken from the official pages in lib/guides/work.ts. */
const WORK_EXTRA: Partial<Record<string, CheckItem[]>> = {
  GB: [{ title: "Certificate of sponsorship (CoS)", detail: "From a Home Office-approved employer, for the Skilled Worker, Health and Care Worker and Scale-up routes." }, { title: "English at B2 (usually)", detail: "Proved with an approved test." }, { title: "Savings of at least £1,270", detail: "Held for 28 days in a row, unless exempt." }],
  CA: [{ title: "LMIA letter and signed contract", detail: "Sent by the employer after a positive LMIA (employer-specific permit)." }, { title: "Biometrics", detail: "CAD 85 per person; check whether Pakistan is on IRCC's list." }],
  DE: [{ title: "Degree recognised in Germany", detail: "Proof from the anabin database or a Statement of Comparability." }, { title: "Opportunity Card: money for living costs", detail: "€1,027 per month, and €500 for the return ticket (Consulate General Karachi)." }, { title: "Job contract (Blue Card and skilled worker)", detail: "A valid contract with a German company; for the Blue Card at least 6 months." }, { title: "Vocational qualification recognised", detail: "By the competent German authority (vocational route)." }],
  NZ: [{ title: "Job offer and approved job check", detail: "From an accredited employer, at least 30 hours a week, paid at least the wage rate." }, { title: "Experience evidence from others", detail: "Employment certificates, payslips or tax certificates (a CV alone is not enough)." }, { title: "Police certificates", detail: "Less than 6 months old, age 17 or older, stay of 24 months or longer." }, { title: "Chest X-ray", detail: "For stays over 6 months, for people from countries without a low rate of tuberculosis." }],
  IE: [{ title: "Job offer for the permit", detail: "Critical Skills: at least 2 years. Apply at least 12 weeks before the start date." }],
  NL: [{ title: "Recognised employer (IND)", detail: "Only an IND-recognised employer can apply for the highly skilled migrant permit." }, { title: "Diploma or 5 years of experience", detail: "For the EU Blue Card; contract of at least 6 months." }],
  PT: [{ title: "Work contract, work promise or employer's interest letter", detail: "Plus a professional certificate if the profession is regulated in Portugal." }],
  JP: [{ title: "Japanese language test and skills test", detail: "For Specified Skilled Worker (i), unless you completed Technical Intern Training (ii)." }, { title: "Registration with the Protector of Emigrants", detail: "Pakistan's Bureau of Emigration, before working abroad." }],
  US: [{ title: "Certified Labor Condition Application and approved petition", detail: "Both done by the US employer (H-1B)." }],
  FR: [{ title: "Employer's work authorisation", detail: "Filed online by the French employer before you enter France (employee and temporary worker cards)." }],
  AU: [{ title: "Employer sponsorship / nomination", detail: "For Skills in Demand (482) and Employer Nomination (186); health and character checks apply." }],
  KR: [{ title: "Korean language test (EPS)", detail: "Part of the Employment Permit System; confirm the current intake for Pakistan." }],
  SA: [{ title: "Employer's work visa authorisation", detail: "Paid and sent by the employer; a health certificate payment for the applicant." }],
  AE: [{ title: "Employer applies for the work visa", detail: "Standard employment visa is applied for by the employer." }],
};

const KIND_NAME: Record<ChecklistKind, string> = { visit: "Visit visa", study: "Study visa", work: "Work permit", immigration: "Immigration" };
export const kindName = (k: ChecklistKind) => KIND_NAME[k];

/** The checklist for one country and service. `db` is the country page's own official list (visit and study) when it has one. */
export function buildChecklist(kind: ChecklistKind, name: string, code: string, db?: { documents: CheckItem[]; checked: string | null } | null): ChecklistModel {
  const own = db?.documents?.length ? db.documents : null;
  const items = own ?? [...COMMON[kind].slice(0, 3), ...(kind === "work" ? WORK_EXTRA[code] ?? [] : []), ...COMMON[kind].slice(3)];
  return {
    title: `${name}: ${KIND_NAME[kind]} document checklist`,
    subtitle: own ? `DOCUMENT CHECKLIST · LAST CHECKED ${db?.checked ?? "being verified"}` : "DOCUMENT CHECKLIST · TYPICAL DOCUMENTS",
    items,
    official: Boolean(own),
    checked: db?.checked ?? null,
    note: own
      ? "Every case is different: your Visafeast consultant confirms the exact list for you."
      : "These are the typical documents. The exact list depends on your case and can change: your Visafeast consultant confirms it from the official page before you apply.",
  };
}
