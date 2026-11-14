import { describe, expect, it } from "vitest";
import { buildChecklist, COMMON, COUNTRY_CODE } from "../lib/checklists";
import { COUNTRIES, COUNTRY_IDS } from "../config/aiman";
import { answerFromSite, buildKb } from "../lib/chatbot";
import { SEED_COUNTRIES, SEED_FAQS } from "../lib/seed";
import { guideCountry, WORK_GUIDES } from "../lib/guides";

describe("checklists", () => {
  it("every country and service has a checklist, with a note", () => {
    for (const id of COUNTRY_IDS) for (const k of ["visit", "study", "work", "immigration"] as const) {
      const m = buildChecklist(k, COUNTRIES[id].en, COUNTRY_CODE[id]);
      expect(m.items.length, `${id} ${k}`).toBeGreaterThanOrEqual(6); expect(m.note.length).toBeGreaterThan(20); expect(m.title).toContain(COUNTRIES[id].en);
    }
  });
  it("a country page's own official list wins for visit and study", () => {
    const m = buildChecklist("visit", "UK", "GB", { documents: [{ title: "Official thing" }], checked: "2026-11-05" });
    expect(m.items).toEqual([{ title: "Official thing" }]); expect(m.official).toBe(true); expect(m.subtitle).toContain("2026-11-05");
  });
  it("work checklists add the items the official pages told us (Germany Opportunity Card, UK sponsorship)", () => {
    const de = buildChecklist("work", "Germany", "DE").items.map((i) => i.title).join(" | ");
    expect(de).toMatch(/anabin|Degree recognised/); expect(de).toMatch(/living costs/);
    expect(buildChecklist("work", "UK", "GB").items.map((i) => i.title).join()).toMatch(/Certificate of sponsorship/);
    expect(COMMON.work.length).toBeGreaterThan(6);
  });
  it("the chatbot sends fee and checklist questions about work permits to Talk with Aiman", () => {
    const all = [...SEED_COUNTRIES, ...WORK_GUIDES.map((g) => guideCountry(g, "en", "work"))];
    const kb = buildKb(SEED_FAQS, all, "en");
    for (const q of ["germany opportunity card fee", "germany work visa documents checklist"]) {
      const a = answerFromSite(q, { kb, countries: all, locale: "en", now: new Date("2026-11-14") });
      expect(a.link, q).toBe("/talk-with-aiman"); expect(a.answer).toMatch(/Talk with Aiman/); expect(a.answer).not.toMatch(/can't provide/i);
    }
  });
});
