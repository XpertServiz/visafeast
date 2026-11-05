import type { GuideContent, ImmigrationGuide } from "./types";

// Malaysia, Sri Lanka, Netherlands, France, Portugal, UAE. Every statement was read on the official page linked in `sources` on the date in `checked`.
// Anything the official pages did not state is left out (CLAUDE.md: never invent facts); the page then shows its single "being verified" note.
const CHECKED = "2026-11-06";
const VERIFY = "Fees and processing times change. Always check the official page before you apply.";
const SCHENGEN_STAY = { heading: "How long you can stay", md: "A Schengen short-stay visa lets you stay up to 90 days in any 180-day period. The visa shows the exact length of stay, and you must leave before the visa expires (European Commission, Migration and Home Affairs)." };
const SCHENGEN_SRC = { label: "EU visa policy (European Commission)", url: "https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en" };

export const MORE_GUIDES: Record<string, GuideContent> = {
  // ---------------------------------------------------------------- VISIT
  "malaysia-visa-from-pakistan": {
    photos: "MY", checked: CHECKED,
    overview: "Malaysia's Immigration Department runs the official visa services. Its website lists the MyVISA system, the Electronic Visa with Reference, and the Malaysia Digital Arrival Card (MDAC). The Department's pages we could read do not give a fee or processing time for Pakistani visitors, so we do not show one.",
    options: [
      { name: "MyVISA online system", url: "https://malaysiavisa.imi.gov.my/", summary: "The Immigration Department's online system for visa applications, linked from its official website." },
      { name: "Electronic Visa with Reference (eVDR)", url: "https://www.imi.gov.my/", summary: "Listed on the Immigration Department's website as one of its visa services." },
      { name: "Malaysia Digital Arrival Card (MDAC)", url: "https://www.imi.gov.my/", summary: "The Department lists the MDAC with its visa services. It is an arrival form, not a visa." },
    ],
    extra: [{ heading: "Good to know", md: "- The Malaysia My Second Home site says visitors can stay up to 3 months on a Single Entry Visa.\n- The Immigration Department has announced that the Multiple Entry Visa (MEV) is no longer available to all nationalities. Check the notice on its website." }],
    sources: [{ label: "Immigration Department of Malaysia", url: "https://www.imi.gov.my/" }, { label: "Malaysia My Second Home", url: "https://www.mm2h.gov.my/" }],
  },
  "sri-lanka-visa-from-pakistan": {
    photos: "LK", checked: CHECKED,
    overview: "Sri Lanka's official ETA site says that, from 25 May 2026, nationals of 40 listed countries can get a tourist visa (ETA) free of charge for 30 days. Pakistan is on that list.",
    facts: { embassy_fee_text: "Free: the 30-day tourist ETA is free for Pakistani nationals (official ETA site, notice effective 25 May 2026)", max_stay_text: "30 days, with double entry allowed within the 30 days" },
    options: [
      { name: "Free 30-day tourist ETA", url: "https://www.eta.gov.lk/", summary: "Apply online at the official ETA site. The notice says the free tourist visa is valid for 30 days, with double entry allowed from the date of first arrival within those 30 days." },
      { name: "Visa extension", url: "https://www.eta.gov.lk/", summary: "To stay longer than 30 days, you may apply for an extension and pay the applicable visa fee." },
    ],
    extra: [{ heading: "Check the fee before you pay", md: "The Department of Immigration's older fee table still shows paid tourist fees and does not mention the free scheme. The ETA site's notice of 25 May 2026 is the newer one. Always confirm on the official ETA site before you apply. ETA fees paid before 25 May 2026 are not refundable." }],
    sources: [{ label: "Electronic Travel Authorisation (Sri Lanka)", url: "https://www.eta.gov.lk/" }, { label: "Visa fees (Department of Immigration and Emigration)", url: "https://www.immigration.gov.lk/pages_e.php?id=45" }],
  },
  "netherlands-visa-from-pakistan": {
    photos: "NL", checked: CHECKED,
    overview: "A short visit to the Netherlands needs a Schengen short-stay visa, for up to 90 days. The Dutch government's NetherlandsWorldwide site explains the costs and lists who does not pay the visa fee.",
    facts: { max_stay_text: "Up to 90 days in any 180 days (Schengen short-stay visa)" },
    options: [{ name: "Schengen short-stay visa (type C)", url: "https://www.netherlandsworldwide.nl/visa-the-netherlands/visa-costs", summary: "For a visit of up to 90 days. The fee amount is on the Dutch consular fees overview, and a service fee is paid separately to the visa application centre." }],
    who_for: ["Children under 6, school pupils and students (with an accompanying teacher), and researchers do not pay the visa fee, as the page states.", "People aged 25 or under who represent a non-profit organisation at a sporting, cultural or educational event are also exempt."],
    extra: [{ heading: "Service fees", md: "Service fees are paid to VFS Global or TLScontact, even if you do not have to pay the visa fee. They differ by location, so check the amount where you apply." }, SCHENGEN_STAY],
    sources: [{ label: "Visa costs (NetherlandsWorldwide)", url: "https://www.netherlandsworldwide.nl/visa-the-netherlands/visa-costs" }, SCHENGEN_SRC],
  },
  "france-visa-from-pakistan": {
    photos: "FR", checked: CHECKED,
    overview: "France-Visas is the official French government website for visa applications. You check your situation, fill in the online form, book an appointment, file your papers, then follow your application until you get your passport back.",
    facts: { embassy_fee_text: "€90 application fee for a short-stay visa (€99 for a long-stay visa), France-Visas", apply_window_text: "At least 2 weeks before your visit, and not more than 6 months before", max_stay_text: "Shown on the visa. Up to 90 days in any 180 days for a short stay" },
    options: [
      { name: "Short-stay visa (tourism)", url: "https://france-visas.gouv.fr/en/web/france-visas/", summary: "For a tourist visit without any professional activity. Apply on France-Visas." },
      { name: "Family visit", url: "https://france-visas.gouv.fr/en/web/france-visas/", summary: "For visiting family without settling in France. The same France-Visas process applies." },
    ],
    extra: [
      { heading: "The five steps", md: "1. Ask about your situation and check if a visa is required.\n2. Complete the online application and upload the papers.\n3. Make your appointment.\n4. File your papers at the appointment: the final paper CERFA form and your receipt.\n5. Follow your application and get your passport back." },
      { heading: "Time and fees", md: "Processing time depends on your nationality, the purpose of your stay and local conditions. Some files need extra checks, which can take longer. The fee is €90 for a short-stay visa and €99 for a long-stay visa, as the France-Visas FAQ states. Beware of fraudulent sites: use only france-visas.gouv.fr." },
    ],
    sources: [{ label: "France-Visas (official site)", url: "https://france-visas.gouv.fr/en/web/france-visas/" }, { label: "France-Visas FAQ", url: "https://france-visas.gouv.fr/en/web/france-visas/faq" }],
  },
  "portugal-visa-from-pakistan": {
    photos: "PT", checked: CHECKED,
    overview: "Short visits to Portugal use a Schengen short-stay visa. Portugal's Ministry of Foreign Affairs runs the visa portal for both short-stay (Schengen) and national visas. Its pages we could read do not give the Schengen fee or processing time, so we do not show them.",
    options: [{ name: "Schengen short-stay visa", url: "https://vistos.mne.gov.pt/en/", summary: "For tourism and short visits. Portugal's visa portal covers short-stay visas separately from national visas." }],
    extra: [SCHENGEN_STAY, { heading: "Arrival rules", md: "The visa portal's news notes that the EU Entry/Exit System (EES) is fully implemented at Portuguese air and sea borders since 10 April 2026." }],
    sources: [{ label: "Visa portal (Portugal Ministry of Foreign Affairs)", url: "https://vistos.mne.gov.pt/en/" }, SCHENGEN_SRC],
  },
  "uae-visa-from-pakistan": {
    photos: "AE", checked: CHECKED,
    overview: "The UAE's Federal Authority for Identity, Citizenship, Customs and Port Security (ICA) issues entry permits for tourism, visits and treatment. The official pages we could read do not give visit-visa fees, validity or any rule specific to Pakistani passports, so we do not show them.",
    options: [
      { name: "Entry permit for tourism or visit", url: "https://icp.gov.ae/en/", summary: "An entry permit issued for a specific period, either for tourism, visit or treatment." },
      { name: "Job exploration visa (60 or 90 days)", url: "https://icp.gov.ae/en/", summary: "Single entry, without a host in the UAE, for people exploring job opportunities." },
      { name: "Visa to explore business opportunities (90 days)", url: "https://icp.gov.ae/en/", summary: "Single entry, without a host in the UAE." },
    ],
    sources: [{ label: "ICP — Federal Authority for Identity, Citizenship, Customs and Port Security", url: "https://icp.gov.ae/en/" }, { label: "Visit visa (UAE government portal)", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/Types-of-visas/Visit-visa" }],
  },

  // ---------------------------------------------------------------- STUDY
  "study-in-malaysia-from-pakistan": {
    photos: "MY", checked: CHECKED,
    overview: "Malaysia's student visa is applied for through EMGS (Education Malaysia Global Services), the official portal. You can only submit the application once your university or college has given you an offer letter.",
    options: [{ name: "Student pass through EMGS", url: "https://visa.educationmalaysia.gov.my/", summary: "Apply online on the EMGS portal after you receive your offer letter. The personal bond form is submitted after you arrive in Malaysia, for the student pass endorsement." }],
    documents: [
      { title: "Passport", detail: "Bio page, all visa pages and the observation page. Validity of 18 months or more." },
      { title: "Passport photo", detail: "White background, 35mm x 45mm." },
      { title: "Offer letter", detail: "From your university or college." },
      { title: "Health Declaration Form" },
      { title: "Academic certificates and transcripts" },
      { title: "English language certificate", detail: "MUET, IELTS, TOEFL iBT, PTE Academic and others. Without it, processing may be delayed." },
      { title: "Personal bond", detail: "Lodged with the institution, at a country-specific amount." },
    ],
    extra: [{ heading: "Fees listed on the EMGS calculator", md: "The EMGS fee calculator lists, in Malaysian ringgit: student pass 60, eVAL 159, medical screening 250 (standard), health insurance 498 to 644 depending on plan and age, and i-Kad 50 (self-collect). Application fees for a new private institution or a public university are 1,728 each. An 8% service tax applies to processing fees. Course fees are separate. Check the calculator for your own case." }],
    sources: [{ label: "EMGS — apply for a student visa", url: "https://visa.educationmalaysia.gov.my/" }, { label: "Required documents (EMGS)", url: "https://visa.educationmalaysia.gov.my/guidelines/required-documents" }, { label: "Fee calculator (EMGS)", url: "https://visa.educationmalaysia.gov.my/student-visa/calculate-application-fees" }],
  },
  "study-in-sri-lanka-from-pakistan": {
    photos: "LK", checked: CHECKED,
    overview: "Sri Lanka has no separate student visa page. Students are placed in Residence Visa Category 4, the Educational Category, run by the Department of Immigration and Emigration.",
    facts: { embassy_fee_text: "US$200 for a year or part of a year (residence visa for students)" },
    options: [
      { name: "University students", url: "https://www.immigration.gov.lk/pages_e.php?id=18", summary: "Needs a recommendation from the Ministry of Higher Education, a letter from the university and the passport bio page, plus the Health Protection Plan (HPP)." },
      { name: "Students at government-approved institutions", url: "https://www.immigration.gov.lk/pages_e.php?id=18", summary: "Needs a request letter from the institution, a DIE form, a recommendation from the relevant Embassy or High Commission, and bank encashment receipts worth US$1,500 for a year per person." },
    ],
    extra: [{ heading: "Validity", md: "A student residence visa is valid for one year, or the period recommended by the line Ministry or institution. It can be renewed. The Health Protection Plan has been required for residence visa applicants since 3 June 2019, with some exemptions." }],
    sources: [{ label: "Residence visa categories (Department of Immigration and Emigration)", url: "https://www.immigration.gov.lk/pages_e.php?id=18" }, { label: "Visa fees (Department of Immigration and Emigration)", url: "https://www.immigration.gov.lk/pages_e.php?id=45" }],
  },
  "study-in-netherlands-from-pakistan": {
    photos: "NL", checked: CHECKED,
    overview: "Students from outside the EU apply for a residence permit for study through the Dutch Immigration and Naturalisation Service (IND). The IND lists the requirements for each study programme on its study pages.",
    facts: { embassy_fee_text: "€254 for the study residence permit (first application or extension), IND", processing_time_text: "Not stated on the IND study page" },
    options: [
      { name: "Residence permit for study", url: "https://ind.nl/en/residence-permits/study", summary: "The requirements depend on the study programme. The IND study page links to each one." },
      { name: "Orientation year after study", url: "https://ind.nl/en/residence-permits/work/residence-permit-for-orientation-year", summary: "Valid for 1 year and cannot be extended. You may work freely. You need a qualifying degree or research from the last 3 years. The application costs €254 and the IND decides within 90 days." },
    ],
    extra: [{ heading: "Fees change every year", md: "The IND says fees change each year on 1 January. Check the IND fees page before you apply." }],
    sources: [{ label: "Study (IND)", url: "https://ind.nl/en/residence-permits/study" }, { label: "Fees (IND)", url: "https://ind.nl/en/fees-costs-of-an-application" }, { label: "Orientation year (IND)", url: "https://ind.nl/en/residence-permits/work/residence-permit-for-orientation-year" }],
  },
  "study-in-france-from-pakistan": {
    photos: "FR", checked: CHECKED,
    overview: "Campus France is the official agency for studying in France. Its Études en France procedure is the reference procedure for students from 75 listed countries, and it runs online from the enrolment request to the visa.",
    options: [
      { name: "Long-stay student visa (VLS-TS)", url: "https://www.campusfrance.org/en/the-different-types-of-visas", summary: "Valid as a residence permit for one year, validated on arrival. Applied for through France-Visas, with the papers handed in at the collection centre." },
      { name: "Short-stay student visa", url: "https://www.campusfrance.org/en/the-different-types-of-visas", summary: "For study of up to 3 months." },
      { name: "Études en France procedure", url: "https://www.campusfrance.org/en/application-higher-education-france", summary: "Online procedure for students from the listed countries. Check on Campus France whether Pakistan is on the current list of 75." },
    ],
    extra: [
      { heading: "Tuition fees 2026-2027 (Campus France)", md: "For EU, EEA and Swiss students: bachelor €178 a year, master €255, engineering €630, PhD €397. Non-EU students pay more: Campus France lists bachelor €2,902, master €3,950, and PhD €398 a year." },
      { heading: "Dates for 2027 entry", md: "The Campus France page shows these dates: DAP registrations 1 October to 15 December 2026; Parcoursup opens in December 2026; Mon Master applications run February to March 2027." },
    ],
    sources: [{ label: "Application for higher education (Campus France)", url: "https://www.campusfrance.org/en/application-higher-education-france" }, { label: "Types of visas (Campus France)", url: "https://www.campusfrance.org/en/the-different-types-of-visas" }, { label: "Tuition fees (Campus France)", url: "https://www.campusfrance.org/en/tuition-fees-France" }, { label: "France-Visas", url: "https://france-visas.gouv.fr/en/web/france-visas/" }],
  },
  "study-in-portugal-from-pakistan": {
    photos: "PT", checked: CHECKED,
    overview: "Students apply for a Portuguese national visa through the Ministry of Foreign Affairs visa portal. A higher-education student needs admission to a university and enough money to attend the programme.",
    facts: { embassy_fee_text: "€110 national visa processing fee (some groups are exempt)" },
    options: [
      { name: "Residence visa for higher education", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/residency", summary: "Needs admission to a university and enough financial resources. The visa is valid for two entries and four months, then you apply for a residence permit with AIMA." },
      { name: "Temporary stay visa for study under one year", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/temporary-stay", summary: "Needs a document of enrolment from the institution, plus a host family statement or proof of housing." },
    ],
    documents: [
      { title: "National visa application form", detail: "Completed and signed." },
      { title: "Two passport-type photos" },
      { title: "Passport", detail: "Valid 3 months after your estimated date of return, plus a photocopy." },
      { title: "Travel insurance", detail: "Covering medical expenses and repatriation." },
      { title: "Criminal record certificate", detail: "Apostilled or legalised." },
      { title: "Proof of financial resources" },
    ],
    extra: [{ heading: "Fee exemptions", md: "The €110 fee does not apply to children under 6 and to foreign nationals with a Portuguese study scholarship, among others. An appeal costs €75." }],
    sources: [{ label: "National visa fees (Portugal visa portal)", url: "https://vistos.mne.gov.pt/en/national-visas/general-information/fees" }, { label: "Residency visas (Portugal visa portal)", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/residency" }, { label: "Temporary stay visas (Portugal visa portal)", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/temporary-stay" }],
  },
  "study-in-uae-from-pakistan": {
    photos: "AE", checked: CHECKED,
    overview: "A student in the UAE holds a residence visa. The official UAE portal says a student can stay under the sponsorship of a parent who is a UAE resident, or under the sponsorship of the accredited university or college.",
    options: [{ name: "Student residence visa", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/Types-of-visas/residence-visa-for-studying-in-the-uae", summary: "Apply with a certificate from the university or institute that states the duration of the study. The ICP site has the online service." }],
    extra: [{ heading: "Family sponsors", md: "A son can be sponsored by a parent up to age 25. A male student over 25 can stay on a parent's sponsorship with proof of attending a higher education institute. A daughter can be sponsored whatever her age, until she marries." }],
    sources: [{ label: "Residence visa for studying (UAE government portal)", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/Types-of-visas/residence-visa-for-studying-in-the-uae" }, { label: "Apply for a student visa (ICP)", url: "https://icp.gov.ae/en/services-details/?serviceid=64afe3c1035448005bd52e60" }],
  },
};

const imm = (g: Omit<ImmigrationGuide, "checked">): ImmigrationGuide => ({ checked: CHECKED, ...g });

export const MORE_IMMIGRATION: ImmigrationGuide[] = [
  imm({
    slug: "immigrate-to-netherlands-from-pakistan", name: "Netherlands", code: "NL", flag: "nl", to: "AMS", photos: "NL",
    h1: "Immigrate to the Netherlands from Pakistan",
    metaTitle: "Netherlands Immigration from Pakistan: Highly Skilled Migrant | Visafeast",
    metaDescription: "Routes to live and work in the Netherlands, with the fee and decision time from the official IND site. Free eligibility check.",
    intro: "The Dutch Immigration and Naturalisation Service (IND) runs the work and study permits. Here are the main routes, with the fee and decision time shown on the official pages.",
    overview: "The Netherlands offers a highly skilled migrant permit for people with a job from a recognised sponsor, and an orientation year for recent graduates.",
    options: [
      { name: "Highly skilled migrant", url: "https://ind.nl/en/residence-permits/work/highly-skilled-migrant", summary: "You need an employment contract with a recognised sponsor and a salary that meets the income requirements. The application costs €423 and the IND decides within 90 days. The permit lasts as long as your contract, up to 5 years. You need an MVV entry visa." },
      { name: "Orientation year for highly educated persons", url: "https://ind.nl/en/residence-permits/work/residence-permit-for-orientation-year", summary: "A one-year permit to look for work after finishing a qualifying degree or research. It costs €254, the IND decides within 90 days, and you may work freely. It cannot be extended." },
    ],
    sources: [{ label: "Highly skilled migrant (IND)", url: "https://ind.nl/en/residence-permits/work/highly-skilled-migrant" }, { label: "Orientation year (IND)", url: "https://ind.nl/en/residence-permits/work/residence-permit-for-orientation-year" }, { label: "Fees (IND)", url: "https://ind.nl/en/fees-costs-of-an-application" }],
    extra: [{ heading: "Fees and processing times", md: `The IND changes fees each year on 1 January. ${VERIFY}` }],
  }),
  imm({
    slug: "immigrate-to-portugal-from-pakistan", name: "Portugal", code: "PT", flag: "pt", to: "LIS", photos: "PT",
    h1: "Immigrate to Portugal from Pakistan",
    metaTitle: "Portugal Immigration from Pakistan: Residence Visas | Visafeast",
    metaDescription: "Portugal's residence visa routes as listed on the official visa portal, including passive income and the job seeker visa status.",
    intro: "Portugal's Ministry of Foreign Affairs lists the national visas on its visa portal. Here is what the official pages say today.",
    overview: "Portugal groups national visas by purpose. A residence visa is valid for two entries and four months. You then apply for a residence permit with AIMA, the immigration agency.",
    options: [
      { name: "Residence visa: living from passive income", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/residency", summary: "Listed on the residency page. You need a document certifying revenue from movable and immovable property, or intellectual or financial assets. The page does not state a minimum amount." },
      { name: "Skilled job seeker visa", status: "Not available when we checked", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/job-seeker-visa", summary: "The portal labels it suspended and not yet available at Portuguese consular offices, pending regulation of Article 57-A of the Foreigners' Law." },
    ],
    sources: [{ label: "Residency visas (Portugal visa portal)", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/residency" }, { label: "Type of visa (Portugal visa portal)", url: "https://vistos.mne.gov.pt/en/national-visas/general-information/type-of-visa" }, { label: "Job seeker visa (Portugal visa portal)", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/job-seeker-visa" }],
    extra: [{ heading: "Fee", md: "The national visa processing fee is €110. Some groups are exempt. Residence permit requirements are set by AIMA, whose page we could not read, so we show none here." }],
  }),
  imm({
    slug: "immigrate-to-uae-from-pakistan", name: "United Arab Emirates", code: "AE", flag: "ae", to: "DXB", photos: "AE",
    h1: "Immigrate to the UAE from Pakistan",
    metaTitle: "UAE Golden Visa from Pakistan: Who Qualifies | Visafeast",
    metaDescription: "The UAE Golden Visa categories and requirements as listed on the official UAE government and ICA pages.",
    intro: "The UAE offers long-term Golden Visas without a sponsor. Here are the categories as written on the official pages.",
    overview: "The UAE Golden Visa is a long-term, renewable residence visa with no sponsor needed. The holder can stay outside the UAE for more than six months and can sponsor family.",
    options: [
      { name: "Investors and real estate", url: "https://icp.gov.ae/en/services/uae-golden-residency/", summary: "A deposit, capital or company share of AED 2 million, or a company paying at least AED 250,000 in federal taxes a year. For real estate, property worth at least AED 2 million. Health insurance is required." },
      { name: "Entrepreneurs", url: "https://icp.gov.ae/en/services/uae-golden-residency/", summary: "An SME with yearly revenue of at least AED 1 million, or a founder of a venture previously sold for at least AED 7 million." },
      { name: "Specialised professionals and talents", url: "https://icp.gov.ae/en/services/uae-golden-residency/", summary: "For specialised professionals: a valid UAE work permit, a bachelor's degree and a monthly salary of at least AED 30,000. Sport, culture and arts talents also qualify." },
      { name: "Outstanding students", url: "https://icp.gov.ae/en/services/uae-golden-residency/", summary: "A Grade 12 result of at least 95%, or a university GPA of 3.5 or more within two years of graduating, plus university-category rules." },
    ],
    sources: [{ label: "UAE Golden Residency (ICP)", url: "https://icp.gov.ae/en/services/uae-golden-residency/" }, { label: "Golden visa (UAE government portal)", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/golden-visa" }],
    extra: [{ heading: "Pages disagree on how long it lasts", md: "The ICP page says ten years with automatic renewal. The UAE government portal gives 5 years for some categories (entrepreneurs, real estate investors, high-school students) and 10 for others. Confirm the length for your category on the official site." }],
  }),
  imm({
    slug: "immigrate-to-malaysia-from-pakistan", name: "Malaysia", code: "MY", flag: "my", to: "KUL", photos: "MY",
    h1: "Live in Malaysia from Pakistan: Malaysia My Second Home",
    metaTitle: "Malaysia My Second Home (MM2H) from Pakistan | Visafeast",
    metaDescription: "Malaysia My Second Home (MM2H): who can apply, the deposit and the rules, as written on the official MM2H guidelines.",
    intro: "Malaysia My Second Home (MM2H) is Malaysia's long-stay programme. Here is what the official guidelines say.",
    overview: "MM2H is open to eligible foreign individuals from countries with diplomatic relations with Malaysia. Applications go through a licensed MM2H tour operator and the One Stop Centre. The Immigration Department gives the final approval.",
    options: [
      { name: "MM2H (Silver, Gold and Platinum)", url: "https://www.mm2h.gov.my/apply/guidelines", summary: "You must be 25 or older. You place a fixed deposit at a licensed Malaysian bank (you may withdraw up to 50% after approval for housing, education, medical or travel), pay a one-off participation fee, have a medical check-up and buy a residence. The deposit and fee amounts are shown only as images on the official page." },
      { name: "MM2H (SEZ and SFZ categories)", url: "https://www.mm2h.gov.my/apply/guidelines", summary: "The minimum age is 21." },
    ],
    sources: [{ label: "MM2H application guidelines", url: "https://www.mm2h.gov.my/apply/guidelines" }, { label: "Malaysia My Second Home", url: "https://www.mm2h.gov.my/" }],
    extra: [{ heading: "Other rules", md: "Participants under 50 must be in Malaysia 90 days a year in total. A residence bought for the programme cannot be sold for 10 years unless upgraded. Renewal is every five years, with a fixed pass fee of RM500 a year. Dependants can include a spouse, children under 21, and parents. The pages do not mention Pakistan by name. The official guidelines page was last updated 10 February 2026." }],
  }),
  imm({
    slug: "immigrate-to-sri-lanka-from-pakistan", name: "Sri Lanka", code: "LK", flag: "lk", to: "CMB", photos: "LK",
    h1: "Live in Sri Lanka from Pakistan: Residence Visas",
    metaTitle: "Sri Lanka Residence Visas from Pakistan | Visafeast",
    metaDescription: "Sri Lanka's residence visa categories (investor, employment, education, digital nomad) from the official Department of Immigration pages.",
    intro: "Sri Lanka's Department of Immigration and Emigration lists the residence visa categories. Here are the main ones.",
    overview: "Residence visas are normally valid for one year and renewed each year. Applicants for a residence visa generally need the Health Protection Plan (HPP), with some exemptions.",
    options: [
      { name: "Resident Guest Scheme: investor and professional", url: "https://www.immigration.gov.lk/pages_e.php?id=20", summary: "Valid up to five years. Investor category: a minimum remittance of US$250,000 for the applicant and US$35,000 for each dependant. Professional category: US$2,000 a month for the applicant and US$1,000 a month for each dependant. The fee is US$200 per person per year. The page says it is extension only for existing holders." },
      { name: "Digital Nomad residence visa", url: "https://www.immigration.gov.lk/pages_e.php?id=45", summary: "The fee table lists US$500. We could not read the category rules." },
      { name: "Other categories", url: "https://www.immigration.gov.lk/pages_e.php?id=18", summary: "Employment, Investor, Educational, Spouse of a Sri Lankan, Medical, Port City and others are listed by the Department." },
    ],
    sources: [{ label: "Residence visa categories", url: "https://www.immigration.gov.lk/pages_e.php?id=18" }, { label: "Resident Guest Scheme", url: "https://www.immigration.gov.lk/pages_e.php?id=20" }, { label: "Visa fees", url: "https://www.immigration.gov.lk/pages_e.php?id=45" }],
    extra: [{ heading: "Check first", md: `Rules and fees change. ${VERIFY}` }],
  }),
  imm({
    slug: "immigrate-to-france-from-pakistan", name: "France", code: "FR", flag: "fr", to: "CDG", photos: "FR",
    h1: "Immigrate to France from Pakistan",
    metaTitle: "France Immigration from Pakistan: Talent Passport and Visas | Visafeast",
    metaDescription: "France's long-stay visa and Talent residence permit categories as listed on official French government pages.",
    intro: "France-Visas and Service-Public are the official French sites. Here are the main routes they list.",
    overview: "Stays longer than 90 days use a long-stay visa. The fee for a long-stay visa is €99 on France-Visas. A residence permit is then issued in France.",
    options: [
      { name: "Talent residence permit", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/N110", summary: "The Service-Public site lists the Talent permit and its forms for an innovative company, the European Blue Card, an employee on assignment, and artistic and cultural professions. We could not read the conditions for each." },
      { name: "Long-stay visa (VLS-TS) for study", url: "https://www.campusfrance.org/en/the-different-types-of-visas", summary: "Valid as a residence permit for one year. It has student, Talent passport (doctorate and beyond) and internship subtypes." },
      { name: "Working holiday visa", url: "https://www.campusfrance.org/en/the-different-types-of-visas", summary: "Listed by Campus France for ages 18 to 30. Check whether Pakistan is covered by a working holiday agreement." },
    ],
    sources: [{ label: "Residence permits (Service-Public)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/N110" }, { label: "France-Visas FAQ", url: "https://france-visas.gouv.fr/en/web/france-visas/faq" }, { label: "Types of visas (Campus France)", url: "https://www.campusfrance.org/en/the-different-types-of-visas" }],
  }),
];
