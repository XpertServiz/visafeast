import { describe, expect, it } from "vitest";
import { BOT_RE, LOCALES, currencyForCountry, dirOf, isLocale, localeForCountry, lp, splitLocale } from "../config/locales";
import { convert, formatApprox, parseMoney, roundApprox } from "../lib/currency";
import { applyRow, keepSafe, sameNumbers, sourceHash } from "../lib/translate";
import en from "../messages/en.json";
import ur from "../messages/ur.json";
import ar from "../messages/ar.json";
import de from "../messages/de.json";
import fr from "../messages/fr.json";
import es from "../messages/es.json";
import zh from "../messages/zh.json";
import hi from "../messages/hi.json";
import tr from "../messages/tr.json";
import it_ from "../messages/it.json";
import pt from "../messages/pt.json";
import nl from "../messages/nl.json";
import pl from "../messages/pl.json";

const FILES: Record<string, unknown> = { ur, ar, de, fr, es, zh, hi, tr, it: it_, pt, nl, pl };
type Obj = Record<string, unknown>;
const flat = (o: unknown, pre = ""): [string, string][] => Object.entries(o as Obj).flatMap(([k, v]) => (typeof v === "string" ? [[`${pre}${k}`, v] as [string, string]] : v && typeof v === "object" && !Array.isArray(v) ? flat(v, `${pre}${k}.`) : []));
const digits = (s: string) => (s.match(/\d+/g) ?? []).join("").split("").sort().join("");
const slots = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();

// Everything a visitor sees on the landing page and tools must be written in every language; the rest may fall back to English.
const MUST_HAVE = ["nav", "hero", "cta", "steps", "videos", "elig", "eligQ", "decoder", "problems", "why", "mid", "choose", "reviews", "whyUs", "news", "faq", "book", "form", "footer", "chat", "consent", "splash", "common", "extras", "ui", "hub"];

describe("language files", () => {
  const english = new Map(flat(en));
  it.each(Object.keys(FILES))("%s has every landing-page text", (code) => {
    const have = new Set(flat(FILES[code]).map(([k]) => k));
    const missing = [...english.keys()].filter((k) => MUST_HAVE.includes(k.split(".")[0]) && !have.has(k));
    expect(missing).toEqual([]);
  });
  it.each(Object.keys(FILES))("%s keeps every number and {slot} of the English", (code) => {
    const wrong = flat(FILES[code]).filter(([k, v]) => { const e = english.get(k); return e !== undefined && (digits(e) !== digits(v) || slots(e) !== slots(v)); }).map(([k]) => k);
    expect(wrong).toEqual([]);
  });
  it.each(Object.keys(FILES))("%s has the same FAQs and a title for the key pages", (code) => {
    const d = FILES[code] as { faqs: { q: string; a: string }[]; seo: Record<string, { t: string; d: string }> };
    expect(d.faqs).toHaveLength(en.faqs.length);
    for (const key of ["home", "hubVisit", "hubStudy", "hubImm", "eligibility", "decoder", "book", "contact", "reviews", "news"]) expect(d.seo[key]?.t, key).toBeTruthy();
  });
  it("never promises a visa in any language", () => {
    const promise = /100\s*%|guaranteed approval|garantiert genehmigt|visa garanti/i;
    for (const [code, d] of Object.entries({ en, ...FILES })) for (const [k, v] of flat(d)) expect(promise.test(v), `${code}.${k}`).toBe(false);
  });
});

