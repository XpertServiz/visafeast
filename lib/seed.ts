// Built-in sample/seed data. Used when Supabase is not configured yet, and mirrored by supabase/seed.sql.
// RULE (brief §0.3): no invented fees, times or rules. Unknown values are null -> the "being verified" fallback shows.
// RULE (brief §9.6): NO reviews are seeded. The reviews list starts empty.
import type { Country, Faq, Item, Kind, NewsItem, Review, HeroVideo, SiteSettings } from "./types";

const OUR_STEPS: Item[] = [
  { title: "Free 15-minute call", detail: "Tell us where you want to go and why. We tell you honestly what to prepare." },
  { title: "File review", detail: "We check your documents against the official list and point out weak spots before you pay any embassy fee." },
  { title: "Preparation", detail: "Your personal checklist, a clear travel plan and a cover letter that explains your funds and purpose." },
  { title: "Application support", detail: "Help with the online form, payment steps and appointment booking." },
  { title: "Decision and next steps", detail: "We update you on WhatsApp. If a file is refused, we read the letter and plan the next step honestly." },
];
const GENERIC_REFUSALS: Item[] = [
  { title: "Unexplained deposits", detail: "Large sums that appear just before applying, with no clear source." },
  { title: "Weak ties to Pakistan", detail: "The officer is not convinced you will return home." },
  { title: "Inconsistent details", detail: "Dates, jobs or amounts that do not match across documents." },
  { title: "Unclear purpose", detail: "No clear reason or plan for the trip." },
];
const VISIT_WHO: string[] = ["Tourists and holiday travellers", "Families visiting relatives or friends", "Business visitors attending meetings or conferences", "First-time travellers who want a file prepared properly"];
const STUDY_WHO: string[] = ["Students after matric, intermediate or bachelor's", "Parents planning an overseas education", "Graduates looking for a master's abroad"];
const EMPTY = {
  embassy_fee_text: null, embassy_fee_pkr: null, vfs_fee_text: null, service_fee_pkr: null, processing_time_text: null,
  max_stay_text: null, apply_window_text: null, biometrics_text: null, facts_source_url: null, facts_last_checked: null,
  funds_md: null, licensed_partner: null,
};
const NOW = "2026-10-23T00:00:00Z";

type Seed = Partial<Country> & Pick<Country, "slug" | "kind" | "country_name" | "country_code" | "flag" | "to_code" | "visa_name" | "card_note" | "h1" | "meta_title" | "meta_description" | "intro">;
const mk = (s: Seed, i: number): Country => ({
  id: `seed-${s.slug}`,
  from_code: "KHI",
  ...EMPTY,
  who_for_md: s.kind === "study" ? STUDY_WHO : VISIT_WHO,
  documents: [],
  steps: OUR_STEPS,
  refusal_reasons: s.kind === "study" ? [] : GENERIC_REFUSALS,
  extra_sections: [],
  related_slugs: [],
  keywords: [s.country_name.toLowerCase()],
  pathways: [],
  is_published: s.kind !== "immigration",
  sort_order: (i + 1) * 10,
  updated_at: NOW,
  ur_status: "none",
  ...s,
});

const visit = (slug: string, name: string, cc: string, flag: string, to: string, visaName: string, note: string, h1: string, title: string, desc: string, extra: Partial<Country> = {}): Seed => ({
  slug, kind: "visit", country_name: name, country_code: cc, flag, to_code: to, visa_name: visaName, card_note: note, h1, meta_title: title, meta_description: desc,
  intro: `Planning a trip to ${name}? We check your documents, explain your funds properly and prepare a file that matches your plan.`, ...extra,
});
const study = (slug: string, name: string, cc: string, flag: string, to: string, visaName: string, h1: string, title: string, desc: string): Seed => ({
  slug, kind: "study", country_name: name, country_code: cc, flag, to_code: to, visa_name: visaName, card_note: "UNIVERSITY · STUDENT", h1, meta_title: title, meta_description: desc,
  intro: `Thinking of studying in ${name}? We help you choose, prepare and file — with every requirement checked against the official source.`,
});

