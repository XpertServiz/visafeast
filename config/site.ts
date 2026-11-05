// ONE config file: every brand string, contact detail, social link and opening hour lives here.
// The admin "Settings" screen overrides these values at runtime (see lib/settings.ts).
export const siteConfig = {
  name: "Visafeast",
  tagline: "Providing visa services",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: "visafeast@gmail.com",
  whatsapp: "+16479662297", // [ASK #2] placeholder until the owner confirms
  whatsappPk: "" as string,
  facebook: "https://www.facebook.com/visafeast/",
  youtubeChannel: "" as string,
  address: "Karachi · consultations online across Pakistan", // [ASK #3]
  officeHours: "Mon–Sat 10am–7pm PKT",
  ntn: "" as string,
  calcom: "visafeast/15min", // [ASK #4]
  serviceFeeMode: "quote" as "exact" | "from" | "quote", // [ASK #5]
  locales: ["en", "ur"] as const,
  defaultLocale: "en" as const,
  logo: "/logo.jpg",
  disclaimer:
    "Visafeast is a private consultancy, not an embassy or government agency. Visa decisions are made only by the relevant embassy or immigration authority.",
};

export type Locale = (typeof siteConfig.locales)[number];
export const isLocale = (v: string): v is Locale => (siteConfig.locales as readonly string[]).includes(v);

export const waLink = (text?: string, number: string = siteConfig.whatsapp) =>
  `https://wa.me/${number.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