describe("language from the visitor's country", () => {
  it.each([["DE", "de"], ["AT", "de"], ["CN", "zh"], ["FR", "fr"], ["ES", "es"], ["MX", "es"], ["SA", "ar"], ["AE", "ar"], ["PK", "ur"], ["IN", "hi"], ["TR", "tr"], ["IT", "it"], ["BR", "pt"], ["NL", "nl"], ["PL", "pl"], ["US", "en"], ["GB", "en"], ["AU", "en"], [null, "en"], ["XX", "en"]])("%s opens in %s", (country, lang) => {
    expect(localeForCountry(country)).toBe(lang);
  });
  it("uses the browser language to choose in countries with several languages", () => {
    expect(localeForCountry("CH", "fr-CH,fr;q=0.9")).toBe("fr");
    expect(localeForCountry("CH", "ja")).toBe("de");
    expect(localeForCountry("CA", "fr-CA")).toBe("fr");
    expect(localeForCountry("CA", "en-CA")).toBe("en");
    expect(localeForCountry("BE", "nl-BE")).toBe("nl");
  });
  it("builds and splits addresses", () => {
    expect(lp("en", "/book")).toBe("/book");
    expect(lp("de", "/")).toBe("/de");
    expect(lp("de", "/book")).toBe("/de/book");
    expect(lp("de", "/#book")).toBe("/de#book");
    expect(splitLocale("/de/book")).toEqual({ locale: "de", path: "/book" });
    expect(splitLocale("/ur")).toEqual({ locale: "ur", path: "/" });
    expect(splitLocale("/book")).toEqual({ locale: null, path: "/book" });
    expect(splitLocale("/en/book")).toEqual({ locale: null, path: "/en/book" });
    expect(splitLocale("/delivery")).toEqual({ locale: null, path: "/delivery" });
  });
  it("Arabic and Urdu read right to left", () => {
    expect(dirOf("ar")).toBe("rtl"); expect(dirOf("ur")).toBe("rtl"); expect(dirOf("de")).toBe("ltr");
    expect(isLocale("de")).toBe(true); expect(isLocale("xx")).toBe(false);
    expect(LOCALES.length).toBeGreaterThanOrEqual(13);
  });
  it("search engines are recognised, ordinary browsers are not", () => {
    expect(BOT_RE.test("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(BOT_RE.test("Mozilla/5.0 (compatible; bingbot/2.0)")).toBe(true);
    expect(BOT_RE.test("WhatsApp/2.23")).toBe(true);
    expect(BOT_RE.test("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36")).toBe(false);
    expect(BOT_RE.test("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1")).toBe(false);
  });
});

describe("fees in the visitor's money", () => {
  it.each([["CAD 100 per person", 100, "CAD"], ["from NZD 441", 441, "NZD"], ["£135", 135, "GBP"], ["€90 / €45", 90, "EUR"], ["S$30", 30, "SGD"], ["US$185", 185, "USD"], ["AUD 2,500 from 1 July 2026", 2500, "AUD"], ["PKR 25,000", 25000, "PKR"]])("reads %s", (text, amount, currency) => {
    expect(parseMoney(text)).toEqual({ amount, currency });
  });
  it("finds nothing when no amount is given, so no conversion is shown", () => {
    expect(parseMoney("Varies by country")).toBeNull();
    expect(parseMoney(null)).toBeNull();
    expect(parseMoney("15 up to 45 days")).toBeNull();
  });
  it("converts through today's rates and skips the visitor's own currency", () => {
    const rates = { USD: 1, EUR: 0.9, GBP: 0.8, PKR: 280 };
    expect(convert({ amount: 80, currency: "GBP" }, "EUR", rates)).toBeCloseTo(90);
    expect(convert({ amount: 80, currency: "GBP" }, "GBP", rates)).toBeNull();
    expect(convert({ amount: 80, currency: "ZZZ" }, "EUR", rates)).toBeNull();
    expect(roundApprox(37884)).toBe(37900);
    expect(formatApprox(155.4, "EUR", "de-DE")).toContain("155");
  });
  it("knows common currencies", () => {
    expect(currencyForCountry("DE")).toBe("EUR"); expect(currencyForCountry("CN")).toBe("CNY"); expect(currencyForCountry("PK")).toBe("PKR"); expect(currencyForCountry("??")).toBeNull();
  });
});

describe("automatic translation never changes a fact", () => {
  it("refuses a translation that changes a number", () => {
    expect(sameNumbers("Fee CAD 100, 15 days", "Gebühr CAD 100, 15 Tage")).toBe(true);
    expect(sameNumbers("Fee CAD 100", "Gebühr CAD 150")).toBe(false);
    expect(keepSafe("Fee CAD 100", "Gebühr CAD 150")).toBe("Fee CAD 100");
    expect(keepSafe("Fee CAD 100", "Gebühr CAD 100")).toBe("Gebühr CAD 100");
  });
  it("keeps English where the shape differs or text is missing", () => {
    const src = { a: "One", list: [{ title: "T1", detail: "D1" }, { title: "T2", detail: "D2" }], none: null };
    expect(keepSafe(src, { a: "Eins", list: [{ title: "X" }], none: "oops" })).toEqual({ a: "Eins", list: src.list, none: null });
    expect(keepSafe(src, "not an object")).toEqual(src);
  });
  it("ignores a translation made from older English", () => {
    const src = { h1: "Canada" };
    const row = { entity: "country", entity_id: "1", locale: "de", source_hash: sourceHash(src), content: { h1: "Kanada" } };
    expect(applyRow(src, row)).toEqual({ text: { h1: "Kanada" }, translated: true });
    expect(applyRow({ h1: "Canada visit" }, row)).toEqual({ text: { h1: "Canada visit" }, translated: false });
    expect(applyRow(src, undefined)).toEqual({ text: src, translated: false });
  });
});