const ukDocs: Item[] = [
  { title: "Passport (plus old passports)", detail: "Valid passport and all previous passports with travel history." },
  { title: "6 months of bank statements", detail: "Personal or business statements that show regular income and a steady balance." },
  { title: "Proof of job or business", detail: "Employment letter, payslips, or business registration." },
  { title: "FBR tax returns (NTN)", detail: "Recent tax returns if you file them." },
  { title: "Travel plan", detail: "Dates and places you plan to visit. Flights do not need to be booked before applying." },
  { title: "Invitation letter (if visiting someone)", detail: "From the host in the UK, with their status and address." },
  { title: "Sponsor documents (if sponsored)", detail: "The sponsor's statements and a letter explaining the relationship." },
  { title: "Family ties", detail: "FRC, marriage certificate and similar documents showing links to Pakistan." },
  { title: "Property or other assets (optional)", detail: "Shows ties and financial stability." },
];

const seeds: Seed[] = [
  visit("uk-visit-visa-from-pakistan", "United Kingdom", "GB", "gb", "LHR", "Standard Visitor visa", "TOURISM · FAMILY", "UK Visit Visa from Pakistan", "UK Visit Visa from Pakistan: Fees & Documents | Visafeast", "UK Standard Visitor visa from Pakistan: documents, bank statement advice, fees and timelines with the date we last checked. Free eligibility check.", {
    embassy_fee_text: "£135 (up to 6 months). Long-term: 2 years £506 · 5 years £903 · 10 years £1,128 (6 months per visit)",
    processing_time_text: "Usually within 3 weeks", max_stay_text: "Up to 6 months per visit", apply_window_text: "Earliest 3 months before travel",
    biometrics_text: "Fingerprints and photo at a visa application centre",
    facts_source_url: "https://www.gov.uk/standard-visitor/apply-standard-visitor-visa", facts_last_checked: "2026-10-23",
    documents: ukDocs,
    funds_md: "There is no fixed amount set by UK Visas and Immigration. The officer checks three things: that your funds cover the full trip, that they match your income, and that the money has been in your account long enough to be explained. A large deposit shortly before applying is one of the most common refusal reasons. If someone else pays for your trip, include their statements and a letter explaining the relationship.",
    refusal_reasons: [
      { title: "Unexplained deposits", detail: "Large sums that appear just before applying, with no clear source." },
      { title: "Weak ties to Pakistan", detail: "The officer is not convinced you will return." },
      { title: "Inconsistent details", detail: "Dates, jobs or amounts that do not match across documents." },
      { title: "Unclear purpose", detail: "No clear reason or plan for the trip." },
    ],
    related_slugs: ["canada-visit-visa-from-pakistan", "schengen-visa-from-pakistan", "study-in-uk-from-pakistan"],
    keywords: ["uk", "united kingdom", "gb", "uk visas and immigration"],
  }),
  visit("canada-visit-visa-from-pakistan", "Canada", "CA", "ca", "YYZ", "Visitor visa (TRV)", "TOURISM · FAMILY", "Canada Visit Visa from Pakistan", "Canada Visit Visa from Pakistan: Documents Guide | Visafeast", "Canada visitor visa from Pakistan: documents checklist, bank statement guidance and how we prepare your file. Fees shown only when verified.", { related_slugs: ["usa-visit-visa-from-pakistan", "uk-visit-visa-from-pakistan", "study-in-canada-from-pakistan"], keywords: ["canada", "ca", "ircc"] }),
  visit("usa-visit-visa-from-pakistan", "United States", "US", "us", "JFK", "B1/B2 visitor visa", "TOURISM · BUSINESS", "USA Visit Visa from Pakistan", "USA Visit Visa (B1/B2) from Pakistan: Guide | Visafeast", "USA B1/B2 visit visa from Pakistan: preparing for the interview, documents and fees verified against official sources.", { related_slugs: ["canada-visit-visa-from-pakistan", "uk-visit-visa-from-pakistan", "study-in-usa-from-pakistan"], keywords: ["usa", "united states", "us", "b1", "b2"] }),
  visit("australia-visit-visa-from-pakistan", "Australia", "AU", "au", "SYD", "Visitor visa (subclass 600)", "TOURISM · FAMILY", "Australia Visit Visa from Pakistan", "Australia Visit Visa (Subclass 600) from Pakistan | Visafeast", "Australia subclass 600 visitor visa from Pakistan: documents, bank statement advice and honest file review.", { related_slugs: ["new-zealand-visit-visa-from-pakistan", "uk-visit-visa-from-pakistan", "study-in-australia-from-pakistan"], keywords: ["australia", "au", "subclass 600", "home affairs"] }),
  visit("new-zealand-visit-visa-from-pakistan", "New Zealand", "NZ", "nz", "AKL", "Visitor visa", "TOURISM · FAMILY", "New Zealand Visit Visa from Pakistan", "New Zealand Visit Visa from Pakistan: Documents | Visafeast", "New Zealand visitor visa from Pakistan: documents checklist and file preparation with verified fees and times.", { related_slugs: ["australia-visit-visa-from-pakistan", "canada-visit-visa-from-pakistan"], keywords: ["new zealand", "nz", "immigration new zealand"] }),
  visit("schengen-visa-from-pakistan", "Schengen / Europe", "EU", "eu", "FCO", "Schengen short-stay visa", "TOURISM · FAMILY", "Schengen Visa from Pakistan", "Schengen Visa from Pakistan: Documents & Guide | Visafeast", "Schengen visa from Pakistan: choosing the right country, documents and how to prepare a consistent file.", { to_code: "FCO", related_slugs: ["uk-visit-visa-from-pakistan", "study-in-europe-from-pakistan"], keywords: ["schengen", "europe", "eu", "italy", "greece", "germany"] }),
  visit("azerbaijan-visa-for-pakistani", "Azerbaijan", "AZ", "az", "GYD", "E-visa", "E-VISA · TOURISM", "Azerbaijan Visa for Pakistani Citizens", "Azerbaijan Visa for Pakistani Citizens | Visafeast", "Azerbaijan (Baku) visa for Pakistani citizens: how to apply, what to prepare and where to check the current fee.", { related_slugs: ["thailand-visa-from-pakistan", "singapore-visa-from-pakistan"], keywords: ["azerbaijan", "baku", "az"] }),
  visit("thailand-visa-from-pakistan", "Thailand", "TH", "th", "BKK", "Tourist visa / e-visa", "TOURISM · LEISURE", "Thailand Visa from Pakistan", "Thailand Visa from Pakistan: How to Apply | Visafeast", "Thailand visa from Pakistan: how to apply and what to prepare, with current fees verified before we show them.", { related_slugs: ["singapore-visa-from-pakistan", "azerbaijan-visa-for-pakistani"], keywords: ["thailand", "bangkok", "th"] }),
  visit("singapore-visa-from-pakistan", "Singapore", "SG", "sg", "SIN", "Visit pass", "TOURISM · BUSINESS", "Singapore Visa from Pakistan", "Singapore Visa from Pakistan: Documents Guide | Visafeast", "Singapore visit visa from Pakistan: documents and how to prepare, with fees checked against the official source.", { related_slugs: ["thailand-visa-from-pakistan", "azerbaijan-visa-for-pakistani"], keywords: ["singapore", "sg"] }),

  study("study-in-germany-from-pakistan", "Germany", "DE", "de", "BER", "National student visa", "Study in Germany from Pakistan", "Study in Germany from Pakistan: Guide | Visafeast", "Study in Germany from Pakistan: universities, blocked account, language needs and student visa steps, verified against official sources."),
  study("study-in-uk-from-pakistan", "United Kingdom", "GB", "gb", "LHR", "Student visa", "Study in the UK from Pakistan", "Study in the UK from Pakistan: Student Visa Guide | Visafeast", "Study in the UK from Pakistan: course choice, CAS, English tests, funds and student visa steps."),
  study("study-in-canada-from-pakistan", "Canada", "CA", "ca", "YYZ", "Study permit", "Study in Canada from Pakistan", "Study in Canada from Pakistan: Study Permit Guide | Visafeast", "Study in Canada from Pakistan: study permit, PAL, GIC and costs explained with official links."),
  study("study-in-usa-from-pakistan", "United States", "US", "us", "JFK", "F-1 student visa", "Study in the USA from Pakistan", "Study in the USA from Pakistan: F-1 Visa Guide | Visafeast", "Study in the USA from Pakistan: admissions, F-1 visa interview preparation and funds."),
  study("study-in-australia-from-pakistan", "Australia", "AU", "au", "SYD", "Student visa (subclass 500)", "Study in Australia from Pakistan", "Study in Australia from Pakistan: Student Visa Guide | Visafeast", "Study in Australia from Pakistan: course choice, student visa subclass 500 steps and funds."),
  study("study-in-italy-from-pakistan", "Italy", "IT", "it", "FCO", "National student visa", "Study in Italy from Pakistan", "Study in Italy from Pakistan: Universities & Visa | Visafeast", "Study in Italy from Pakistan: pre-enrolment, scholarships and the student visa process."),
  study("study-in-greece-from-pakistan", "Greece", "GR", "gr", "ATH", "National student visa", "Study in Greece from Pakistan", "Study in Greece from Pakistan: Universities & Visa | Visafeast", "Study in Greece from Pakistan: university options and the student visa process."),
  study("study-in-europe-from-pakistan", "Other Europe", "EU", "eu", "AMS", "National student visa", "Study in Europe from Pakistan", "Study in Europe from Pakistan: Countries & Visas | Visafeast", "Study in Europe from Pakistan: comparing countries, universities and student visa routes."),

  { slug: "canada-express-entry-from-pakistan", kind: "immigration", country_name: "Canada", country_code: "CA", flag: "ca", to_code: "YYZ", visa_name: "Express Entry", card_note: "PR · SKILLED", h1: "Canada Express Entry from Pakistan", meta_title: "Canada Immigration from Pakistan: Express Entry | Visafeast", meta_description: "Canada immigration from Pakistan: how Express Entry works and what to prepare. Filed through licensed partners where the law requires.", intro: "Skilled pathways to Canada, explained simply. Programmes open, pause and change — every figure is shown only with an official source and date.", licensed_partner: null, keywords: ["canada", "express entry", "ca"] },
  { slug: "australia-skilled-visa-from-pakistan", kind: "immigration", country_name: "Australia", country_code: "AU", flag: "au", to_code: "SYD", visa_name: "Skilled visas (189 / 190 / 491)", card_note: "PR · SKILLED", h1: "Australia Skilled Visa from Pakistan", meta_title: "Australia PR from Pakistan: Skilled Visas | Visafeast", meta_description: "Australia PR from Pakistan: skilled visa routes explained, with official sources. Filed with registered migration agents.", intro: "Skilled migration to Australia, explained in plain words with official sources.", keywords: ["australia", "skilled", "au"] },
  { slug: "germany-opportunity-card-from-pakistan", kind: "immigration", country_name: "Germany", country_code: "DE", flag: "de", to_code: "BER", visa_name: "Opportunity Card (Chancenkarte)", card_note: "WORK · SKILLED", h1: "Germany Opportunity Card from Pakistan", meta_title: "Germany Opportunity Card from Pakistan | Visafeast", meta_description: "Germany Opportunity Card (Chancenkarte) and EU Blue Card from Pakistan: who qualifies and what to prepare, with official sources.", intro: "Work and settle in Germany: the Opportunity Card and EU Blue Card explained simply.", keywords: ["germany", "opportunity card", "blue card", "de"] },
  { slug: "uk-skilled-worker-visa-from-pakistan", kind: "immigration", country_name: "United Kingdom", country_code: "GB", flag: "gb", to_code: "LHR", visa_name: "Skilled Worker visa", card_note: "WORK · SKILLED", h1: "UK Skilled Worker Visa from Pakistan", meta_title: "UK Skilled Worker Visa from Pakistan | Visafeast", meta_description: "UK Skilled Worker visa from Pakistan: sponsorship, certificate of sponsorship and requirements, shown with official sources.", intro: "Working in the UK with a sponsoring employer, explained simply.", keywords: ["uk", "skilled worker", "gb"] },
];

