import { LOCALE_CODES, isLocale, type Locale } from "./locales";

export { isLocale, type Locale };

// ONE config file: every brand string, contact detail, social link and opening hour lives here.
// The admin "Settings" screen overrides these values at runtime (see lib/settings.ts).
export const siteConfig = {
  name: "Visafeast",
  tagline: "Providing visa services",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: "visafeast@gmail.com",
  whatsapp: "+923076777020", // [ASK #2] placeholder until the owner confirms
  whatsappPk: "" as string,
  facebook: "https://www.facebook.com/visafeast/",
  youtubeChannel: "" as string,
  address: "Karachi · consultations online across Pakistan", // [ASK #3]
  officeHours: "Mon–Sat 10am–7pm PKT",
  ntn: "" as string,
  calcom: "visa-feast-pvus5i/15min", // [ASK #4]
  serviceFeeMode: "quote" as "exact" | "from" | "quote", // [ASK #5]
  locales: LOCALE_CODES,
  defaultLocale: "en" as const,
  logo: "/logo.jpg",
  ogImage: "/og-image.jpg",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  disclaimer:
    "Visafeast is a private consultancy, not an embassy or government agency. Visa decisions are made only by the relevant embassy or immigration authority.",
};

export const waLink = (text?: string, number: string = siteConfig.whatsapp) =>
  `https://wa.me/${number.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
