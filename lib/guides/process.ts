// STAFF-ONLY step-by-step guides for the admin panel (Admin → Useful links). They are NOT shown to visitors: the chat assistant invites an enquiry
// instead of giving a step-by-step plan, so every client case goes through a Visafeast representative.
// Every step and link comes from the official page it points to (read 12–13 November 2026; Australia 5 November 2026).
// Where a page did not describe a step, it is not here: the step says "follow the official page" and links to it.

export type Who = "Visafeast" | "Client" | "Employer" | "Official";
export interface StepLink { label: string; url: string; /** The page where the application is actually made or started. */ apply?: boolean }
export interface ProcessStep { title: string; detail: string; who: Who; links: StepLink[] }
export interface Process { /** slug of the Work permit guide in lib/guides/work.ts */ slug: string; checked: string; steps: ProcessStep[] }

const START: ProcessStep = {
  title: "Check the client and the job offer",
  who: "Visafeast",
  detail: "Open the client's file. Collect a passport copy, CV, degrees, proof of work experience and any English or language test result. Confirm the job offer and the employer are real before any money is spent: never take or ask for money for a job offer.",
  links: [],
};

const UK = "https://www.gov.uk/skilled-worker-visa";

export const PROCESSES: Process[] = [
  {
    slug: "uk-work-visa-from-pakistan", checked: "2026-11-13",
    steps: [
      START,
      { title: "Get a job offer and a certificate of sponsorship", who: "Employer", detail: "Skilled Worker: a Home Office-approved employer gives the job offer and a certificate of sponsorship (CoS). The client cannot apply without both. Global Talent is different: no job offer, but an endorsement or an eligible prize.", links: [{ label: "Skilled Worker visa (GOV.UK)", url: UK }, { label: "Global Talent visa (GOV.UK)", url: "https://www.gov.uk/global-talent" }] },
      { title: "Check the job and the salary", who: "Visafeast", detail: "The job must be an eligible occupation. Minimum pay: £41,700 a year or the going rate for the job, whichever is higher (£33,400 for some roles that can be paid less).", links: [{ label: "Your job (Skilled Worker)", url: `${UK}/your-job` }] },
      { title: "Prove English", who: "Client", detail: "Usually English at B2 on the CEFR scale, with an approved test. Pakistan is not on GOV.UK's list of nationalities that are exempt.", links: [{ label: "Knowledge of English", url: `${UK}/knowledge-of-english` }] },
      { title: "Check the money", who: "Client", detail: "Visa fee from outside the UK: £819 for up to 3 years, £1,618 for more than 3 years. Healthcare surcharge £1,035 per year. At least £1,270 in savings held for 28 days in a row (unless exempt).", links: [{ label: "How much it costs", url: `${UK}/how-much-it-costs` }] },
      { title: "Apply online from outside the UK", who: "Visafeast", detail: "Follow the official page for the application. A decision usually comes within 3 weeks. Partner and children can apply as dependants.", links: [{ label: "Apply from outside the UK", url: `${UK}/apply-from-outside-the-uk`, apply: true }] },
      { title: "Other UK work routes", who: "Visafeast", detail: "Health and Care Worker: £324 (up to 3 years) or £628, no healthcare surcharge. Global Talent: £561 endorsement then £205 visa. Scale-up Worker: £937, salary at least £39,100. Seasonal Worker: £340, poultry applications by 15 November each year.", links: [{ label: "Health and Care Worker", url: "https://www.gov.uk/health-care-worker-visa", apply: true }, { label: "Scale-up Worker", url: "https://www.gov.uk/scale-up-worker-visa", apply: true }, { label: "Seasonal Worker", url: "https://www.gov.uk/seasonal-worker-visa", apply: true }, { label: "Global Talent", url: "https://www.gov.uk/global-talent", apply: true }] },
    ],
  },
  {
    slug: "canada-work-permit-from-pakistan", checked: "2026-11-13",
    steps: [
      START,
      { title: "Find out which permit the client needs", who: "Visafeast", detail: "Employer-specific permit (most common, needs a job offer, and the employer may need an LMIA) or an open work permit (only in certain situations, no job offer).", links: [{ label: "Do you need a work permit?", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary/need-permit.html" }, { label: "Work permit eligibility", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary/eligibility.html" }] },
      { title: "The employer applies for an LMIA (if needed)", who: "Employer", detail: "The Canadian employer applies through LMIA Online (it needs a Job Bank for Employers account). A positive LMIA is valid for up to 6 months. Global Talent Stream is for firms hiring highly skilled people; LMIA decision 10 business days, 80% of the time.", links: [{ label: "Hire a temporary foreign worker (LMIA)", url: "https://www.canada.ca/en/employment-social-development/services/foreign-workers.html" }, { label: "Global Talent Stream", url: "https://www.canada.ca/en/employment-social-development/services/foreign-workers/global-talent.html" }] },
      { title: "Employer sends the LMIA letter and contract", who: "Employer", detail: "After a positive LMIA the employer sends the client the LMIA letter and the signed contract, and asks the client to apply to IRCC for the work permit.", links: [{ label: "Global Talent Stream (what happens after a positive LMIA)", url: "https://www.canada.ca/en/employment-social-development/services/foreign-workers/global-talent.html" }] },
      { title: "Apply to IRCC from outside Canada", who: "Visafeast", detail: "Apply for the work permit through IRCC. The eligibility page links to the 'Apply from outside Canada' page.", links: [{ label: "Apply from outside Canada (linked from the IRCC eligibility page)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit-outside.html", apply: true }] },
      { title: "Pay the fees", who: "Client", detail: "Work permit CAD 155. Open work permit holder fee CAD 100. Biometrics CAD 85 per person, CAD 170 maximum per family. Biometrics apply to citizens of certain countries: check the official list for Pakistan.", links: [{ label: "IRCC fee list", url: "https://ircc.canada.ca/english/information/fees/fees.asp" }] },
    ],
  },
  {
    slug: "germany-work-visa-from-pakistan", checked: "2026-11-13",
    steps: [
      START,
      { title: "Choose the route", who: "Visafeast", detail: "Opportunity Card (job seeker), EU Blue Card, skilled worker with a university degree, with vocational training, or with practical experience (two years in the last five). Each embassy page lists the requirements.", links: [{ label: "Opportunity Card", url: "https://pakistan.diplo.de/pk-en/service/2632954-2632954" }, { label: "EU Blue Card", url: "https://pakistan.diplo.de/pk-en/service/2593356-2593356" }, { label: "Skilled worker, university degree", url: "https://pakistan.diplo.de/pk-en/service/2595682-2595682" }, { label: "Skilled worker, vocational qualification", url: "https://pakistan.diplo.de/pk-en/service/2593478-2593478" }, { label: "All work and job seeker categories", url: "https://pakistan.diplo.de/pk-en/service/4-work-jobseeker-1676106" }] },
      { title: "Get the qualification recognised", who: "Client", detail: "The degree must be recognised in Germany (anabin database or a Statement of Comparability); a vocational qualification must be recognised by the competent German authority. Opportunity Card points route: at least 6 points (see the law).", links: [{ label: "Residence Act, English translation (Sections 20a and 20b)", url: "https://www.gesetze-im-internet.de/englisch_aufenthg/englisch_aufenthg.html" }] },
      { title: "Get the job contract (not needed for the Opportunity Card)", who: "Employer", detail: "Blue Card and skilled worker routes need a valid job contract with a German company. Blue Card (2025 limits on the embassy page): at least €48,300 a year, or €43,759.80 for new graduates or shortage jobs such as IT. Contract at least 6 months.", links: [{ label: "EU Blue Card (BAMF)", url: "https://www.bamf.de/EN/Themen/MigrationAufenthalt/ZuwandererDrittstaaten/Migrathek/BlaueKarteEU/blauekarteeu-node.html" }] },
      { title: "Show the money (Opportunity Card)", who: "Client", detail: "Karachi Consulate General lists €1,027 per month for living costs and €500 for the return ticket.", links: [{ label: "Opportunity Card checklist page (Karachi)", url: "https://pakistan.diplo.de/pk-en/service/2632954-2632954" }] },
      { title: "Apply online in the Consular Services Portal", who: "Visafeast", detail: "Islamabad applicants use the Federal Foreign Office portal. Applicants from Sindh and Balochistan apply through the Consulate General in Karachi.", links: [{ label: "Consular Services Portal (Federal Foreign Office)", url: "https://www.auswaertiges-amt.de/en/visa-service/consular-services-portal", apply: true }, { label: "Employment visa portal (Karachi, Sindh and Balochistan)", url: "https://digital.diplo.de/visa-ewt", apply: true }] },
      { title: "Go in person: fingerprints, fee, originals", who: "Client", detail: "An in-person appointment is still needed to give biometrics, pay the fee and show original documents. Fee €75 (long-term visa), paid in cash in PKR at the current exchange rate, at the Embassy or the Consulate General.", links: [{ label: "Visa fees and processing (Embassy Islamabad)", url: "https://pakistan.diplo.de/pk-en/service/2208622-2208622" }] },
      { title: "Faster processing with a pre-approval", who: "Employer", detail: "If the employer obtained a Section 81a pre-approval letter not older than three months, the client registers on the embassy's priority list and on the portal. Processing times for national visas vary widely.", links: [{ label: "Employment, training and jobseeker visas", url: "https://pakistan.diplo.de/pk-en/service/4-work-jobseeker-1676106" }] },
    ],
  },
  {
    slug: "new-zealand-work-visa-from-pakistan", checked: "2026-11-13",
    steps: [
      START,
      { title: "Get a job offer from an accredited employer", who: "Employer", detail: "Full-time (at least 30 hours a week), approved job check, paid at least the wage rate. The employer then sends the client a link to the online application. No one may charge the client a fee for a job offer: Immigration New Zealand warns that job offer scams are common in South Asia.", links: [{ label: "Accredited Employer Work Visa", url: "https://www.immigration.govt.nz/visas/accredited-employer-work-visa/" }] },
      { title: "Prepare the proof", who: "Client", detail: "2 years or more of relevant experience, or a qualification at level 4 or higher (a Bachelor's or higher can be in any field). Proof must come from someone other than the client (employment certificates, payslips, tax certificates). Qualifications below a Bachelor's from outside NZ need an NZQA assessment. English for skill level 3 to 5 jobs.", links: [{ label: "Accredited Employer Work Visa", url: "https://www.immigration.govt.nz/visas/accredited-employer-work-visa/" }] },
      { title: "Health and character", who: "Client", detail: "Police certificates less than 6 months old (age 17 or older, stay of 24 months or longer). Chest X-ray for stays over 6 months for people from countries without a low rate of tuberculosis.", links: [] },
      { title: "Submit the application", who: "Visafeast", detail: "Cost from NZD 1,540; 80% decided within 5 weeks; up to 5 years (3 years for skill level 4 or 5 jobs). Partner and children are not in the same application. Planned system upgrade on 15 and 16 November 2026 stops some applications.", links: [{ label: "Accredited Employer Work Visa", url: "https://www.immigration.govt.nz/visas/accredited-employer-work-visa/", apply: true }, { label: "Specific Purpose Work Visa (NZD 1,455; 80% within 2.5 weeks)", url: "https://www.immigration.govt.nz/visas/specific-purpose-work-visa/", apply: true }] },
    ],
  },
  {
    slug: "ireland-work-permit-from-pakistan", checked: "2026-11-13",
    steps: [
      START,
      { title: "Pick the permit", who: "Visafeast", detail: "Critical Skills (listed occupations; job offer of at least 2 years; pay at least €40,904, or €68,911 for other eligible occupations) or General Employment Permit (pay generally at least €36,605; Labour Market Needs Test in most cases).", links: [{ label: "Critical Skills Employment Permit", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/permit-types/critical-skills-employment-permit/" }, { label: "General Employment Permit", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/permit-types/general-employment-permit/" }] },
      { title: "Get the job offer", who: "Employer", detail: "Either the worker or the employer can apply, and the permit is issued to the worker. Check the job is not on the Ineligible List.", links: [{ label: "General Employment Permit", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/permit-types/general-employment-permit/" }] },
      { title: "Apply at least 12 weeks before the start date", who: "Visafeast", detail: "Fee: Critical Skills €1,000 (90% refunded if refused). General: €500 (6 months or less), €1,000 (6 to 24 months). Applications are processed in date order. The pages refer to the Irish Embassy for an entry visa where one is required.", links: [{ label: "Critical Skills Employment Permit", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/permit-types/critical-skills-employment-permit/", apply: true }, { label: "General Employment Permit", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/permit-types/general-employment-permit/", apply: true }] },
    ],
  },
  {
    slug: "netherlands-work-permit-from-pakistan", checked: "2026-11-13",
    steps: [
      START,
      { title: "The employer must be recognised by the IND", who: "Employer", detail: "Highly skilled migrant: only an IND-recognised employer can apply, for the entry visa (MVV) and the residence permit together. EU Blue Card: the employer or the employee can apply and the employer need not be recognised.", links: [{ label: "Highly skilled migrant (IND)", url: "https://ind.nl/en/residence-permits/work/highly-skilled-migrant" }, { label: "European Blue Card (IND)", url: "https://ind.nl/en/residence-permits/work/european-blue-card-residence-permit" }] },
      { title: "Check the salary (2026, gross per month)", who: "Visafeast", detail: "Highly skilled migrant: €5,942 if 30 or older, €4,357 if under 30, €3,122 reduced criterion for recent graduates. Blue Card: €5,942 (reduced criterion €4,754). The amounts change every 1 January.", links: [{ label: "Required amounts and income requirements", url: "https://ind.nl/en/required-amounts-income-requirements" }] },
      { title: "The employer files and pays", who: "Employer", detail: "Fee €423, paid by the employer. The IND must decide within 90 days (Blue Card: 30 days with a recognised sponsor, otherwise up to 90).", links: [{ label: "Highly skilled migrant (IND)", url: "https://ind.nl/en/residence-permits/work/highly-skilled-migrant", apply: true }] },
      { title: "Collect the entry visa (MVV) abroad", who: "Client", detail: "The MVV is collected at the Dutch representation abroad and is valid for 90 days.", links: [{ label: "Highly skilled migrant (IND)", url: "https://ind.nl/en/residence-permits/work/highly-skilled-migrant" }] },
    ],
  },
  {
    slug: "portugal-work-visa-from-pakistan", checked: "2026-11-13",
    steps: [
      START,
      { title: "Choose the visa", who: "Visafeast", detail: "Residence visa for subordinate (employed) work, or for highly qualified work (contract or work promise of at least six months; salary at least 1.5 times the average annual gross salary or three times the IAS). The Skilled Job Seeker visa was not yet available.", links: [{ label: "Type of visa", url: "https://vistos.mne.gov.pt/en/national-visas/general-information/type-of-visa" }, { label: "Residency visas: documents", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/residency" }, { label: "Skilled Job Seeker visa status", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/job-seeker-visa" }] },
      { title: "Collect the documents", who: "Client", detail: "Work contract, work promise or demonstration of interest, plus a professional certificate if the profession is regulated in Portugal.", links: [{ label: "Residency visas: documents", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/residency" }] },
      { title: "Apply for the national visa and pay", who: "Visafeast", detail: "National visa fee €110.", links: [{ label: "Fees", url: "https://vistos.mne.gov.pt/en/national-visas/general-information/fees" }, { label: "Portugal visa portal", url: "https://vistos.mne.gov.pt/", apply: true }] },
      { title: "After arrival: residence permit with AIMA", who: "Client", detail: "The residence visa is valid for two entries and four months. In that time the client applies for the residence permit with AIMA, Portugal's migration agency.", links: [{ label: "Residency visas: documents", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/residency" }] },
    ],
  },
  {
    slug: "uae-work-visa-from-pakistan", checked: "2026-11-13",
    steps: [
      START,
      { title: "The employer applies for the work visa", who: "Employer", detail: "The employer must apply for the standard work (employment) visa: valid for two years and renewable. The portal lists the federal ICP service and, for Dubai, GDRFA services.", links: [{ label: "Work visa (UAE government portal)", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/residence-visa-for-working-in-the-uae", apply: true }] },
      { title: "Green visa (self-sponsored, 5 years)", who: "Visafeast", detail: "For skilled workers, freelancers and self-employed people, and investors. Renewable, no sponsor, can sponsor spouse and children. The detailed rules are set by ICP.", links: [{ label: "Green visa (UAE government portal)", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/Types-of-visas/Investor-visa/Green-visa" }, { label: "Green residency (ICP, cited by the portal)", url: "https://icp.gov.ae/en/green-residency/", apply: true }] },
    ],
  },
  {
    slug: "japan-work-visa-from-pakistan", checked: "2026-11-13",
    steps: [
      START,
      { title: "Choose the SSW field", who: "Visafeast", detail: "SSW (i): 19 fields, up to 5 years in total, no family. SSW (ii): 11 fields, no upper limit, family can come. The food service field was not accepting new applications.", links: [{ label: "SSW visa: fields and length", url: "https://www.ssw.go.jp/en/about/visa/" }] },
      { title: "Pass the tests", who: "Client", detail: "SSW (i) needs two tests: a Japanese language test and a skills test for the field. Not needed after satisfactory Technical Intern Training (ii).", links: [{ label: "SSW tests", url: "https://www.ssw.go.jp/en/about/sswv/" }, { label: "SSW exam details", url: "https://www.ssw.go.jp/en/about/sswv/exam/" }] },
      { title: "Japanese employer sends details to the Pakistani embassy in Japan", who: "Employer", detail: "The employer submits job and employer information to the Embassy of Pakistan in Japan for approval (about two days). Using a certified sending organisation is optional.", links: [{ label: "Cooperation on SSW: Pakistan (Immigration Services Agency of Japan)", url: "https://www.moj.go.jp/isa/applications/ssw/nyuukokukanri05_00021.html" }] },
      { title: "Register with the Protector of Emigrants", who: "Client", detail: "Before working abroad, the worker must register with the BE&OE Protector of Emigrants office. The Japanese page links the active certified sending organisations.", links: [{ label: "Active certified sending organisations (BE&OE, linked from the Japanese page)", url: "https://beoe.gov.pk/list-of-oeps?show=active" }] },
      { title: "Apply for the visa", who: "Visafeast", detail: "Follow the SSW portal for the application steps. Check the Immigration Services Agency notices for the B1 Japanese check and JFT-Basic changes (September and October 2026).", links: [{ label: "SSW portal", url: "https://www.ssw.go.jp/en/", apply: true }, { label: "Immigration Services Agency: SSW", url: "https://www.moj.go.jp/isa/applications/ssw/index.html" }] },
    ],
  },
  {
    slug: "usa-work-visa-from-pakistan", checked: "2026-11-13",
    steps: [
      START,
      { title: "Employer gets the Labor Condition Application certified", who: "Employer", detail: "H-1B is for a specialty occupation needing a US bachelor's degree or higher in a related field. The employer obtains DOL certification of an LCA.", links: [{ label: "H-1B specialty occupations (USCIS)", url: "https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations" }] },
      { title: "Employer registers (typically in March)", who: "Employer", detail: "Annual cap of 65,000 plus 20,000 for a US master's or higher. A cap petition must be based on a selected registration, with a start date of 1 October or later.", links: [{ label: "H-1B specialty occupations (USCIS)", url: "https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations" }] },
      { title: "Employer files Form I-129", who: "Employer", detail: "Check the USCIS page for the $100,000 payment: a court set aside the guidance on 8 June 2026 and the appeals court refused to pause it on 24 July 2026. An additional 9-11 Response and Biometric Entry-Exit Fee applies to some employers from 9 September 2026 (Form G-1055).", links: [{ label: "H-1B specialty occupations (USCIS)", url: "https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations", apply: true }] },
      { title: "Client applies for the visa abroad", who: "Visafeast", detail: "Initial admission up to 3 years, extendable to 6. Spouse and children under 21 may seek H-4 status.", links: [{ label: "Visas (US Embassy and Consulates in Pakistan)", url: "https://pk.usembassy.gov/visas/", apply: true }] },
    ],
  },
  {
    slug: "france-work-visa-from-pakistan", checked: "2026-11-13",
    steps: [
      START,
      { title: "Choose the card", who: "Visafeast", detail: "Talent card for a qualified employee (master's level diploma, contract over 3 months, pay at least €39,582 a year), EU Blue Card (pay at least €59,373 a year, contract at least 6 months), or the employee / temporary worker card. A decree of 26 October 2026 changes several rules from 30 October 2026: check the current page.", links: [{ label: "Talent card (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F16922" }, { label: "Employee and temporary worker card", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F15898" }] },
      { title: "Employer's work authorisation (employee and temporary worker cards)", who: "Employer", detail: "The French employer files the work authorisation online before the client enters France. Talent card holders do not need one.", links: [{ label: "Work authorisation for a foreign worker", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F2728" }] },
      { title: "Apply for the long-stay visa", who: "Visafeast", detail: "Employee card: after the authorisation is granted, apply online for the long-stay visa (VLS-TS). Talent card: stays under 12 months get a long-stay visa that counts as a residence permit; stays of a year or more get a 3-month visa and the card is requested after arrival. The visa fee was not on a page we could read: check France-Visas.", links: [{ label: "France-Visas", url: "https://france-visas.gouv.fr/", apply: true }] },
      { title: "After arrival", who: "Client", detail: "Validate the visa online within 3 months (€300 tax). Card cost €350 (€300 tax + €50 stamp); renewal €250. Silence from the prefecture for 4 months (90 days for the Blue Card) counts as a refusal.", links: [{ label: "Employee and temporary worker card", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F15898" }] },
    ],
  },
  {
    slug: "australia-work-visa-from-pakistan", checked: "2026-11-05",
    steps: [
      START,
      { title: "Pick the visa", who: "Visafeast", detail: "Skills in Demand (482): an approved sponsor and a nomination, Core Skills and Specialist Skills streams. Employer Nomination Scheme (186): permanent, nominated by the employer. Skilled Work Regional (491): nominated by a state or territory (or an eligible relative). Prices are the 'from' prices shown on each page on 5 November 2026; Home Affairs blocked our reader afterwards, so re-check.", links: [{ label: "Skills in Demand 482", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482" }, { label: "Employer Nomination Scheme 186", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/employer-nomination-scheme-186" }, { label: "Skilled Work Regional 491", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491" }] },
      { title: "The employer sponsors and nominates", who: "Employer", detail: "482 and 186 need an Australian employer who sponsors or nominates the client for a position they cannot fill locally.", links: [{ label: "Skills in Demand 482", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482" }] },
      { title: "Apply on the official page", who: "Visafeast", detail: "Open the visa page in a normal browser and follow the 'apply' steps there. Health and character requirements apply.", links: [{ label: "Skills in Demand 482", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482", apply: true }, { label: "Employer Nomination Scheme 186", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/employer-nomination-scheme-186", apply: true }, { label: "Skilled Work Regional 491", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491", apply: true }] },
    ],
  },
  {
    slug: "south-korea-work-visa-from-pakistan", checked: "2026-11-13",
    steps: [
      START,
      { title: "Confirm Pakistan's EPS intake is open", who: "Visafeast", detail: "The Korean pages we could read do not say whether Pakistan is a sending country now, or give test dates and fees. Confirm before the client spends any money.", links: [{ label: "Employment Permit System (Ministry of Employment and Labor)", url: "https://www.moel.go.kr/english/policy/international.do" }] },
      { title: "Korean language test and job seekers' roster", who: "Client", detail: "Step 1 of the Ministry's process: a Korean language test and a job seekers' roster, managed between the sending country and HRD Korea.", links: [{ label: "Employment Permit System", url: "https://www.moel.go.kr/english/policy/international.do" }] },
      { title: "Employer gets the employment permit and signs the contract", who: "Employer", detail: "The employment permit is issued to the employer (MOEL), then the employer and the worker sign a labour contract.", links: [{ label: "Employment Permit System", url: "https://www.moel.go.kr/english/policy/international.do" }] },
      { title: "Visa and entry (E-9)", who: "Visafeast", detail: "Visa issue and entry are handled by the Ministry of Justice. E-9 sectors: manufacturing, construction, agriculture, fishery, service, forestry, mining.", links: [{ label: "Visa categories (Korea Visa Portal)", url: "https://www.visa.go.kr/openPage.do?MENU_ID=10102&LANG_TYPE=EN", apply: true }] },
      { title: "Employment education and workplace", who: "Client", detail: "After arrival: employment education, then assignment to the workplace. Workers may change workplace up to 3 times in the first 3 years.", links: [{ label: "Employment Permit System", url: "https://www.moel.go.kr/english/policy/international.do" }] },
    ],
  },
  {
    slug: "saudi-arabia-work-visa-from-pakistan", checked: "2026-11-12",
    steps: [
      START,
      { title: "The employer pays the work visa authorisation", who: "Employer", detail: "On the Ministry of Foreign Affairs visa platform (in Arabic), employers pay the authorisation fees for work visas for domestic and professional workers, so the document is sent to the Saudi mission.", links: [{ label: "Business and entities services (visa.mofa.gov.sa)", url: "https://visa.mofa.gov.sa/Home/Index2?service_type=3", apply: true }] },
      { title: "Recruitment office authorisation", who: "Employer", detail: "The employer can authorise a recruitment office to visit the Saudi mission and use the employer's work visas.", links: [{ label: "Business and entities services (visa.mofa.gov.sa)", url: "https://visa.mofa.gov.sa/Home/Index2?service_type=3" }] },
      { title: "Pay for the health certificate", who: "Client", detail: "Applicants for a work or residence visa pay the health certificate costs through the platform.", links: [{ label: "Visa platform (visa.mofa.gov.sa)", url: "https://visa.mofa.gov.sa/", apply: true }] },
      { title: "Other steps: check with the consultant in charge", who: "Visafeast", detail: "The Saudi pages we could read do not give the rest of the process, salary levels or fees. Do not promise any figure to a client.", links: [] },
    ],
  },
];

export const processFor = (slug: string) => PROCESSES.find((p) => p.slug === slug);
