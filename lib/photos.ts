// Photo slots (brief §4 Imagery). Fill `src` (a file in /public/photos or a Supabase Storage URL) once a royalty-free photo
// is chosen; keep licence + credit here AND in the `media` table. Until then <Photo/> shows the "Photo coming soon" placeholder.
export interface PhotoDef { src?: string; alt: string; alt_ur?: string; credit?: string; sourceUrl?: string; licence?: string }

export const PHOTOS: Record<string, PhotoDef> = {
  "hero-traveller": { alt: "Happy Pakistani family at the airport with passports — visa consultancy" },
  "step-call": { alt: "Woman smiling during a phone call with a visa consultant" },
  "step-documents": { alt: "Passport and visa documents laid out on a desk" },
  "step-fly": { alt: "View from an aeroplane window" },
  "eligibility": { alt: "Young man thinking about his visa chances with a phone" },
  "decoder": { alt: "Worried man reading a visa refusal letter" },
  "refused-bank": { alt: "Stressed person checking a bank statement" },
  "refused-papers": { alt: "Confused person with paperwork" },
  "refused-sad": { alt: "Disappointed man sitting after a visa refusal" },
  "cta-consultant": { alt: "Friendly visa consultant at a desk with a headset" },
  "why-us": { alt: "Visa consultant meeting a client in an office" },
  "country-gb": { alt: "Tower Bridge and Big Ben in London — UK visit visa from Pakistan" },
  "country-ca": { alt: "Toronto skyline — Canada visa from Pakistan" },
  "country-us": { alt: "New York skyline — USA visa from Pakistan" },
  "country-au": { alt: "Sydney Opera House — Australia visa from Pakistan" },
  "country-nz": { alt: "Milford Sound, New Zealand — visa from Pakistan" },
  "country-eu": { alt: "Paris, Rome and Athens skylines — Schengen visa from Pakistan" },
  "country-az": { alt: "Flame Towers in Baku — Azerbaijan visa for Pakistani citizens" },
  "country-th": { alt: "Bangkok temples — Thailand visa from Pakistan" },
  "country-sg": { alt: "Marina Bay in Singapore — Singapore visa from Pakistan" },
  "country-de": { alt: "German university town — study in Germany from Pakistan" },
  "study": { alt: "International students on a university campus" },
  "immigration": { alt: "Family with suitcases moving abroad" },
};
