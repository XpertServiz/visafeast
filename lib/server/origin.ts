import "server-only";
import type { NextRequest } from "next/server";

/** The visitor's country from the hosting edge (the IP address itself is never read or stored). null = unknown, or Pakistan (the default content). */
export function originCountry(req: NextRequest): string | null {
  const raw = (req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(raw) || raw === "XX" || raw === "T1" || raw === "PK") return null;
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    const n = dn.of(raw);
    return n && n !== raw && n !== dn.of("ZZ") ? raw : null;
  } catch { return null; }
}

const name = (cc: string, loc: string) => { try { return new Intl.DisplayNames([loc], { type: "region" }).of(cc) ?? null; } catch { return null; } };
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const NOTE = {
  en: "Note: the details above are the official ones for applicants from Pakistan. Requirements can differ for {country}, so WhatsApp us for your case.",
  ur: "نوٹ: اوپر کی تفصیلات پاکستان سے درخواست دینے والوں کے لیے سرکاری معلومات ہیں۔ {country} کے لیے شرائط مختلف ہو سکتی ہیں، اس لیے اپنے کیس کے لیے ہمیں واٹس ایپ کریں۔",
};

/** "UK Visit Visa from Pakistan" becomes "UK Visit Visa from Saudi Arabia" for a visitor there. With `facts`, adds one honest line. */
export function withOrigin(text: string, cc: string, locale: string, facts = false): string {
  let out = text;
  for (const loc of new Set([locale === "ur" ? "ur" : "en", "en"])) {
    const to = name(cc, loc), from = name("PK", loc);
    if (to && from) out = out.replace(new RegExp(`(?<!\\p{L})${esc(from)}(?!\\p{L})`, "gu"), to);
  }
  if (!facts) return out;
  const country = name(cc, locale === "ur" ? "ur" : "en");
  return country ? `${out}\n\n${(locale === "ur" ? NOTE.ur : NOTE.en).replace("{country}", country)}` : out;
}
