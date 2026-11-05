import type { ImmigrationGuide } from "./types";
import { MORE_IMMIGRATION } from "./more";

const CHECKED = "2026-11-05";
const VERIFY_FEES = "Fees and processing times change. Always check the official page before you apply.";

/** One country page each. Programme names match the owner's brief (§6.8); the wording is written from the official page linked on each programme. */
export const IMMIGRATION_GUIDES: ImmigrationGuide[] = [
  {
    slug: "immigrate-to-canada-from-pakistan", name: "Canada", code: "CA", flag: "ca", to: "YYZ", photos: "CA", checked: CHECKED,
    h1: "Immigrate to Canada from Pakistan",
    metaTitle: "Canada Immigration from Pakistan: Express Entry, PNP and Family | Visafeast",
    metaDescription: "The main ways to move to Canada permanently, with what each programme is for and its status on the official IRCC site. Free eligibility check.",
    intro: "Canada has several routes to permanent residence. Here are the main ones, in plain words, with the status shown on the official Canada.ca pages.",
    overview: "Canada's government runs separate programmes for skilled workers, provincial nominees, Atlantic Canada, entrepreneurs and family. Some are paused or closed to new applicants at times, so each programme below shows what the official page says today.",
    options: [
      { name: "Express Entry", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html", summary: "An online system Canada uses to manage applications from skilled workers. It covers three programmes: Federal Skilled Worker, Canadian Experience Class and Federal Skilled Trades. You create a profile, Canada invites the candidates with the most points in rounds, and if you are invited you fill out the full application." },
      { name: "Provincial Nominee Programs (PNP)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html", summary: "Provinces and territories nominate people who have the skills, education and work experience to help their economy, who want to live there and want to become permanent residents. Each province sets its own requirements and how many people it nominates. Quebec and Nunavut do not run one." },
      { name: "Atlantic Immigration Program", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/atlantic-immigration.html", summary: "A route to permanent residence for skilled workers and international graduates of a recognised institution in Atlantic Canada who want to live in one of the four Atlantic provinces. You need a job offer from a designated employer, and you can be abroad or in Canada as a temporary resident." },
      { name: "Start-up Visa", status: "Paused", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/start-visa.html", summary: "For immigrant entrepreneurs whose businesses are innovative, can create jobs and can compete globally. The official page shows this programme as paused: it accepted only applicants with a valid 2025 commitment certificate who applied by 30 June 2026." },
      { name: "Spouse and family sponsorship", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/family-sponsorship.html", summary: "Canadian citizens and permanent residents may sponsor a spouse, partner, dependent children, an adopted child or certain relatives to become permanent residents. Sponsoring parents and grandparents is shown as paused on the official page." },
    ],
    sources: [
      { label: "Express Entry (Canada.ca)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html" },
      { label: "Provincial Nominee Programs (Canada.ca)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html" },
      { label: "Atlantic Immigration Program (Canada.ca)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/atlantic-immigration.html" },
      { label: "Start-up Visa Program (Canada.ca)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/start-visa.html" },
      { label: "Family sponsorship (Canada.ca)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/family-sponsorship.html" },
    ],
    extra: [{ heading: "Fees and processing times", md: `Canada publishes each fee and processing time on its own pages and updates them often. ${VERIFY_FEES}` }],
  },
  {
    slug: "immigrate-to-australia-from-pakistan", name: "Australia", code: "AU", flag: "au", to: "SYD", photos: "AU", checked: CHECKED,
    h1: "Immigrate to Australia from Pakistan",
    metaTitle: "Australia Immigration from Pakistan: Skilled, Employer and Partner Visas | Visafeast",
    metaDescription: "The main Australian skilled, employer-sponsored and partner visas, explained simply with costs and rules as shown by the Department of Home Affairs.",
    intro: "Australia has permanent and temporary visas for skilled workers, employer-sponsored workers and partners. Here are the main ones, as described on the Home Affairs website.",
    overview: "Home Affairs processes skilled visas in a priority order set by Ministerial Directions, so published timeframes can change. Where a cost is given below, it is the \"from\" price shown on the official page.",
    options: [
      { name: "Skilled Independent visa (subclass 189)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189", summary: "A permanent visa for invited skilled workers. In the points-tested stream you do not need a sponsor or nominator, you must be invited to apply, and you must be under 45 to be invited. Cost: from AUD 6,135." },
      { name: "Skilled Nominated visa (subclass 190)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190", summary: "A permanent visa that lets nominated skilled workers live and work in Australia. Cost: from AUD 6,140." },
      { name: "Skilled Work Regional (Provisional) visa (subclass 491)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491", summary: "A temporary visa for skilled people who want to live and work in regional Australia. You must be nominated by a state or territory government (or sponsored by an eligible relative), have an occupation on the relevant list, have a suitable skills assessment, be invited, and meet the points test. You can stay for 5 years." },
      { name: "Employer Nomination Scheme (subclass 186)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/employer-nomination-scheme-186", summary: "A permanent visa for skilled workers nominated by their employer. You need the skills for the job and must meet health and character requirements. In the Direct Entry stream an Australian employer nominates you, your occupation must be on the eligible list, and you need at least Competent English." },
      { name: "Skills in Demand visa (subclass 482)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482", summary: "A temporary visa that lets an employer sponsor a suitably skilled worker for a position they cannot fill locally. You need an approved sponsor and a nomination. It has a Core Skills stream and a Specialist Skills stream." },
      { name: "National Innovation visa (subclass 858)", url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/visas-for-innovation/national-innovation-visa", summary: "For established and emerging leaders with an internationally recognised record of exceptional and outstanding achievement, who can make significant contributions that will benefit Australia's future prosperity. The first step is an expression of interest." },
      { name: "Partner visas", url: "https://immi.homeaffairs.gov.au/what-we-do/family-migration-program/visa-options/about-partner-visas", summary: "Visa options for spouses and de facto partners of Australian citizens, permanent residents and eligible New Zealand citizens, including the Prospective Marriage visa (subclass 300) to come to Australia to marry, then a Partner visa." },
    ],
    sources: [
      { label: "Skilled Independent 189 (Home Affairs)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189" },
      { label: "Skilled Nominated 190 (Home Affairs)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190" },
      { label: "Skilled Work Regional 491 (Home Affairs)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491" },
      { label: "Employer Nomination Scheme 186 (Home Affairs)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/employer-nomination-scheme-186" },
      { label: "Skills in Demand 482 (Home Affairs)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482" },
      { label: "National Innovation visa (Home Affairs)", url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/visas-for-innovation/national-innovation-visa" },
      { label: "About partner visas (Home Affairs)", url: "https://immi.homeaffairs.gov.au/what-we-do/family-migration-program/visa-options/about-partner-visas" },
    ],
    extra: [{ heading: "Agents and filing", md: "Where the law requires a registered migration agent, Visafeast files Australian cases with its licensed partners." }],
  },
  {
    slug: "immigrate-to-uk-from-pakistan", name: "United Kingdom", code: "GB", flag: "gb", to: "LHR", photos: "GB", checked: CHECKED,
    h1: "Immigrate to the UK from Pakistan",
    metaTitle: "UK Immigration from Pakistan: Skilled Worker, Global Talent and Family | Visafeast",
    metaDescription: "The main UK work and family visas explained in plain words, as described on GOV.UK. Free eligibility check.",
    intro: "The UK offers work visas for skilled people and a family visa for partners. Here are the main routes, as described on GOV.UK.",
    overview: "The Skilled Worker and Health and Care Worker visas need a job offer from an approved employer, an eligible job and a minimum salary. Most routes also need English.",
    options: [
      { name: "Skilled Worker visa", url: "https://www.gov.uk/skilled-worker-visa", summary: "Lets you come to or stay in the UK to do an eligible job with an approved employer. You need a certificate of sponsorship, a job on the list of eligible occupations and a minimum salary, and you must have a confirmed job offer before you apply. The visa can last up to 5 years, and after 5 years you may be able to settle." },
      { name: "Health and Care Worker visa", url: "https://www.gov.uk/health-care-worker-visa", summary: "For medical professionals with a job with the NHS, an NHS supplier or in adult social care. You need an eligible health or social care job, a certificate of sponsorship and a minimum salary. The visa can last up to 5 years." },
      { name: "Global Talent visa", url: "https://www.gov.uk/global-talent", summary: "To work in the arts, sciences or digital technology once you are endorsed as a leader or potential leader. You must be at least 18. Winners of an eligible prestigious prize can apply directly; everyone else needs an endorsement first." },
      { name: "Innovator Founder visa", url: "https://www.gov.uk/innovator-founder-visa", summary: "For people who want to set up and run an innovative business in the UK. Your idea must be new, innovative and scalable, and an endorsing body must assess it." },
      { name: "Spouse or partner (family visa)", url: "https://www.gov.uk/uk-family-visa/partner-spouse", summary: "To join a partner in the UK. You both need to be 18 or over, and you must prove a marriage or civil partnership recognised in the UK, or at least 2 years living together in a relationship (other options apply). You also need good English and must meet the financial requirements, and you must intend to live together permanently in the UK." },
    ],
    sources: [
      { label: "Skilled Worker visa (GOV.UK)", url: "https://www.gov.uk/skilled-worker-visa" },
      { label: "Health and Care Worker visa (GOV.UK)", url: "https://www.gov.uk/health-care-worker-visa" },
      { label: "Global Talent visa (GOV.UK)", url: "https://www.gov.uk/global-talent" },
      { label: "Innovator Founder visa (GOV.UK)", url: "https://www.gov.uk/innovator-founder-visa" },
      { label: "Partner or spouse visa (GOV.UK)", url: "https://www.gov.uk/uk-family-visa/partner-spouse" },
    ],
    extra: [{ heading: "Fees and processing times", md: `GOV.UK lists the fee for each route on its own page. ${VERIFY_FEES}` }],
  },
  {
    slug: "immigrate-to-usa-from-pakistan", name: "USA", code: "US", flag: "us", to: "JFK", photos: "US", checked: CHECKED,
    h1: "Immigrate to the USA from Pakistan",
    metaTitle: "USA Immigration from Pakistan: EB-1, EB-2 NIW, EB-5, H-1B and Family | Visafeast",
    metaDescription: "The main US employment-based and family routes explained simply, with the rules and alerts shown on USCIS and the US Embassy in Pakistan.",
    intro: "The USA has employment-based green card categories, a temporary work visa and family routes. Here are the main ones, as described on USCIS.",
    overview: "US immigration rules change often, including fees and entry restrictions. Read the notes below and the official pages before you plan.",
    options: [
      { name: "EB-2 and National Interest Waiver (NIW)", url: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2", summary: "EB-2 is for professionals with an advanced degree and for people with exceptional ability. Most petitions need a job offer and a Department of Labor labor certification, but a petition can ask for a waiver of the job offer because the work is in the national interest (the National Interest Waiver)." },
      { name: "EB-1A extraordinary ability", url: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", summary: "For people with extraordinary ability in the sciences, arts, education, business or athletics, shown by sustained national or international acclaim. You must meet at least 3 of 10 listed criteria, or show a one-time major achievement. No labor certification is required. EB-1 also covers outstanding professors and researchers and certain multinational executives and managers." },
      { name: "EB-5 investor", url: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/eb-5-immigrant-investor-program", summary: "Investors, with their spouse and unmarried children under 21, can apply for a green card by making the required investment in a US commercial enterprise and planning to create or preserve 10 permanent full-time jobs for qualified US workers." },
      { name: "H-1B (employer-sponsored work visa)", status: "Check USCIS alerts", url: "https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations", summary: "A temporary (nonimmigrant) work visa for specialty occupations. Your employer files the petition. USCIS has posted alerts about H-1B fees and entry rules that change over time, so read its current page before you plan." },
      { name: "Family-based green cards", url: "https://www.uscis.gov/family", summary: "A US citizen or green card holder (and in some cases a recent refugee or asylee) may petition for certain relatives, or future relatives such as a fiancé(e), to immigrate. Your status decides which relatives are eligible." },
    ],
    sources: [
      { label: "EB-2 (USCIS)", url: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2" },
      { label: "EB-1 (USCIS)", url: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1" },
      { label: "EB-5 (USCIS)", url: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/eb-5-immigrant-investor-program" },
      { label: "H-1B (USCIS)", url: "https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations" },
      { label: "Family (USCIS)", url: "https://www.uscis.gov/family" },
      { label: "Visas (US Embassy and Consulates in Pakistan)", url: "https://pk.usembassy.gov/visas/" },
    ],
    extra: [
      { heading: "Check before you plan: entry restrictions", md: "The US Embassy in Pakistan says that under Presidential Proclamation 10998 (in effect from 1 January 2026) the United States is suspending or limiting entry and visa issuance for nationals of 39 countries. People subject to it can still apply and attend interviews, but may be refused a visa or entry. Read the Embassy's notice and travel.state.gov to see whether it applies to your passport." },
      { heading: "Where interviews happen", md: "The visa section of the US Embassy in Islamabad does immigrant and nonimmigrant visa interviews, by appointment only. The US Consulate General in Karachi does nonimmigrant interviews only." },
    ],
  },
  {
    slug: "immigrate-to-germany-from-pakistan", name: "Germany", code: "DE", flag: "de", to: "BER", photos: "DE", checked: CHECKED,
    h1: "Immigrate to Germany from Pakistan",
    metaTitle: "Germany Immigration from Pakistan: Blue Card and Opportunity Card | Visafeast",
    metaDescription: "The main German work and residence routes for skilled people, explained simply with links to the official Make it in Germany portal.",
    intro: "Germany has routes for skilled workers, university graduates and people who want to search for a job. Here are the main ones.",
    overview: "Make it in Germany is the Federal Government's official portal for skilled workers. Salary limits and other figures are set or updated each year, so check the portal for the current numbers before you apply.",
    options: [
      { name: "EU Blue Card", url: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card", summary: "A residence permit for qualified professionals with a job in Germany that meets a minimum salary. The salary thresholds are published each year, so check the current figures on the official page." },
      { name: "Opportunity Card (Chancenkarte)", url: "https://www.make-it-in-germany.com/en/visa-residence/types/opportunity-card", summary: "A residence title under Section 20a of the Residence Act that lets you search for qualified employment, or take a measure to get your qualification recognised. A first card allows a stay of up to one year, and you must show you can support yourself." },
      { name: "Skilled worker visa", url: "https://www.make-it-in-germany.com/en/visa-residence/skilled-immigration-act", summary: "Germany's Skilled Immigration Act sets out the ways qualified professionals can come to work in Germany. The official page explains the routes and what each needs." },
      { name: "Family reunion", url: "https://www.make-it-in-germany.com/en", summary: "Family members of people who live in Germany may be able to join them. The rules depend on the status of the person already in Germany. Ask us and we check the official source for your case." },
    ],
    sources: [
      { label: "EU Blue Card (Make it in Germany)", url: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card" },
      { label: "Opportunity Card (Make it in Germany)", url: "https://www.make-it-in-germany.com/en/visa-residence/types/opportunity-card" },
      { label: "The Skilled Immigration Act (Make it in Germany)", url: "https://www.make-it-in-germany.com/en/visa-residence/skilled-immigration-act" },
      { label: "Visa information, Federal Foreign Office (Pakistan)", url: "https://pakistan.diplo.de/pk-en/service/2208622-2208622" },
    ],
    extra: [{ heading: "Visa fees and processing in Pakistan", md: "For national visas, the German Embassy says processing times vary widely with the reason for the stay and the quality of the application and documents. Visa fees are due in PKR at the current exchange rate." }],
  },
  {
    slug: "immigrate-to-new-zealand-from-pakistan", name: "New Zealand", code: "NZ", flag: "nz", to: "AKL", photos: "NZ", checked: CHECKED,
    h1: "Immigrate to New Zealand from Pakistan",
    metaTitle: "New Zealand Immigration from Pakistan: Skilled Migrant, Green List and Work Visas | Visafeast",
    metaDescription: "The main New Zealand residence and work visas explained simply, with costs and processing times shown by Immigration New Zealand.",
    intro: "New Zealand has resident visas for skilled workers and partners, and a work visa for people with a job offer. Here are the main ones.",
    overview: "Costs and processing times below are the figures shown on each official Immigration New Zealand page on the day we read them. Processing times are shown as the time within which 80% of applications are decided.",
    options: [
      { name: "Skilled Migrant Category Resident Visa", url: "https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/", summary: "A resident visa that lets you live, work and study in New Zealand indefinitely. You submit an expression of interest and, if it is accepted, you are invited to apply. You must work for (or have a full-time job offer from) an accredited employer, meet the requirements of a Skilled Migrant Category pathway, and speak and understand English. You must be 55 or younger. Cost: from NZD 6,450." },
      { name: "Green List Straight to Residence Visa", url: "https://www.immigration.govt.nz/visas/straight-to-residence-visa/", summary: "A resident visa for people with a job or job offer with an accredited employer where the job is on Tier 1 of the Green List of in-demand jobs. Cost: from NZD 6,450. 80% of applications are decided within 3.5 months." },
      { name: "Accredited Employer Work Visa", url: "https://www.immigration.govt.nz/visas/accredited-employer-work-visa/", summary: "A work visa for people with a job offer from an accredited employer. The employer sends you a link to the online application. It can last up to 5 years, depending on the job. Cost: from NZD 1,540. 80% of applications are decided within 5 weeks." },
      { name: "Partner of a New Zealander Resident Visa", url: "https://www.immigration.govt.nz/visas/partner-of-a-new-zealander-resident-visa/", summary: "For people whose partner is a New Zealand citizen or resident. You can live, work and study in New Zealand indefinitely. Cost: from NZD 5,360. 80% of applications are decided within 7 months." },
    ],
    sources: [
      { label: "Skilled Migrant Category Resident Visa (Immigration NZ)", url: "https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/" },
      { label: "Straight to Residence Visa (Immigration NZ)", url: "https://www.immigration.govt.nz/visas/straight-to-residence-visa/" },
      { label: "Accredited Employer Work Visa (Immigration NZ)", url: "https://www.immigration.govt.nz/visas/accredited-employer-work-visa/" },
      { label: "Partner of a New Zealander Resident Visa (Immigration NZ)", url: "https://www.immigration.govt.nz/visas/partner-of-a-new-zealander-resident-visa/" },
    ],
    extra: [{ heading: "Licensed advisers", md: "Where the law requires a licensed immigration adviser, Visafeast files New Zealand cases with its licensed partners." }],
  },
  {
    slug: "immigrate-to-europe-from-pakistan", name: "Europe", code: "EU", flag: "eu", to: "EUR", photos: "EU2", checked: CHECKED,
    h1: "Immigrate to Europe from Pakistan",
    metaTitle: "Europe Immigration from Pakistan: Portugal, Ireland and Netherlands | Visafeast",
    metaDescription: "Work and residence routes in Portugal, Ireland and the Netherlands, explained simply with links to each government's official pages.",
    intro: "Several European countries have their own routes for skilled workers and people with passive income. Here are three popular ones.",
    overview: "Each European country sets its own rules, so there is no single European route. These pages show what each government's official site says; check them for the latest status before you plan.",
    options: [
      { name: "Ireland: Critical Skills Employment Permit", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/permit-types/critical-skills-employment-permit/", summary: "Designed to attract highly skilled people into Ireland. Eligible occupations are in short supply and highly skilled, such as ICT professionals and professional engineers and technologists. A Labour Market Needs Test is not required. Permit holders can apply for immediate family reunification, and after the permit period may apply for permission to reside and work without an employment permit." },
      { name: "Netherlands: Highly skilled migrant", url: "https://ind.nl/en/residence-permits/work/highly-skilled-migrant", summary: "To work in the Netherlands as a highly skilled migrant you need a residence permit. Only an employer recognised by the IND (the Dutch immigration service) can apply for your permit. The IND page lists the requirements." },
      { name: "Portugal: residence visa for passive income (D7)", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/residency", summary: "Portugal's official visa portal lists a residence visa for people who live from passive income. You show documents about your income and that you have enough means to live on. After you arrive you apply for a residence permit with AIMA, Portugal's migration agency." },
      { name: "Portugal: job seeker visa", status: "Not available when we checked", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/job-seeker-visa", summary: "Portugal's visa portal says the earlier job-seeking visa stopped being accepted on 23 October 2025, and that its replacement, the Skilled Job Seeker Visa, was not yet available at consulates. Check the portal for the current position." },
    ],
    sources: [
      { label: "Critical Skills Employment Permit (Ireland)", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/permit-types/critical-skills-employment-permit/" },
      { label: "Highly skilled migrant (IND, Netherlands)", url: "https://ind.nl/en/residence-permits/work/highly-skilled-migrant" },
      { label: "Residency visas (Portugal visa portal)", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/residency" },
      { label: "Skilled Job Seeker Visa (Portugal visa portal)", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/job-seeker-visa" },
    ],
  },
];

IMMIGRATION_GUIDES.push(...MORE_IMMIGRATION);
export const IMMIGRATION_SLUGS = IMMIGRATION_GUIDES.map((g) => g.slug);
