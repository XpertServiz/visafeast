import en from "@/messages/en.json";
import ur from "@/messages/ur.json";
import ar from "@/messages/ar.json";
import de from "@/messages/de.json";
import fr from "@/messages/fr.json";
import es from "@/messages/es.json";
import zh from "@/messages/zh.json";
import hi from "@/messages/hi.json";
import tr from "@/messages/tr.json";
import it from "@/messages/it.json";
import pt from "@/messages/pt.json";
import nl from "@/messages/nl.json";
import pl from "@/messages/pl.json";
import type { Locale } from "@/config/site";
import { localeMeta } from "@/config/locales";
import { cache } from "react";

export { dirOf, lp } from "@/config/locales";
export type Dict = typeof en;

const raw: Record<Locale, unknown> = { en, ur, ar, de, fr, es, zh, hi, tr, it, pt, nl, pl };
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

/** Any text a language does not have yet falls back to English, so a page never shows a raw key or breaks. */
export function deepMerge<T>(base: T, over: unknown): T {
  if (!isObj(base) || !isObj(over)) return base;
  const out: Obj = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : v;
  return out as T;
}

const merged = new Map<Locale, Dict>();
export function getDict(locale: Locale): Dict {
  let d = merged.get(locale);
  if (!d) { d = locale === "en" ? en : deepMerge(en, raw[locale]); merged.set(locale, d); }
  return d;
}

export type T = (key: string, vars?: Record<string, string | number>) => string;

/** Returns a translate function: t("hero.h1"), or t("ui.studyIn", { country: "Canada" }) for texts with a {country} slot. */
export function getT(locale: Locale): T {
  const d = getDict(locale);
  return (key, vars) => {
    let cur: unknown = d;
    for (const part of key.split(".")) {
      if (isObj(cur) && part in cur) cur = cur[part];
      else return key;
    }
    if (typeof cur !== "string") return key;
    return vars ? cur.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : cur;
  };
}

/** Has this language's page text been written? (Pages without it fall back to English and are kept out of Google for now.) */
export const seoReady = (locale: Locale, key: string): boolean => {
  if (locale === "en") return true;
  const seo = (raw[locale] as { seo?: Record<string, unknown> }).seo;
  return Boolean(seo && seo[key]);
};

/** A home-page FAQ written by hand for this language, matched to the exact English text (edited English falls through to the automatic translator). */
export function staticFaq(locale: Locale, question: string, answer: string): { question: string; answer_md: string } | null {
  if (locale === "en") return null;
  const i = en.faqs.findIndex((f) => f.q === question && f.a === answer);
  const list = (raw[locale] as { faqs?: { q: string; a: string }[] }).faqs;
  const hit = i >= 0 ? list?.[i] : undefined;
  return hit ? { question: hit.q, answer_md: hit.a } : null;
}

// Only these parts of the language file go to the browser, to keep pages light.
const CLIENT_KEYS = ["cta", "elig", "eligQ", "decoder", "form", "book", "chat", "consent", "portal", "track", "reviews", "ui", "splash", "home"] as const;
export type ClientDict = Pick<Dict, (typeof CLIENT_KEYS)[number]>;
export const clientDict = (locale: Locale): ClientDict => {
  const d = getDict(locale);
  return Object.fromEntries(CLIENT_KEYS.map((k) => [k, d[k]])) as unknown as ClientDict;
};

/** Country name in the visitor's language, from the browser/server's own world data (nothing to translate or pay for). */
export const regionName = cache((code: string | null | undefined, locale: Locale, fallback: string): string => {
  if (locale === "en" || !code || code.length !== 2 || code.toUpperCase() === "EU") return fallback;
  try { return new Intl.DisplayNames([localeMeta(locale).intl], { type: "region" }).of(code.toUpperCase()) ?? fallback; } catch { return fallback; }
});
