import { describe, expect, it } from "vitest";
import { answerFromSite, buildKb, cacheKey, detectCountryCode, detectTopic, distance, near, searchKb, withEnglishHints, words } from "../lib/chatbot";
import { SEED_COUNTRIES, SEED_FAQS, SEED_UK_FAQS } from "../lib/seed";
import type { Country } from "../lib/types";
import { guideCountry, IMMIGRATION_GUIDES, WORK_GUIDES } from "../lib/guides";

const now = new Date("2026-11-05");
const canada = SEED_COUNTRIES.find((c) => c.slug === "canada-visit-visa-from-pakistan")!;
// same facts as the live database, so these tests read like real questions
const countries: Country[] = SEED_COUNTRIES.map((c) => (c.slug === canada.slug ? { ...c, embassy_fee_text: "CAD 100 per person", processing_time_text: "Varies by country", facts_last_checked: "2026-11-05" } : c));
const kb = buildKb([...SEED_FAQS, ...SEED_UK_FAQS], countries, "en");
const ask = (q: string, extra: { lastCountry?: string; locale?: "en" | "ur" } = {}) => answerFromSite(q, { kb, countries, locale: "en", now, ...extra });

describe("understands spelling mistakes", () => {
  it("measures typing distance", () => {
    expect(distance("canada", "canda", 2)).toBe(1);
    expect(distance("fees", "fese", 2)).toBe(1); // swapped letters count once
    expect(near("fee", "free")).toBe(false);
    expect(near("us", "uk")).toBe(false);
  });
  it.each([["canda", "CA"], ["cannada", "CA"], ["kanada", "CA"], ["austrailia", "AU"], ["germny", "DE"], ["singapor", "SG"], ["shengen", "EU"], ["englnd", "GB"], ["uk", "GB"], ["امریکہ", "US"], ["برطانیہ", "GB"]])("%s means %s", (typed, code) => {
    expect(detectCountryCode(words(typed))).toBe(code);
  });
  it.each([["fess", "fee"], ["coast", "fee"], ["kitni", "fee"], ["documnets", "documents"], ["kagzat", "documents"], ["procesing", "time"], ["blance", "funds"], ["refuzed", "refusal"], ["فیس", "fee"]])("%s means the %s topic", (typed, topic) => {
    expect(detectTopic(words(typed))).toBe(topic);
  });
});

