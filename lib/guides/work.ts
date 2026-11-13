import type { ImmigrationGuide } from "./types";

// WORK PERMITS. Every statement below was read on the official government page listed in `sources`, on the date in `checked`
// (12–13 November 2026). Anything those pages did not state is left out (CLAUDE.md: never invent facts).
// Not added because the official sites refused automated reading: Australia (Home Affairs), France (France-Visas),
// Qatar (Qatar Visa Center), Saudi Arabia (general work-visa rules) and South Korea (EPS pages showed no text). Add them only from a page actually read.
const CHECKED = "2026-11-12";
const VERIFY = "Fees, salary limits and processing times change, often every year. Always check the official page before you apply.";
const SCAM = {
  heading: "Protect yourself from fake job offers",
  md: "A real work visa starts with a real job offer from a real employer. Never pay anyone for a job offer, and never use borrowed or fake documents. If an offer looks too good to be true, ask us on WhatsApp before you pay anything.",
};

export const WORK_GUIDES: ImmigrationGuide[] = [
  {
    slug: "uk-work-visa-from-pakistan", name: "United Kingdom", code: "GB", flag: "gb", to: "LHR", photos: "GB", checked: CHECKED,
    h1: "UK Work Visa from Pakistan",
    metaTitle: "UK Work Visa from Pakistan: Skilled Worker, Health and Care, Global Talent | Visafeast",
    metaDescription: "UK work visas explained simply: Skilled Worker, Health and Care Worker, Global Talent, Scale-up and Seasonal Worker, with fees and decision times from GOV.UK.",
    intro: "Most UK work visas need a job offer from a UK employer approved by the Home Office. Here are the main ones, with the official fees.",
    overview: "Most UK work visas need a job offer from an employer approved by the Home Office, who gives you a certificate of sponsorship. Global Talent is different: it needs an endorsement or a major prize, not a job offer. The figures below are from GOV.UK on the day we read it.",
    options: [
      {
        name: "Skilled Worker visa", url: "https://www.gov.uk/skilled-worker-visa",
        summary: "For an eligible job with a Home Office-approved employer. You need a confirmed job offer and a certificate of sponsorship before you apply. You usually need to be paid at least £41,700 a year or the 'going rate' for the job, whichever is higher (some jobs may be paid less, from £33,400). English at level B2 is usually needed.",
        facts: [["Visa fee (from outside the UK)", "£819 up to 3 years · £1,618 over 3 years"], ["Healthcare surcharge", "£1,035 per year"], ["Decision", "Usually within 3 weeks"], ["Length", "Up to 5 years, then extend"], ["Family", "Partner and children can apply"], ["Settlement", "Possible after 5 years"]],
      },
      {
        name: "Health and Care Worker visa", url: "https://www.gov.uk/health-care-worker-visa",
        summary: "For qualified doctors, nurses, health professionals and adult social care professionals with an eligible job with the NHS, an NHS supplier or in adult social care. You need an approved employer and a certificate of sponsorship.",
        facts: [["Visa fee", "£324 up to 3 years · £628 over 3 years"], ["Healthcare surcharge", "None (also none for your family)"], ["Decision", "Usually within 3 weeks"], ["Length", "Up to 5 years, then extend"], ["Family", "Partner and children can apply"], ["Settlement", "Possible after 5 years"]],
      },
      {
        name: "Global Talent visa", url: "https://www.gov.uk/global-talent",
        summary: "For leaders or potential leaders in academia or research, arts and culture, or digital technology, aged 18 or over. You need an endorsement from an approved body or an eligible prize. No job offer is needed.",
        facts: [["Fee", "£766 in total (£561 endorsement + £205 visa)"], ["Healthcare surcharge", "£1,035 per year"], ["Decision", "About 3 weeks"], ["Length", "Up to 5 years at a time"], ["Settlement", "After 3 or 5 years, depending on your field"]],
      },
      {
        name: "Scale-up Worker visa", url: "https://www.gov.uk/scale-up-worker-visa",
        summary: "For an eligible job with a fast-growing UK business. You need a job offer of at least 6 months and a salary of at least £39,100 a year or the going rate for the job, whichever is higher.",
        facts: [["Visa fee", "£937"], ["Healthcare surcharge", "£1,035 per year"], ["Decision", "About 3 weeks"], ["Length", "2 years, then extend by 3 years"], ["Settlement", "Possible after 5 years"]],
      },
      {
        name: "Seasonal Worker visa", url: "https://www.gov.uk/seasonal-worker-visa",
        summary: "Temporary farm work: horticulture for up to 6 months, or poultry from 2 October to 31 December. You need a certificate of sponsorship reference from a UK sponsor. You cannot bring family members or take a permanent job. Poultry applications must be made by 15 November each year.",
        facts: [["Visa fee", "£340"], ["Decision", "Usually within 3 weeks"], ["Family", "Cannot come with you"]],
      },
    ],
    funds: "Most of these visas need you to show at least £1,270 in savings (for the Skilled Worker visa, held for 28 days in a row), unless you are exempt.",
    extra: [
      { heading: "English test", md: "GOV.UK's list of nationalities that do not need to prove English does not include Pakistan, so most applicants from Pakistan prove English with an approved test." },
      { heading: "Before you apply", md: VERIFY },
      SCAM,
    ],
    sources: [
      { label: "Skilled Worker visa (GOV.UK)", url: "https://www.gov.uk/skilled-worker-visa" },
      { label: "Health and Care Worker visa (GOV.UK)", url: "https://www.gov.uk/health-care-worker-visa" },
      { label: "Global Talent visa (GOV.UK)", url: "https://www.gov.uk/global-talent" },
      { label: "Scale-up Worker visa (GOV.UK)", url: "https://www.gov.uk/scale-up-worker-visa" },
      { label: "Seasonal Worker visa (GOV.UK)", url: "https://www.gov.uk/seasonal-worker-visa" },
    ],
  },
  {
    slug: "canada-work-permit-from-pakistan", name: "Canada", code: "CA", flag: "ca", to: "YYZ", photos: "CA", checked: CHECKED,
    h1: "Canada Work Permit from Pakistan",
    metaTitle: "Canada Work Permit from Pakistan: LMIA, Open Permit, Global Talent | Visafeast",
    metaDescription: "Canada's two kinds of work permit, the LMIA your employer may need, the Global Talent Stream, and the official IRCC fees, explained simply.",
    intro: "Canada has two kinds of work permit. Most people need a job offer from a Canadian employer first. Here is how it works.",
    overview: "The Government of Canada says there are 2 types of work permit: employer-specific (the most common, needs a job offer) and open (only in certain situations). The fees below are from IRCC's official fee list.",
    options: [
      {
        name: "Employer-specific work permit", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary/need-permit.html",
        summary: "The most common type. You need a job offer from a Canadian employer, and the employer may need a Labour Market Impact Assessment (LMIA) first.",
        facts: [["Work permit fee", "CAD 155 per person"], ["Biometrics", "CAD 85 per person · CAD 170 maximum per family"]],
      },
      {
        name: "Open work permit", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary/need-permit.html",
        summary: "For special circumstances. No job offer is needed and you can work for most compliant employers in Canada, but you are only eligible in certain situations.",
        facts: [["Fees", "CAD 155 work permit + CAD 100 open work permit holder fee"]],
      },
      {
        name: "LMIA: the employer's step", url: "https://www.canada.ca/en/employment-social-development/services/foreign-workers.html",
        summary: "A Labour Market Impact Assessment is applied for by the Canadian employer who wants to hire a temporary foreign worker, through LMIA Online. After a positive LMIA, the employer sends you the LMIA letter and the signed contract, and you apply to IRCC for your work permit.",
      },
      {
        name: "Global Talent Stream", url: "https://www.canada.ca/en/employment-social-development/services/foreign-workers/global-talent.html",
        summary: "For innovative Canadian firms that need unique and specialised talent, or that hire for in-demand, highly skilled jobs on the Global Talent occupations list. The employer applies. A positive LMIA is valid for up to 6 months after it is issued.",
        facts: [["Employer's LMIA", "10 business days, 80% of the time"], ["Work permit", "About 2 weeks (80% of the time), as stated by the Government of Canada"], ["Job length", "Up to 3 years for high-wage positions"]],
      },
    ],
    extra: [{ heading: "Before you apply", md: VERIFY }, SCAM],
    sources: [
      { label: "Find out if you need a work permit (Government of Canada)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary/need-permit.html" },
      { label: "Work permit eligibility (Government of Canada)", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary/eligibility.html" },
      { label: "Hire a temporary foreign worker with an LMIA (ESDC)", url: "https://www.canada.ca/en/employment-social-development/services/foreign-workers.html" },
      { label: "Global Talent Stream (ESDC)", url: "https://www.canada.ca/en/employment-social-development/services/foreign-workers/global-talent.html" },
      { label: "IRCC fee list", url: "https://ircc.canada.ca/english/information/fees/fees.asp" },
    ],
  },
  {
    slug: "germany-work-visa-from-pakistan", name: "Germany", code: "DE", flag: "de", to: "BER", photos: "DE", checked: CHECKED,
    h1: "Germany Work Visa and Opportunity Card from Pakistan",
    metaTitle: "Germany Opportunity Card and Work Visa from Pakistan: Blue Card, Skilled Workers | Visafeast",
    metaDescription: "Germany's Opportunity Card (Chancenkarte), EU Blue Card and skilled worker visas for Pakistanis, with the requirements and fee published by the German Embassy.",
    intro: "Germany lets skilled people come with a job contract, or come first to look for a job with the Opportunity Card. Here are the routes.",
    overview: "The German Embassy in Islamabad takes work and Opportunity Card visa applications through the Federal Foreign Office's online Consular Services Portal. You still go in person to give fingerprints, pay the fee and show your original documents. Applicants from Sindh and Balochistan apply through the Consulate General in Karachi.",
    options: [
      {
        name: "Opportunity Card (Chancenkarte): job seeker", url: "https://pakistan.diplo.de/pk-en/service/2632954-2632954",
        summary: "Come to Germany to look for qualified work, or to take steps to get your qualification recognised (Section 20a of the Residence Act). A first card allows a stay of up to one year. The Consulate General in Karachi lists: a university degree recognised in Germany (anabin database or a Statement of Comparability), money for living costs and money for a return ticket.",
        facts: [["Living costs", "€1,027 per month"], ["Return ticket money", "€500"], ["Visa fee", "€75 (long-term visa, paid in PKR)"], ["Length", "Up to 1 year (first card)"]],
      },
      {
        name: "EU Blue Card", url: "https://pakistan.diplo.de/pk-en/service/2593356-2593356",
        summary: "For graduates with a job contract in Germany. Your degree must be recognised in Germany (anabin or a Statement of Comparability). The Consulate General in Karachi shows the 2025 salary limits: at least €48,300 a year, or at least €43,759.80 if you graduated in the last three years or work in a shortage job such as IT or STEM.",
        facts: [["Contract", "At least 6 months (BAMF)"], ["Length", "4 years as a rule (BAMF)"], ["Permanent stay", "Settlement permit after 27 months, or 21 months with German B1 (BAMF)"]],
      },
      {
        name: "Skilled worker with a university degree", url: "https://pakistan.diplo.de/pk-en/service/2595682-2595682",
        summary: "If you do not meet the Blue Card rules: a valid job contract with a company in Germany and a university degree recognised in Germany (anabin or a Statement of Comparability).",
      },
      {
        name: "Skilled worker with vocational training", url: "https://pakistan.diplo.de/pk-en/service/2593478-2593478",
        summary: "A valid job contract with a company in Germany and a vocational qualification recognised by the competent German authority.",
      },
      {
        name: "Skilled worker with practical experience", url: "https://pakistan.diplo.de/pk-en/service/4-work-jobseeker-1676106",
        summary: "The Embassy lists this category for people with at least two years of experience in the last five years and vocational training from their home country.",
      },
    ],
    extra: [
      { heading: "Fee and processing time", md: "The long-term (national, category D) visa fee is €75. It is paid in cash at the counter, in PKR at the current exchange rate, at the Embassy in Islamabad or the Consulate General in Karachi. The Embassy says processing times for national visas vary widely with the reason for the stay and the quality of the application and documents; it gives no fixed number." },
      { heading: "Faster processing with a pre-approval", md: "If your employer gets a pre-approval under Section 81a (the fast-track procedure) that is not older than three months, the Embassy offers faster processing. You register on its priority list and also on the portal." },
      { heading: "The points route for the Opportunity Card", md: "People without a fully recognised qualification may qualify through points. The official points table is on the German government's Make it in Germany portal. Send us your profile and we compare it with the official rules." },
      SCAM,
    ],
    sources: [
      { label: "Opportunity Card (Consulate General Karachi)", url: "https://pakistan.diplo.de/pk-en/service/2632954-2632954" },
      { label: "EU Blue Card (Consulate General Karachi)", url: "https://pakistan.diplo.de/pk-en/service/2593356-2593356" },
      { label: "Skilled workers with a university degree (Consulate General Karachi)", url: "https://pakistan.diplo.de/pk-en/service/2595682-2595682" },
      { label: "Skilled workers with vocational qualification (Consulate General Karachi)", url: "https://pakistan.diplo.de/pk-en/service/2593478-2593478" },
      { label: "Employment, training and jobseeker visas (German Embassy Islamabad)", url: "https://pakistan.diplo.de/pk-en/service/4-work-jobseeker-1676106" },
      { label: "Visa: general information, fees (German Embassy Islamabad)", url: "https://pakistan.diplo.de/pk-en/service/2208622-2208622" },
      { label: "Consular Services Portal (Federal Foreign Office)", url: "https://www.auswaertiges-amt.de/en/visa-service/consular-services-portal" },
      { label: "EU Blue Card (BAMF)", url: "https://www.bamf.de/EN/Themen/MigrationAufenthalt/ZuwandererDrittstaaten/Migrathek/BlaueKarteEU/blauekarteeu-node.html" },
      { label: "Opportunity Card (Make it in Germany)", url: "https://www.make-it-in-germany.com/en/visa-residence/types/opportunity-card" },
    ],
  },
  {
    slug: "new-zealand-work-visa-from-pakistan", name: "New Zealand", code: "NZ", flag: "nz", to: "AKL", photos: "NZ", checked: CHECKED,
    h1: "New Zealand Work Visa from Pakistan",
    metaTitle: "New Zealand Work Visa from Pakistan: Accredited Employer Work Visa | Visafeast",
    metaDescription: "New Zealand's Accredited Employer Work Visa and Specific Purpose Work Visa explained simply, with costs and processing times from Immigration New Zealand.",
    intro: "To work in New Zealand you normally need a job offer from an accredited employer. Here are the main work visas.",
    overview: "Costs and processing times below are the figures shown by Immigration New Zealand on the day we read them. Processing times are the time within which 80% of applications are decided.",
    options: [
      {
        name: "Accredited Employer Work Visa (AEWV)", url: "https://www.immigration.govt.nz/visas/accredited-employer-work-visa/",
        summary: "For people with a full-time job offer (at least 30 hours a week) from an accredited employer with an approved job check, paid at least the wage rate for the job. You need 2 years or more of relevant experience, or a qualification at level 4 or higher (a Bachelor's degree or higher can be in any field). A CV alone is not enough proof of experience. English is needed for skill level 3 to 5 jobs.",
        facts: [["Cost", "From NZD 1,540"], ["Decision", "80% within 5 weeks"], ["Length", "Up to 5 years (3 years for skill level 4 or 5 jobs)"], ["Family", "Not in the same application; you may be able to support their visas"], ["Residence", "Can lead to residence, depending on the job"]],
      },
      {
        name: "Specific Purpose Work Visa", url: "https://www.immigration.govt.nz/visas/specific-purpose-work-visa/",
        summary: "For work in New Zealand for a specific purpose or event. You show evidence of the purpose, how long you need to stay, enough money to live on (or a sponsor) and that you can leave at the end.",
        facts: [["Cost", "From NZD 1,455"], ["Decision", "80% within 2.5 weeks"], ["Length", "As long as needed for the purpose"], ["Family", "Not in the same application"]],
      },
    ],
    extra: [
      { heading: "Official warning about job scams", md: "Immigration New Zealand warns that job offer scams are common in India and South Asia. It declines an application if the applicant or their agent offered or promised money to the employer for a job offer, and employers or agents cannot charge you a fee for a job or for recruitment costs." },
      { heading: "Health and character", md: "You need good health and good character. Police certificates are needed if you are 17 or older and will stay 24 months or longer, and a chest X-ray is needed for stays over 6 months for people from countries without a low rate of tuberculosis." },
      { heading: "Before you apply", md: VERIFY },
    ],
    sources: [
      { label: "Accredited Employer Work Visa (Immigration NZ)", url: "https://www.immigration.govt.nz/visas/accredited-employer-work-visa/" },
      { label: "Specific Purpose Work Visa (Immigration NZ)", url: "https://www.immigration.govt.nz/visas/specific-purpose-work-visa/" },
    ],
  },
  {
    slug: "ireland-work-permit-from-pakistan", name: "Ireland", code: "IE", flag: "ie", to: "DUB", photos: "", checked: CHECKED,
    h1: "Ireland Work Permit from Pakistan",
    metaTitle: "Ireland Work Permit from Pakistan: Critical Skills and General Employment Permit | Visafeast",
    metaDescription: "Ireland's Critical Skills Employment Permit and General Employment Permit: minimum salaries, fees and family rules from the Irish government.",
    intro: "Ireland gives employment permits to workers from outside Europe who have a job offer. Here are the two main permits.",
    overview: "Ireland's Department of Enterprise issues employment permits. Either you or your employer can apply, and the permit is issued to you. Applications must arrive at least 12 weeks before the job start date and are processed in date order.",
    options: [
      {
        name: "Critical Skills Employment Permit", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/permit-types/critical-skills-employment-permit/",
        summary: "For highly skilled jobs on the Critical Skills Occupations List, such as ICT professionals, engineers and technologists. The job offer must be for at least 2 years. Minimum yearly pay: €40,904 for listed occupations with a relevant degree (€36,848 if you got the qualification in the last 12 months), or €68,911 for other eligible occupations.",
        facts: [["Fee", "€1,000 (90% refunded if refused)"], ["Family", "Immediate family can join you"], ["Long-term", "Long-term residence possible after 60 months"]],
      },
      {
        name: "General Employment Permit", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/permit-types/general-employment-permit/",
        summary: "The main permit for jobs with labour or skills shortages. All occupations are eligible unless they are on the Ineligible List. Minimum yearly pay is generally €36,605 (€32,691 with at least €16.12 an hour for horticulture workers, meat processor operatives, health care assistants and home support workers). In most cases the employer must first do a Labour Market Needs Test.",
        facts: [["Fee", "€500 (6 months or less) · €1,000 (more than 6 up to 24 months)"], ["Length", "Up to 2 years, then renewable for up to 3 more"], ["Family", "Spouses and partners need their own permit"], ["Long-term", "Long-term residence possible after 5 years"]],
      },
    ],
    extra: [{ heading: "Before you apply", md: VERIFY }, SCAM],
    sources: [
      { label: "Critical Skills Employment Permit (Department of Enterprise)", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/permit-types/critical-skills-employment-permit/" },
      { label: "General Employment Permit (Department of Enterprise)", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/permit-types/general-employment-permit/" },
    ],
  },
  {
    slug: "netherlands-work-permit-from-pakistan", name: "Netherlands", code: "NL", flag: "nl", to: "AMS", photos: "NL", checked: CHECKED,
    h1: "Netherlands Work Permit from Pakistan",
    metaTitle: "Netherlands Work Permit from Pakistan: Highly Skilled Migrant and EU Blue Card | Visafeast",
    metaDescription: "The Dutch highly skilled migrant permit and EU Blue Card: 2026 salary limits, fees and decision times from the IND.",
    intro: "The Netherlands has two main work permits for skilled people from outside Europe. Your employer usually starts the application.",
    overview: "The IND (the Dutch immigration service) sets the salary limits again every year on 1 January. The 2026 figures below are gross monthly salaries.",
    options: [
      {
        name: "Highly skilled migrant", url: "https://ind.nl/en/residence-permits/work/highly-skilled-migrant",
        summary: "Only an employer recognised by the IND can apply for you; it applies for your entry visa (MVV) and residence permit together. Minimum gross monthly salary in 2026: €5,942 if you are 30 or older, €4,357 if you are under 30, or €3,122 for recent graduates (reduced criterion).",
        facts: [["Fee", "€423, paid by the employer"], ["Decision", "Within 90 days (often shorter)"], ["Length", "Same as your contract, up to 5 years"], ["Permanent stay", "Can apply after 5 years"]],
      },
      {
        name: "EU Blue Card", url: "https://ind.nl/en/residence-permits/work/european-blue-card-residence-permit",
        summary: "For highly educated employees: a higher education diploma of at least 3 years, or at least 5 years of relevant work experience (3 of the last 7 years for IT managers and professionals), and a contract of at least 6 months. Minimum gross monthly salary in 2026: €5,942, or €4,754 under the reduced criterion. The employer does not need to be a recognised sponsor.",
        facts: [["Fee", "€423"], ["Decision", "30 days with a recognised sponsor, otherwise up to 90 days"], ["Length", "Up to 5 years"], ["Permanent stay", "Usually after 5 years"]],
      },
    ],
    extra: [{ heading: "Before you apply", md: VERIFY }, SCAM],
    sources: [
      { label: "Highly skilled migrant (IND)", url: "https://ind.nl/en/residence-permits/work/highly-skilled-migrant" },
      { label: "European Blue Card (IND)", url: "https://ind.nl/en/residence-permits/work/european-blue-card-residence-permit" },
      { label: "Required amounts and income requirements (IND)", url: "https://ind.nl/en/required-amounts-income-requirements" },
    ],
  },
  {
    slug: "portugal-work-visa-from-pakistan", name: "Portugal", code: "PT", flag: "pt", to: "LIS", photos: "PT", checked: CHECKED,
    h1: "Portugal Work Visa from Pakistan",
    metaTitle: "Portugal Work Visa from Pakistan: Residence Visa for Work and Job Seeker Status | Visafeast",
    metaDescription: "Portugal's residence visa for work and highly qualified work, the national visa fee, and the current status of the job seeker visa, from Portugal's visa portal.",
    intro: "Portugal's work visas are residence visas. You get the visa first, then apply for a residence permit in Portugal. Here is what the official portal shows.",
    overview: "Portugal's official visa portal lists residence visas for work. A residence visa is valid for two entries and four months; in that time you apply for a residence permit with AIMA, Portugal's migration agency.",
    options: [
      {
        name: "Residence visa for work (employed)", url: "https://vistos.mne.gov.pt/en/national-visas/general-information/type-of-visa",
        summary: "For employed work in Portugal. You show a work contract, a work promise or a demonstration of interest from an employer, and a professional certificate if your profession is regulated in Portugal.",
        facts: [["Visa fee", "€110 (national visa)"], ["Visa length", "4 months, two entries; then a residence permit with AIMA"]],
      },
      {
        name: "Residence visa for highly qualified work", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/residency",
        summary: "For highly qualified jobs: a contract or work promise of at least six months, with a salary of at least 1.5 times the average annual gross salary or three times the indexed value (IAS) set by Portugal.",
        facts: [["Visa fee", "€110 (national visa)"]],
      },
      {
        name: "Skilled job seeker visa", status: "Not available when we checked", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/job-seeker-visa",
        summary: "The portal says this visa is not yet available at Portuguese consulates, while it waits for the regulation of Article 57-A of the Foreigners' Law. Check the portal for the current position.",
      },
    ],
    extra: [{ heading: "Before you apply", md: VERIFY }, SCAM],
    sources: [
      { label: "Type of visa (Portugal visa portal)", url: "https://vistos.mne.gov.pt/en/national-visas/general-information/type-of-visa" },
      { label: "Residency visas: documents (Portugal visa portal)", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/residency" },
      { label: "Fees (Portugal visa portal)", url: "https://vistos.mne.gov.pt/en/national-visas/general-information/fees" },
      { label: "Skilled Job Seeker Visa (Portugal visa portal)", url: "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/job-seeker-visa" },
    ],
  },
  {
    slug: "uae-work-visa-from-pakistan", name: "UAE", code: "AE", flag: "ae", to: "DXB", photos: "AE", checked: CHECKED,
    h1: "UAE Work Visa from Pakistan",
    metaTitle: "UAE Work Visa from Pakistan: Employment Visa and Green Visa | Visafeast",
    metaDescription: "How UAE work visas work: the standard employment visa your employer applies for, and the 5-year Green visa for skilled workers and freelancers, from the UAE government portal.",
    intro: "In the UAE your employer applies for your work visa. Skilled workers and freelancers may also qualify for the Green visa. Here is what the official portal says.",
    overview: "The UAE government portal (u.ae) says the standard work visa is for employees of the government and private sectors, while the Green visa is for skilled employees on self-sponsorship.",
    options: [
      {
        name: "Standard work (employment) visa", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/residence-visa-for-working-in-the-uae",
        summary: "The employer must apply for the standard work visa. It is valid for two years and can be renewed, subject to the rules of the visa-issuing authorities.",
        facts: [["Who applies", "Your employer"], ["Length", "2 years, renewable"]],
      },
      {
        name: "Green visa", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/Types-of-visas/Investor-visa/Green-visa",
        summary: "A renewable 5-year residence visa that does not need a sponsor and lets you sponsor your spouse and children. The portal lists skilled workers, freelancers and self-employed people, and investors and business partners as eligible categories; the detailed rules are set by ICP.",
        facts: [["Sponsor", "Not needed"], ["Length", "5 years, renewable"], ["Family", "Can sponsor spouse and children"]],
      },
    ],
    extra: [{ heading: "Before you apply", md: VERIFY }, SCAM],
    sources: [
      { label: "Work visa (UAE government portal)", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/residence-visa-for-working-in-the-uae" },
      { label: "Green visa (UAE government portal)", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/Types-of-visas/Investor-visa/Green-visa" },
    ],
  },
  {
    slug: "japan-work-visa-from-pakistan", name: "Japan", code: "JP", flag: "jp", to: "NRT", photos: "", checked: CHECKED,
    h1: "Japan Work Visa from Pakistan: Specified Skilled Worker",
    metaTitle: "Japan Specified Skilled Worker (SSW) Visa from Pakistan | Visafeast",
    metaDescription: "Japan's Specified Skilled Worker visa (i) and (ii) for Pakistanis: the work fields, the skills and Japanese tests, and the Japan–Pakistan cooperation agreement.",
    intro: "Japan's Specified Skilled Worker visa lets trained workers fill jobs in sectors that need people. Pakistan and Japan have a cooperation agreement on it.",
    overview: "Japan's Immigration Services Agency lists a Memorandum of Cooperation with Pakistan on Specified Skilled Workers (SSW). For SSW (i) you pass two tests: a Japanese language test and a skills test for your field.",
    options: [
      {
        name: "Specified Skilled Worker (i)", url: "https://www.ssw.go.jp/en/about/visa/",
        summary: "Work in one of 19 fields, including nursing care, building cleaning, construction, manufacturing, shipbuilding, car repair, aviation, hotels, transport, railways, agriculture, fishery, food manufacturing, food service, forestry, wood, recycling, linen services and logistics warehouses. You pass a Japanese language test and a skills test for your field (not needed if you completed Technical Intern Training (ii)). The food service field was not accepting new applications when we checked.",
        facts: [["Length", "Up to 5 years in total"], ["Family", "Cannot come with you"]],
      },
      {
        name: "Specified Skilled Worker (ii)", url: "https://www.ssw.go.jp/en/about/visa/",
        summary: "A higher level in 11 fields, including building cleaning, construction, manufacturing, shipbuilding, car repair, aviation, hotels, agriculture, fishery, food manufacturing and food service.",
        facts: [["Length", "No upper limit"], ["Family", "Can come with you"]],
      },
    ],
    extra: [
      { heading: "Rules for workers from Pakistan", md: "Japan's Immigration Services Agency explains that a Japanese employer who wants to hire a Pakistani worker sends the job and employer details to the Embassy of Pakistan in Japan for approval. Using a sending organisation is optional. Before leaving, the worker must register with the Protector of Emigrants office of Pakistan's Bureau of Emigration & Overseas Employment." },
      { heading: "Before you apply", md: VERIFY },
      SCAM,
    ],
    sources: [
      { label: "SSW visa: fields and length (SSW portal, Government of Japan)", url: "https://www.ssw.go.jp/en/about/visa/" },
      { label: "SSW tests (SSW portal, Government of Japan)", url: "https://www.ssw.go.jp/en/about/sswv/" },
      { label: "Cooperation agreements on SSW (Immigration Services Agency of Japan)", url: "https://www.moj.go.jp/isa/applications/ssw/nyuukokukanri05_00021.html" },
    ],
  },
  {
    slug: "usa-work-visa-from-pakistan", name: "USA", code: "US", flag: "us", to: "JFK", photos: "US", checked: CHECKED,
    h1: "USA Work Visa from Pakistan: H-1B",
    metaTitle: "USA H-1B Work Visa from Pakistan: How It Works and Latest Fee News | Visafeast",
    metaDescription: "The US H-1B visa for specialty occupations: employer petition, the yearly cap and registration, and the latest official news on the $100,000 payment, from USCIS.",
    intro: "The H-1B is the main US work visa for degree-level jobs. Your US employer files for you. Here is how it works and the latest official news.",
    overview: "H-1B is for people who will work in a specialty occupation that needs a US bachelor's degree or higher (or the equivalent) in a related field. The employer runs the process; you cannot apply on your own.",
    options: [
      {
        name: "H-1B specialty occupation", url: "https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations",
        summary: "Three steps: the employer gets a Labor Condition Application certified by the US Department of Labor, then files Form I-129 with USCIS, then you apply for the visa. There is a yearly cap of 65,000, plus 20,000 for people with a US master's degree or higher. Employers register online, typically in March, and only selected registrations can be filed.",
        facts: [["Who applies", "Your US employer"], ["Length", "Up to 3 years, extendable to 6 in total"], ["Family", "Spouse and unmarried children under 21 can get H-4 status"]],
      },
    ],
    extra: [
      { heading: "Latest official news: the $100,000 payment", md: "USCIS says a Presidential Proclamation of 19 September 2025 added a $100,000 payment for certain new H-1B petitions for people outside the US. On 8 June 2026 a US federal court in Massachusetts set aside the guidance that put this payment into effect, and on 24 July 2026 the appeals court refused to pause that ruling. USCIS says it is following the court's order while it considers next steps. Check the USCIS page for the current position before you plan." },
      { heading: "Before you apply", md: VERIFY },
      SCAM,
    ],
    sources: [{ label: "H-1B specialty occupations (USCIS)", url: "https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations" }],
  },
];

export const WORK_SLUGS = WORK_GUIDES.map((g) => g.slug);