export const SEED_COUNTRIES: Country[] = seeds.map(mk);

export const IMMIGRATION_HUB: { name: string; code: string; flag: string; slug?: string; chips: string[] }[] = [
  { name: "Canada", code: "CA", flag: "ca", slug: "canada-express-entry-from-pakistan", chips: ["Express Entry (FSW, CEC, FST)", "Provincial Nominee Programs", "Atlantic Immigration Program", "Start-up Visa", "Spouse & family sponsorship"] },
  { name: "Australia", code: "AU", flag: "au", slug: "australia-skilled-visa-from-pakistan", chips: ["Skilled Independent (189)", "Skilled Nominated (190)", "Skilled Work Regional (491)", "Employer Nomination (186)", "Skills in Demand (482)", "National Innovation (858)", "Partner visas"] },
  { name: "United Kingdom", code: "GB", flag: "gb", slug: "uk-skilled-worker-visa-from-pakistan", chips: ["Skilled Worker", "Health and Care Worker", "Global Talent", "Innovator Founder", "Spouse / partner"] },
  { name: "USA", code: "US", flag: "us", chips: ["EB-2 NIW", "EB-1A extraordinary ability", "EB-5 investor", "H-1B (employer)", "Family-based green cards"] },
  { name: "Germany", code: "DE", flag: "de", slug: "germany-opportunity-card-from-pakistan", chips: ["EU Blue Card", "Opportunity Card (Chancenkarte)", "Skilled worker visa", "Family reunion"] },
  { name: "New Zealand", code: "NZ", flag: "nz", chips: ["Skilled Migrant Category", "Green List Straight to Residence", "Accredited Employer Work Visa", "Partner visas"] },
  { name: "Europe — other", code: "EU", flag: "eu", chips: ["Portugal D7 (passive income)", "Portugal job seeker visa", "Ireland Critical Skills Employment Permit", "Netherlands highly skilled migrant"] },
];

