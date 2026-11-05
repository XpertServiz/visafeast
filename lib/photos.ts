// Photo slots (brief §4 Imagery). Fill `src` (a file in /public/photos or a Supabase Storage URL) once a royalty-free photo
// is chosen; keep licence + credit here AND in the `media` table. Until then <Photo/> shows the "Photo coming soon" placeholder.
export interface PhotoDef { src?: string; alt: string; alt_ur?: string; credit?: string; sourceUrl?: string; licence?: string }

/** The Visafeast guide (owner-supplied images, brand character: never a real client). Small cut-outs with see-through backgrounds. */
export const GUIDE = {
  happy: { src: "/photos/guide-happy.webp", width: 443, height: 720 },
  sad: { src: "/photos/guide-sad.webp", width: 366, height: 440 },
  face: { src: "/photos/guide-face.webp", width: 128, height: 128 },
} as const;
const owner = { licence: "Owner-supplied" };

export const PHOTOS: Record<string, PhotoDef> = {
  "hero-traveller": { src: GUIDE.happy.src, alt: "Smiling Visafeast guide welcoming visitors", ...owner },
  "step-call": { alt: "Woman smiling during a phone call with a visa consultant" },
  "step-documents": { alt: "Passport and visa documents laid out on a desk" },
  "step-fly": { alt: "View from an aeroplane window" },
  "eligibility": { alt: "Young man thinking about his visa chances with a phone" },
  "decoder": { src: "/photos/guide-sad-letter.webp", alt: "Worried woman reading a visa refusal letter", ...owner },
  "refused-bank": { src: GUIDE.sad.src, alt: "Worried woman checking a bank statement", ...owner },
  "refused-papers": { src: GUIDE.sad.src, alt: "Worried woman reading her visa documents", ...owner },
  "refused-sad": { src: GUIDE.sad.src, alt: "Sad woman reading a visa refusal letter", ...owner },
  "cta-consultant": { src: "/photos/guide-happy-bust.webp", alt: "Smiling Visafeast guide", ...owner },
  "why-us": { src: GUIDE.happy.src, alt: "Smiling Visafeast guide", ...owner },
  // Reviews section: only a real client's own photo, shared with their consent. Never a stock face (brief §4).
  "review-client-1": { alt: "A Visafeast client" },
  "review-client-2": { alt: "A Visafeast client" },
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