describe("answers from website content, for free", () => {
  it("gives the real fee, even with typos and Roman Urdu", () => {
    for (const q of ["canada visa fee", "cannada vissa fess", "canda ki fees kitni hai", "کینیڈا ویزا فیس"]) {
      const a = ask(q);
      expect(a.kind, q).toBe("facts");
      expect(a.answer, q).toContain("CAD 100");
      expect(a.link, q).toContain("canada-visit-visa");
    }
  });
  it("never invents a fee: an unconfirmed one says Being verified", () => {
    const a = ask("usa visa fee");
    expect(a.kind).toBe("facts");
    expect(a.answer).toMatch(/Being verified/);
    expect(a.answer).not.toMatch(/\$\s?\d|USD \d/);
  });
  it("treats facts older than 90 days as unknown", () => {
    const old = answerFromSite("canada fee", { kb, countries, locale: "en", now: new Date("2027-06-01") });
    expect(old.answer).toMatch(/Being verified/);
  });
  it("remembers the country for a follow-up question", () => {
    const first = ask("canada fee");
    const next = ask("and documents?", { lastCountry: first.country });
    expect(next.kind).toBe("facts");
    expect(next.country).toBe(canada.slug);
  });
  it("picks the study guide when the question is about studying", () => {
    expect(ask("study in germany bank balance").country).toBe("study-in-germany-from-pakistan");
    expect(ask("student visa canada").country).toBe("study-in-canada-from-pakistan");
  });
  it("asks which country when it needs to know", () => {
    const a = ask("what is the fee?");
    expect(a.kind).toBe("clarify");
    expect(a.suggest).toContain("UK");
  });
  it("never promises a visa", () => {
    const a = ask("will you guarantee my visa?");
    expect(a.answer).toMatch(/guarantee/i);
    expect(a.link).toContain("eligibility");
  });
  it("handles greetings, thanks and asking for a person", () => {
    expect(ask("salam").kind).toBe("smalltalk");
    expect(ask("shukriya").kind).toBe("smalltalk");
    expect(ask("i want to talk to a consultant").link).toContain("/book");
    expect(ask("how do i upload my documents portal").link).toContain("/portal");
  });
  it("Urdu visitors get Urdu links and labels", () => {
    const a = answerFromSite("canada fee", { kb: buildKb([], countries, "ur"), countries, locale: "ur", now });
    expect(a.link).toMatch(/^\/ur\//);
    expect(a.answer).toContain("سرکاری فیس");
  });
  it("does not pretend to know unrelated things: GPT or a person takes over", () => {
    expect(ask("what is the best biryani recipe in lahore").kind).toBe("none");
  });
  it("finds site content despite typos", () => {
    const hits = searchKb("refusal letter decodr", kb);
    expect(hits[0].doc.link).toContain("refusal-decoder");
  });
  it("words in a different order or with typing noise reuse the same saved answer", () => {
    expect(cacheKey("Do I need insurance for travel?", "en")).toBe(cacheKey("insurance travel need", "en"));
    expect(cacheKey("insurance", "en")).not.toBe(cacheKey("insurance", "ur"));
  });
});

describe("questions in the website's other languages", () => {
  it.each(["Kanada Gebühr", "frais visa Canada", "tasa visado Canadá", "加拿大 签证费", "رسوم تأشيرة كندا", "कनाडा वीज़ा फ़ीस", "Kanada vize ücreti", "opłata wiza Kanada"])("%s finds the Canada fee", (q) => {
    const a = ask(withEnglishHints(q));
    expect(a.kind, q).toBe("facts");
    expect(a.answer, q).toContain("CAD 100");
  });
});

describe("work permits (pages built from lib/guides/work.ts)", () => {
  // the chat route adds the Immigration and Work permit pages to the database countries, exactly like this
  const all: Country[] = [...countries, ...IMMIGRATION_GUIDES.map((g) => guideCountry(g, "en", "immigration")), ...WORK_GUIDES.map((g) => guideCountry(g, "en", "work"))];
  const kbAll = buildKb([...SEED_FAQS, ...SEED_UK_FAQS], all, "en");
  const askAll = (q: string) => answerFromSite(q, { kb: kbAll, countries: all, locale: "en", now });
  it.each([
    ["germany opportunity card", "/work-permit/germany-work-visa-from-pakistan"],
    ["uk work visa", "/work-permit/uk-work-visa-from-pakistan"],
    ["canada work permit", "/work-permit/canada-work-permit-from-pakistan"],
    ["japan job", "/work-permit/japan-work-visa-from-pakistan"],
    ["dubai naukri", "/work-permit/uae-work-visa-from-pakistan"],
    ["جرمنی نوکری", "/work-permit/germany-work-visa-from-pakistan"],
  ])("%s → %s", (q, link) => {
    const a = askAll(q);
    expect(a.link).toBe(link);
    expect(a.answer).toMatch(/•/); // lists the routes
  });
  it("a German question about work finds the German page", () => {
    expect(answerFromSite(withEnglishHints("Arbeitsvisum Deutschland"), { kb: kbAll, countries: all, locale: "en", now }).link).toBe("/work-permit/germany-work-visa-from-pakistan");
  });
  it("'how does it work' is not a work permit question", () => {
    expect(askAll("uk visa how does it work").link).not.toMatch(/work-permit/);
  });
  it("a country with only an immigration page falls back to it", () => {
    expect(askAll("malaysia work permit").link).toBe("/immigration/immigrate-to-malaysia-from-pakistan");
  });
  it.each([
    ["australia work visa", "/work-permit/australia-work-visa-from-pakistan"],
    ["france talent card", "/work-permit/france-work-visa-from-pakistan"],
    ["korea eps job", "/work-permit/south-korea-work-visa-from-pakistan"],
    ["saudi work visa", "/work-permit/saudi-arabia-work-visa-from-pakistan"],
  ])("%s → %s", (q, link) => { expect(askAll(q).link).toBe(link); });
  it("every work route figure comes with an official source and a read date", () => {
    for (const g of WORK_GUIDES) {
      expect(g.sources.length).toBeGreaterThan(0);
      expect(g.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const o of g.options) expect(o.url, `${g.name}: ${o.name}`).toMatch(/^https:\/\//);
    }
  });
});

describe("step-by-step process: the bot invites an enquiry", () => {
  const all: Country[] = [...countries, ...WORK_GUIDES.map((g) => guideCountry(g, "en", "work"))];
  const kbAll = buildKb([...SEED_FAQS, ...SEED_UK_FAQS], all, "en");
  const askAll = (q: string, locale: "en" | "ur" = "en") => answerFromSite(q, { kb: kbAll, countries: all, locale, now });
  it.each(["step by step process for uk visa", "how do I apply for canada visa", "what is the procedure for germany opportunity card", "uk visa process", "canada visa kaise apply karein"])("%s", (q) => {
    const a = askAll(q);
    expect(a.link).toBe("/book");
    expect(a.answer).toMatch(/enquiry/i);
    expect(a.answer).toMatch(/representative will contact you/i);
  });
  it("a question with no country is answered the same way", () => {
    const a = askAll("tell me the step by step process");
    expect(a.link).toBe("/book");
    expect(a.country).toBeUndefined();
  });
  it("Urdu gets the Urdu message", () => {
    const a = askAll("مرحلہ وار طریقہ کار", "ur");
    expect(a.link).toBe("/ur/book");
    expect(a.answer).toMatch(/انکوائری/);
  });
  it("fee, documents and time questions still get their facts", () => {
    expect(askAll("uk visa fee").link).toMatch(/visit-visa/);
    expect(askAll("canada documents").link).toMatch(/visit-visa/);
    expect(askAll("france visa fee").answer).not.toMatch(/guarantee/i); // "france" is two letters from "chance"
  });
});
