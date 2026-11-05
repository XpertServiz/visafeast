import {
  Fraunces, Inter, IBM_Plex_Mono, Noto_Nastaliq_Urdu, Sora, Playfair_Display, DM_Serif_Display,
  Plus_Jakarta_Sans, Poppins, Manrope, DM_Sans, Noto_Naskh_Arabic, Gulzar,
} from "next/font/google";

// next/font requires LITERAL options in every call (no spreads / shared objects).
export const fraunces = Fraunces({ display: "swap", subsets: ["latin"], variable: "--f-fraunces", weight: ["500", "600", "700"] });
export const inter = Inter({ display: "swap", subsets: ["latin"], variable: "--f-inter", weight: ["400", "500", "600"] });
export const plex = IBM_Plex_Mono({ display: "swap", subsets: ["latin"], variable: "--f-plex", weight: ["500", "600"] });
export const nastaliq = Noto_Nastaliq_Urdu({ display: "swap", subsets: ["arabic"], variable: "--f-nastaliq", weight: ["500", "700"] });
const sora = Sora({ display: "swap", subsets: ["latin"], variable: "--f-sora", weight: ["600", "700"], preload: false });
const playfair = Playfair_Display({ display: "swap", subsets: ["latin"], variable: "--f-playfair", weight: ["600", "700"], preload: false });
const dmSerif = DM_Serif_Display({ display: "swap", subsets: ["latin"], variable: "--f-dmserif", weight: ["400"], preload: false });
const jakarta = Plus_Jakarta_Sans({ display: "swap", subsets: ["latin"], variable: "--f-jakarta", weight: ["400", "600", "700"], preload: false });
const poppins = Poppins({ display: "swap", subsets: ["latin"], variable: "--f-poppins", weight: ["400", "600", "700"], preload: false });
const manrope = Manrope({ display: "swap", subsets: ["latin"], variable: "--f-manrope", weight: ["400", "600"], preload: false });
const dmSans = DM_Sans({ display: "swap", subsets: ["latin"], variable: "--f-dmsans", weight: ["400", "600"], preload: false });
const naskh = Noto_Naskh_Arabic({ display: "swap", subsets: ["arabic"], variable: "--f-naskh", weight: ["500", "700"], preload: false });
const gulzar = Gulzar({ display: "swap", subsets: ["arabic"], variable: "--f-gulzar", weight: ["400"], preload: false });

const VAR: Record<string, string> = {
  Fraunces: "--f-fraunces", Sora: "--f-sora", "Playfair Display": "--f-playfair", "DM Serif Display": "--f-dmserif",
  "Plus Jakarta Sans": "--f-jakarta", Poppins: "--f-poppins", Inter: "--f-inter", Manrope: "--f-manrope", "DM Sans": "--f-dmsans",
  "Noto Nastaliq Urdu": "--f-nastaliq", "Noto Naskh Arabic": "--f-naskh", Gulzar: "--f-gulzar",
};

export const fontClassNames = [fraunces, inter, plex, nastaliq, sora, playfair, dmSerif, jakarta, poppins, manrope, dmSans, naskh, gulzar]
  .map((f) => f.variable)
  .join(" ");

/** Inline style for <html>: maps the admin-selected fonts onto --font-display / --font-body / --font-urdu / --font-mono */
export function fontVars(heading: string, body: string, urdu: string): string {
  const h = VAR[heading] ?? VAR.Fraunces, b = VAR[body] ?? VAR.Inter, u = VAR[urdu] ?? VAR["Noto Nastaliq Urdu"];
  return `--font-display:var(${h});--font-body:var(${b});--font-urdu:var(${u});--font-mono:var(--f-plex)`;
}