export const SEED_FAQS: Faq[] = [
  { q: "Do you guarantee a visa?", a: "No. No honest consultant can — only the embassy decides. What we promise is a complete, consistent file and an honest opinion of your chances before you pay embassy fees." },
  { q: "How much bank balance do I need for a UK visit visa?", a: "There is no fixed official amount. The officer checks that your funds cover the trip and match your income history. We review your statements in the free call." },
  { q: "I was refused before. Can you help?", a: "Yes. Send us the refusal letter; we address every point raised and tell you honestly if it's better to wait." },
  { q: "I live outside Karachi. Can I still use Visafeast?", a: "Yes. Consultations run on WhatsApp video or phone; you attend biometrics at your nearest VFS/visa centre." },
  { q: "How long does processing take?", a: "Depends on the country and season; each country page shows the current official time with the date we last checked it." },
  { q: "Do you help with immigration and PR?", a: "Yes — skilled, family and business pathways for Canada, Australia, the UK, USA, Germany, New Zealand and parts of Europe. Where the law requires a licensed representative, your case is filed with our licensed partners." },
  { q: "Can I read the website in my language?", a: "Yes. The website opens in your country's language. You can switch at the top, and all languages are listed at the bottom." },
].map((f, i) => ({ id: `faq-${i}`, country_slug: null, question: f.q, answer_md: f.a, sort_order: i }));

