import type { GuideContent } from "./types";
import { MORE_GUIDES } from "./more";

const CHECKED = "2026-11-05";
const US_RESTRICTIONS = { heading: "Check before you plan: entry restrictions", md: "The US Embassy in Pakistan says that under Presidential Proclamation 10998 (in effect from 1 January 2026) the United States is suspending or limiting entry and visa issuance for nationals of 39 countries. People subject to it can still apply and attend interviews, but may be refused a visa or entry. Read the Embassy's notice and travel.state.gov to see whether it applies to your passport." };
const US_INTERVIEWS = { heading: "Where interviews happen", md: "The visa section of the US Embassy in Islamabad does immigrant and nonimmigrant visa interviews, by appointment only. The US Consulate General in Karachi does nonimmigrant interviews only." };
const US_EMBASSY = { label: "Visas (US Embassy and Consulates in Pakistan)", url: "https://pk.usembassy.gov/visas/" };

/** Extra, source-backed content for the Visit and Study pages, by page slug. The database values always win; these fill what it leaves empty. */
export const GUIDES: Record<string, GuideContent> = {
  // ---------------------------------------------------------------- VISIT
  "uk-visit-visa-from-pakistan": {
    photos: "GB", checked: CHECKED,
    overview: "A Standard Visitor visa lets you visit the UK for tourism, to see family or friends, for certain business activities, to study for up to 6 months, and for medical treatment. You can usually stay up to 6 months.",
    options: [
      { name: "Tourism, family and friends", summary: "A holiday, visiting family or friends, or passing through the UK on your way to another country." },
      { name: "Business visits", summary: "Attending a meeting or interview, and certain other business activities. Paid or unpaid work for a UK company is not allowed." },
      { name: "Short study and medical treatment", summary: "Study courses of up to 6 months, a placement or an exam, a recreational course of up to 30 days, or travel for medical reasons." },
      { name: "Volunteering", summary: "Volunteering for up to 30 days with a registered charity." },
    ],
    extra: [{ heading: "What you cannot do on this visa", md: "- Do paid or unpaid work for a UK company or as a self-employed person (a permitted paid engagement is the exception)\n- Claim public funds (benefits)\n- Live in the UK for long periods through frequent or successive visits\n- Marry or register a civil partnership, or give notice of one. You would need a Marriage Visitor visa." }],
    sources: [{ label: "Standard Visitor visa (GOV.UK)", url: "https://www.gov.uk/standard-visitor" }, { label: "Apply for a Standard Visitor visa (GOV.UK)", url: "https://www.gov.uk/standard-visitor/apply-standard-visitor-visa" }],
  },
  "canada-visit-visa-from-pakistan": {
    photos: "CA", checked: CHECKED,
    overview: "A visitor visa lets you visit Canada. You must convince an immigration officer that you will go back home, and that you have enough money for your stay.",
    options: [
      { name: "Visitor visa (TRV)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eligibility.html", summary: "For people who need a visa to visit Canada. You must meet some basic requirements and not be inadmissible to Canada (for example for security, health or financial reasons)." },
    ],
    documents: [
      { title: "Valid passport or travel document" },
      { title: "Proof of ties to Pakistan", detail: "Such as a job, home, financial assets or family that will take you back home." },
      { title: "Proof of money for your stay", detail: "The amount depends on how long you stay and whether you stay in a hotel or with friends or relatives." },
      { title: "Papers for children under 18", detail: "If minor children travel with you, with someone else or alone, check the IRCC rules on what to prepare." },
      { title: "The IRCC personal checklist", detail: "IRCC gives a list of documents based on your situation. Use it as your final check." },
    ],
    sources: [{ label: "Visit Canada (Canada.ca)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html" }, { label: "Eligibility to apply for a visitor visa (Canada.ca)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eligibility.html" }],
  },
  "usa-visit-visa-from-pakistan": {
    photos: "US", checked: CHECKED,
    overview: "A US visitor visa is for a short, temporary visit. B-1 is for business, B-2 is for tourism, and B-1/B-2 is for both. You apply online with form DS-160 and attend an interview by appointment. Visitor visa holders cannot work in the United States.",
    options: [
      { name: "B-1 business visitor", url: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html", summary: "For business such as meeting business associates or attending a conference." },
      { name: "B-2 tourism visitor", url: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html", summary: "For travel for pleasure, such as a short vacation, visiting family and friends, or medical treatment." },
    ],
    extra: [US_RESTRICTIONS, US_INTERVIEWS, { heading: "Do not buy tickets too early", md: "The US State Department advises that you do not make final travel plans or buy tickets until you have your visa." }],
    sources: [{ label: "Visitor visa (travel.state.gov)", url: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html" }, US_EMBASSY],
  },
  "australia-visit-visa-from-pakistan": {
    photos: "AU", checked: CHECKED,
    overview: "The Visitor visa (subclass 600) is for tourists, business visitors and people visiting family, for 3, 6 or 12 months. You need enough funds to support your stay and to leave.",
    facts: { embassy_fee_text: "From AUD 250 (concessions apply in limited circumstances)", max_stay_text: "Up to 12 months", processing_time_text: "Home Affairs shows recent decision times in its processing-time guide" },
    funds: "You must have enough funds to support your stay in Australia and to leave.",
    options: [{ name: "Tourist stream (apply outside Australia)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600", summary: "For tourists applying from outside Australia. Some travellers can instead use an Electronic Travel Authority (subclass 601) or eVisitor (subclass 651): check on Home Affairs if you are eligible." }],
    sources: [{ label: "Visitor visa subclass 600 (Home Affairs)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600" }],
  },
  "new-zealand-visit-visa-from-pakistan": {
    photos: "NZ", checked: CHECKED,
    overview: "People travelling on a passport from some countries must apply for a Visitor Visa to visit New Zealand. You can stay for up to 6 or 9 months, and you cannot work.",
    sources: [{ label: "Visitor Visa (Immigration New Zealand)", url: "https://www.immigration.govt.nz/visas/visitor-visa/" }],
  },
  "schengen-visa-from-pakistan": {
    photos: "EU", checked: CHECKED,
    overview: "A Schengen visa lets non-EU citizens make a short visit of up to 90 days in any 180-day period to a country in the Schengen area. It can be single-entry, or multiple-entry for as long as the visa is valid.",
    options: [
      { name: "Single-entry visa", summary: "One visit to the Schengen area." },
      { name: "Multiple-entry visa", summary: "Several visits to the Schengen area for as long as the visa is valid." },
    ],
    extra: [{ heading: "Where to apply", md: "- Apply at the consulate of the country you intend to visit.\n- If you visit several Schengen countries for stays of equal length, apply at the consulate of the first country you will visit.\n- As a general rule, apply at the consulate that covers the country where you legally live." }],
    sources: [{ label: "Applying for a Schengen visa (European Commission)", url: "https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en" }, { label: "Visa information, German Embassy Islamabad", url: "https://pakistan.diplo.de/pk-en/service/2208622-2208622" }],
  },
  "azerbaijan-visa-for-pakistani": {
    photos: "AZ", checked: CHECKED,
    overview: "Azerbaijan's official e-visa portal (ASAN Visa) is run by the State Agency for Public Service and Social Innovations. Only citizens of eligible countries can use it, so first check that your passport is on the portal's list.",
    facts: { processing_time_text: "Standard e-visa: within 3 working days. An urgent option is offered. Apply at least 3 working days before you arrive" },
    options: [
      { name: "Standard e-visa", url: "https://evisa.gov.az/en/information", summary: "Apply online in three steps: apply, pay and download. Enter your details directly in the system." },
      { name: "Urgent e-visa", url: "https://evisa.gov.az/en/information", summary: "A faster option on the same portal for people who cannot wait the standard time." },
    ],
    extra: [{ heading: "Before you apply", md: "- Check on the official portal that your passport is on the eligible-country list.\n- Your passport should expire at least 3 months after the e-visa expires.\n- Fees differ between pages we found, so read the current fee on the official portal." }],
    sources: [{ label: "About e-Visa (evisa.gov.az)", url: "https://evisa.gov.az/en/information" }, { label: "ASAN Visa (Ministry of Foreign Affairs)", url: "https://www.mfa.gov.az/en/category/visa/asan-visa" }],
  },
  "thailand-visa-from-pakistan": {
    photos: "TH", checked: CHECKED,
    overview: "Thailand's Ministry of Foreign Affairs runs the official Thailand e-Visa website. You apply online and choose your visa category to see its requirements. The Royal Thai Embassy in Islamabad gives extra guidance for people applying from Pakistan.",
    facts: { processing_time_text: "Embassy estimate: about 14 working days after the fee is received. Check the current time with the Embassy" },
    options: [{ name: "Tourist e-Visa", url: "https://www.thaievisa.go.th/", summary: "Apply online at thaievisa.go.th and pick the visa category. The approved e-Visa is emailed to you." }],
    extra: [{ heading: "Applying from Pakistan", md: "- Applicants in Pakistan apply through the Royal Thai Embassy in Islamabad or the Royal Thai Consulate-General in Karachi, and must be in Pakistan during the process.\n- Upload the passport photo page and a recent photo, plus proof of where you live in Pakistan.\n- Print your approved e-Visa. The Embassy says a copy on a phone or screen is not accepted.\n- The Embassy's FAQ says visa on arrival is not available for Pakistani passports. Rules change, so read its current page before you travel." }],
    sources: [{ label: "Thailand e-Visa (Ministry of Foreign Affairs)", url: "https://www.thaievisa.go.th/" }, { label: "Thailand visa questions for Pakistan (Royal Thai Embassy, Islamabad)", url: "https://islamabad.thaiembassy.org/en/content/96719-10-questions-about-thailand-visa-for-pakistan-and-afganistan-passport" }],
  },
  "singapore-visa-from-pakistan": {
    photos: "SG", checked: CHECKED,
    overview: "If your travel document is on the ICA list, you need a valid Singapore entry visa. A visa does not guarantee entry: officers at the checkpoint decide whether you can enter.",
    options: [
      { name: "Apply with a local contact", summary: "A local contact with a Singpass or Corppass account can apply for you." },
      { name: "Apply through a Singapore mission or agent", summary: "If you have no local contact, contact your nearest Singapore Overseas Mission about applying through it or its authorised visa agents." },
    ],
    extra: [{ heading: "Also needed", md: "- Submit the SG Arrival Card within 3 days before you arrive. It is not a visa.\n- Your period of stay is set by the electronic visit pass (e-Pass) you receive, not by the validity of the visa.\n- To stay longer, apply to extend your Short-Term Visit Pass." }],
    sources: [{ label: "Visa Guidelines (ICA Singapore)", url: "https://www.ica.gov.sg/information-and-e-services/entry-and-departure/entering-singapore/visa-guidelines" }],
  },

  // ---------------------------------------------------------------- STUDY
  "study-in-germany-from-pakistan": {
    photos: "DE", checked: CHECKED,
    overview: "Germany's national visa for study (category D) is for people admitted to study in Germany. The Federal Foreign Office says processing time varies with the reason for the stay and the quality of the application and documents.",
    options: [{ name: "Find courses and entry rules", url: "https://www.daad.de/en/studying-in-germany/", summary: "The DAAD (German Academic Exchange Service) lists courses and admission rules. Check the university's own requirements too." }],
    extra: [{ heading: "Good to know from the German Embassy", md: "- Visa fees are due in PKR at the current exchange rate.\n- The Embassy cannot print a visa in a passport that is not signed. Pakistani passports are valid only with the holder's signature or thumb impression." }],
    sources: [{ label: "Visa: General Information (German Embassy Islamabad)", url: "https://pakistan.diplo.de/pk-en/service/2208622-2208622" }, { label: "Studying in Germany (DAAD)", url: "https://www.daad.de/en/studying-in-germany/" }],
  },
  "study-in-uk-from-pakistan": {
    photos: "GB", checked: CHECKED,
    overview: "A Student visa lets you study in the UK if you are 16 or over, have been offered a place on a course by a licensed student sponsor, and can speak, read, write and understand English.",
    who_for: ["Students aged 16 or over with a place on a course from a licensed student sponsor", "People who can speak, read, write and understand English", "Students planning degree-level study: you can usually stay up to 5 years", "Graduates who want to stay and work afterwards on a Graduate visa"],
    options: [
      { name: "Student visa", url: "https://www.gov.uk/student-visa", summary: "For study at a further or higher education level from age 16. At degree level you can usually stay up to 5 years; below degree level, up to 2 years." },
      { name: "Child Student visa", url: "https://www.gov.uk/student-visa", summary: "If you are 16 or 17, you may be eligible for a Child Student visa instead." },
      { name: "Graduate visa", url: "https://www.gov.uk/student-visa", summary: "Lets you stay after you finish your course: 2 years if you apply on or before 31 December 2026, 18 months if on or after 1 January 2027, and 3 years after a PhD or other doctorate." },
    ],
    documents: [
      { title: "Confirmation of Acceptance for Studies (CAS)", detail: "From your licensed student sponsor. The course fee for your first year is shown on it." },
      { title: "Proof of money", detail: "Your course fee for 1 academic year (up to 9 months), plus living costs. The money must have been in your account for at least 28 days in a row." },
      { title: "Proof of English", detail: "You must be able to speak, read, write and understand English, and will usually need to prove it." },
    ],
    funds: "Living costs: £1,529 per month (up to 9 months) for courses in London, or £1,171 per month (up to 9 months) outside London, plus your course fee for 1 academic year. You need extra money for each family member you bring. You must hold the money for at least 28 days in a row, and the 28 days must end within 31 days of your application. (GOV.UK, read 5 November 2026.)",
    extra: [{ heading: "When to apply and travel", md: "- From outside the UK you can apply up to 6 months before your course starts.\n- You usually get a decision within 3 weeks from outside the UK.\n- You can arrive up to 1 week before the course starts if it lasts 6 months or less, or up to 1 month before if it is longer. Never travel before the start date on your visa." }],
    sources: [{ label: "Student visa (GOV.UK)", url: "https://www.gov.uk/student-visa" }, { label: "Money you need (GOV.UK)", url: "https://www.gov.uk/student-visa/money" }],
  },
  "study-in-canada-from-pakistan": {
    photos: "CA", checked: CHECKED,
    overview: "To study in Canada you apply for a study permit. IRCC lists the documents you need, and some depend on your situation.",
    documents: [
      { title: "Letter of acceptance", detail: "Always required. Your school gives you this." },
      { title: "Provincial or territorial attestation letter (PAL or TAL)", detail: "Needed in most cases. You get it from your school, and in most cases you must accept your offer and pay your tuition fees, in part or in full, first." },
      { title: "Proof of identity", detail: "Always required. A valid passport or travel document for you and each family member who comes with you, and 2 recent passport-size photos with the name and date of birth on the back." },
      { title: "Proof of funds", detail: "Always required." },
      { title: "Letter of explanation", detail: "Recommended." },
      { title: "Medical exam", detail: "Check if you need one." },
      { title: "Police certificate", detail: "Check if you need one." },
      { title: "Proof of care for minor children in Canada", detail: "Only if it applies to you." },
      { title: "Other documents for your country", detail: "IRCC lists extra documents depending on the country you apply from. Check the official page." },
    ],
    sources: [{ label: "Study permit (Canada.ca)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html" }, { label: "Study permit: get the right documents (Canada.ca)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html" }],
  },
  "study-in-usa-from-pakistan": {
    photos: "US", checked: CHECKED,
    overview: "To study in the USA you first apply to a school certified by the Student and Exchange Visitor Program (SEVP). The school gives you a Form I-20. You pay the I-901 SEVIS fee, then apply for your student visa.",
    options: [
      { name: "F-1 student visa", url: "https://www.ice.gov/sevis/students", summary: "For academic programmes at a university, college, high school, private elementary school, seminary, conservatory or other academic institution, including an English language training programme." },
      { name: "M-1 student visa", url: "https://www.ice.gov/sevis/students", summary: "For technical programmes at a vocational or other recognised non-academic institution, other than a language training programme." },
    ],
    documents: [
      { title: "Form I-20", detail: "From the designated school official at your SEVP-certified school. Each eligible dependant who comes with you needs one too." },
      { title: "I-901 SEVIS fee payment", detail: "Pay it after you receive your I-20. You need the school code printed on the form." },
      { title: "Visa application (DS-160)", detail: "The online application form for the visa, followed by an interview by appointment." },
    ],
    extra: [US_RESTRICTIONS, US_INTERVIEWS],
    sources: [{ label: "Students (ICE, Student and Exchange Visitor Program)", url: "https://www.ice.gov/sevis/students" }, { label: "Students and the Form I-20 (Study in the States)", url: "https://studyinthestates.dhs.gov/students/prepare/students-and-the-form-i-20" }, US_EMBASSY],
  },
  "study-in-australia-from-pakistan": {
    photos: "AU", checked: CHECKED,
    overview: "The Student visa (subclass 500) lets you study full-time in a recognised educational institution in Australia. You can stay for up to 6 years, in line with your enrolment.",
    facts: { max_stay_text: "Up to 6 years, in line with your enrolment", processing_time_text: "Home Affairs shows recent decision times in its processing-time guide" },
    documents: [
      { title: "Confirmation of Enrolment (CoE)", detail: "You need one for every course you plan to take, and you must hold a valid CoE when your visa is decided." },
      { title: "Overseas Student Health Cover (OSHC)", detail: "Needed unless you fall into an exemption category." },
      { title: "English language evidence", detail: "You might need to give evidence of your English skills when you apply." },
    ],
    extra: [{ heading: "New rules from 2 October 2026", md: "Home Affairs says that from 2 October 2026 there are new rules for Student visas (subclass 500) and Student Guardian visas (subclass 590). They change who can apply and be granted a visa while in Australia. Read the current page before you apply." }],
    sources: [{ label: "Student visa subclass 500 (Home Affairs)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500" }],
  },
  "study-in-italy-from-pakistan": {
    photos: "IT", checked: CHECKED,
    overview: "Universitaly is the official portal for studying at Italian universities. It lists courses and the national admission tests for limited-enrolment programmes, such as Medicine (IMAT).",
    options: [{ name: "Universitaly portal", url: "https://www.universitaly.it/en", summary: "Find courses, rules and national admission tests for limited-enrolment programmes." }],
    sources: [{ label: "Universitaly", url: "https://www.universitaly.it/en" }],
  },
  "study-in-greece-from-pakistan": {
    photos: "GR", checked: CHECKED,
    overview: "Study in Greece (SiG) is Greece's national agency for the internationalisation of higher education. Its website lists Greek universities and bachelor's and master's programmes.",
    options: [{ name: "Study in Greece portal", url: "https://studyingreece.edu.gr/", summary: "Find universities and bachelor's and master's programmes taught in Greece." }],
    sources: [{ label: "Study in Greece", url: "https://studyingreece.edu.gr/" }],
  },
  "study-in-europe-from-pakistan": {
    photos: "EU2", checked: CHECKED,
    overview: "Each European country has its own student visa and admission rules. Tell us which country you are considering and we check its official source for you.",
    sources: [{ label: "Applying for a Schengen visa (European Commission)", url: "https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en" }],
  },
};

Object.assign(GUIDES, MORE_GUIDES);
