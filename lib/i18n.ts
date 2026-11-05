import en from "@/messages/en.json";
import ur from "@/messages/ur.json";
import type { Locale } from "@/config/site";

type Dict = typeof en;
const dicts: Record<Locale, Dict> = { en, ur: ur as unknown as Dict };

export type T = (key: string) => string;

/** Returns a translate function: t("hero.h1"). Falls back to English, then to the key. */
export function getT(locale: Locale): T {
  const get = (d: unknown, key: string): string | undefined => {
    let cur: unknown = d;
    for (const part of key.split(".")) {
      if (cur && typeof cur === "object" && part in (cur as object)) cur = (cur as Record<string, unknown>)[part];
      else return undefined;
    }
    return typeof cur === "string" ? cur : undefined;
  };
  return (key) => get(dicts[locale], key) ?? get(dicts.en, key) ?? key;
}

export const dirOf = (l: Locale) => (l === "ur" ? "rtl" : "ltr");

/** Prefix an internal path with the locale ("/ur" for Urdu, nothing for English). */
export const lp = (locale: Locale, path: string) => (locale === "ur" ? `/ur${path === "/" ? "" : path}` : path);