export const SEED_UK_FAQS: Faq[] = [
  { q: "How early can I apply?", a: "Up to 3 months before you travel. Decisions are usually made within 3 weeks, so applying 6–8 weeks ahead is sensible." },
  { q: "Should I apply for a 2, 5 or 10-year visa straight away?", a: "It is possible, but you must show genuine repeat visits. The long-term fee is not refunded if the application is refused, so first-time travellers usually start with 6 months." },
  { q: "Do I need to book flights before applying?", a: "No. A travel plan with dates is enough." },
  { q: "Can I work on a UK visit visa?", a: "No. Meetings and conferences are fine, but not paid work." },
].map((f, i) => ({ id: `ukfaq-${i}`, country_slug: "uk-visit-visa-from-pakistan", question: f.q, answer_md: f.a, sort_order: i }));

export const SEED_REVIEWS: Review[] = []; // NEVER seed reviews (brief §9.6)
export const SEED_NEWS: NewsItem[] = []; // filled by the daily feed
export const SEED_VIDEOS: HeroVideo[] = []; // owner adds YouTube links in Admin → Videos

export const SEED_NEWS_SOURCES = [
  { name: "GOV.UK — UK Visas and Immigration", url: "https://www.gov.uk/search/news-and-communications.atom?organisations%5B%5D=uk-visas-and-immigration", kind: "official_rss", country_codes: ["GB"], is_official: true },
  { name: "Canada.ca — IRCC news", url: "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofcitizenshipandimmigration&sort=publishedDate&orderBy=desc&pick=50&format=atom", kind: "official_rss", country_codes: ["CA"], is_official: true },
];

export const DEFAULT_SETTINGS: SiteSettings = {
  whatsapp_number: "+923076777020", whatsapp_number_pk: null, email: "visafeast@gmail.com", facebook_url: "https://www.facebook.com/visafeast/",
  address_line: "Karachi · consultations online across Pakistan", office_hours: "Mon–Sat 10am–7pm PKT", ntn: null, calcom_link: "visa-feast-pvus5i/15min",
  service_fee_mode: "quote", chatbot_enabled: true, llm_provider: "none", google_reviews_url: null, youtube_channel_url: null, hero_globe_style: "realistic",
  heading_font: "Fraunces", body_font: "Inter", urdu_font: "Noto Nastaliq Urdu",
  theme: "night_flight", accent_color: "#F2A93B", splash_style: "logo_fade", splash_duration_ms: 2200, splash_once_per_session: true,
};

export const Kind_LABEL: Record<Kind, string> = { visit: "VISIT", study: "STUDY", immigration: "IMMIGRATION" };
