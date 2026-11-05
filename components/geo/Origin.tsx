"use client";
import { useSyncExternalStore } from "react";

/**
 * Where the visitor is, from the small `vf_cc` cookie the site sets from the visitor's country (no IP address is read or stored).
 * The server always sends the Pakistan version, so search engines and cached pages stay the same for everyone; this swaps the
 * country name in the browser. null = unknown or Pakistan = leave everything as it is.
 */
const none = () => () => {};
const read = (): string | null => {
  try {
    const cc = document.cookie.match(/(?:^|; )vf_cc=([A-Z]{2})/)?.[1];
    return cc && cc !== "PK" && regionName(cc, "en") ? cc : null;
  } catch { return null; }
};
export const useOrigin = () => useSyncExternalStore(none, read, () => null);

const names = new Map<string, Intl.DisplayNames | null>();
/** Country name in the language of the page the visitor is reading. */
export function regionName(cc: string, locale = "en"): string | null {
  let dn = names.get(locale);
  if (dn === undefined) { try { dn = new Intl.DisplayNames([locale], { type: "region" }); } catch { dn = null; } names.set(locale, dn); }
  try { const n = dn?.of(cc); return n && n !== cc && n !== dn?.of("ZZ") ? n : null; } catch { return null; }
}
const pageLocale = () => (typeof document !== "undefined" && document.documentElement.lang) || "en";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Replaces the word "Pakistan" with the visitor's country, e.g. "Australia Visit Visa from Saudi Arabia". Pages in other languages
 *  still carry some English text, so both the page's language and English are handled, each with its own spelling. */
export function OriginText({ text }: { text: string }) {
  const cc = useOrigin();
  if (!cc) return <>{text}</>;
  let out = text;
  for (const loc of [...new Set([pageLocale(), "en"])]) {
    const to = regionName(cc, loc), from = regionName("PK", loc);
    if (to && from) out = out.replace(new RegExp(`(?<!\\p{L})${esc(from)}(?!\\p{L})`, "gu"), to);
  }
  return <>{out}</>;
}

/** The "KHI" end of a route strip becomes the visitor's country code. */
export function OriginCode({ fallback }: { fallback: string }) {
  const cc = useOrigin();
  return <>{cc ?? fallback}</>;
}

/** One honest line under the title when the visitor is not in Pakistan. `text` has a {country} slot. */
export function OriginNote({ text, tone = "dark" }: { text: string; tone?: "dark" | "light" }) {
  const cc = useOrigin();
  if (!cc) return null;
  const country = regionName(cc, pageLocale());
  if (!country) return null;
  return (
    <p role="note" style={{ margin: "14px 0 0", maxWidth: 720, fontSize: 15, lineHeight: 1.5, color: tone === "dark" ? "var(--on-navy)" : "var(--muted)", borderInlineStart: "3px solid var(--amber)", paddingInlineStart: 12 }}>
      {text.replace("{country}", country)}
    </p>
  );
}
