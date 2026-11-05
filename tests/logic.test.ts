import { describe, expect, it } from "vitest";
import { QUESTIONS, bandOf, score, MAX_SCORE } from "../lib/eligibility";
import { decodeByRules, scrub } from "../lib/decoder-rules";
import { contrast } from "../lib/themes";
import { parseFeed, isRelevant } from "../lib/server/news";
import { SEED_REVIEWS, SEED_COUNTRIES } from "../lib/seed";

describe("eligibility scoring (brief §8.1)", () => {
  it("max score is 13 and bands are correct", () => {
    const best = QUESTIONS.map((q) => q.opts.reduce((bi, o, i) => (o.pts > q.opts[bi].pts ? i : bi), 0));
    expect(score(best)).toBe(MAX_SCORE);
    expect(bandOf(13)).toBe("strong"); expect(bandOf(10)).toBe("strong");
    expect(bandOf(9)).toBe("moderate"); expect(bandOf(6)).toBe("moderate");
    expect(bandOf(5)).toBe("needs"); expect(bandOf(0)).toBe("needs");
  });
});

describe("refusal decoder (zero-cost mode)", () => {
  it("finds funds and ties reasons, in English and Urdu", () => {
    const text = "You have not provided sufficient funds and I am not satisfied you intend to return to your home country.";
    const en = decodeByRules(text, "en"); const ur = decodeByRules(text, "ur");
    expect(en.points.map((p) => p.heading)).toEqual(expect.arrayContaining(["Funds or source of money", "Ties to Pakistan"]));
    expect(ur.points.length).toBe(en.points.length);
  });
  it("scrubs identifiers before anything is sent", () => {
    const s = scrub("Ref GWF123456789 passport AB1234567 mail a@b.com call +92 300 1234567");
    expect(s).not.toMatch(/GWF123456789|AB1234567|a@b\.com|1234567/);
  });
  it("flags sensitive letters for a consultant/lawyer", () => {
    expect(decodeByRules("you used false documents and face a ban", "en").honest_view).toMatch(/consultant or lawyer/);
  });
});

describe("misc", () => {
  it("accent colour contrast helper", () => { expect(contrast("#000000", "#ffffff")).toBeGreaterThan(20); expect(contrast("#F2A93B", "#0A1A33")).toBeGreaterThan(4.5); });
  it("parses Atom and RSS and filters relevance", () => {
    const atom = `<feed><entry><title>UK visa fee changes</title><link href="https://gov.uk/x"/><updated>2026-10-01T00:00:00Z</updated><summary>New visitor visa fees</summary></entry></feed>`;
    const items = parseFeed(atom);
    expect(items[0].url).toBe("https://gov.uk/x"); expect(isRelevant(items[0])).toBe(true);
    const rss = `<rss><channel><item><title>Fuel excise update</title><link>https://x.y/z</link></item></channel></rss>`;
    expect(isRelevant(parseFeed(rss)[0])).toBe(false);
  });
  it("seed data never contains reviews and unknown facts stay null (brief §0.3, §9.6)", () => {
    expect(SEED_REVIEWS).toHaveLength(0);
    const ca = SEED_COUNTRIES.find((c) => c.slug === "canada-visit-visa-from-pakistan")!;
    expect(ca.embassy_fee_text).toBeNull(); expect(ca.processing_time_text).toBeNull();
    const uk = SEED_COUNTRIES.find((c) => c.slug === "uk-visit-visa-from-pakistan")!;
    expect(uk.embassy_fee_text).toContain("£135"); expect(uk.facts_last_checked).toBe("2026-10-23");
  });
});

import { buildTimeline, last4Matches, nextStep, normRef, validRef } from "../lib/track";

describe("client file tracker", () => {
  it("validates references and matches only the last 4 digits of the phone", () => {
    expect(validRef(" vf-1042 ")).toBe(true);
    expect(normRef(" vf-1042 ")).toBe("VF-1042");
    expect(validRef("1042; drop table")).toBe(false);
    expect(last4Matches("+92 300 1234567", "4567")).toBe(true);
    expect(last4Matches("+92 300 1234567", "4568")).toBe(false);
    expect(last4Matches(null, "4567")).toBe(false);
    expect(last4Matches("+923001234567", "567")).toBe(false);
  });
  it("builds a done/current/todo timeline", () => {
    const tl = buildTimeline([{ stage: "b", label_en: "B", label_ur: "ب", sort: 2 }, { stage: "a", label_en: "A", label_ur: "ا", sort: 1 }, { stage: "c", label_en: "C", label_ur: "ج", sort: 3 }], "b", "en");
    expect(tl.map((x) => x.state)).toEqual(["done", "current", "todo"]);
    expect(nextStep("submitted", "en").length).toBeGreaterThan(10);
  });
});

describe("refusal decoder word boundaries", () => {
  it("does not treat 'properties' or 'parties' as the ties reason", () => {
    const r = decodeByRules("The properties of the parties involved were reviewed in this letter about your application and nothing else.", "en");
    expect(r.points).toEqual([]);
  });
});

import { cleanUrdu, localizeCountry } from "../lib/country-ur";
describe("Urdu overlay never changes facts", () => {
  const uk = SEED_COUNTRIES.find((c) => c.slug.startsWith("uk-visit"))!;
  it("keeps English when there is no Urdu draft", () => { expect(localizeCountry(uk, "ur")).toEqual({ ...uk, translated: false }); });
  it("uses Urdu text only where the structure matches, and never touches fees or dates", () => {
    const draft = { h1: "برطانیہ ویزا", intro: "تعارف", documents: [{ title: "پاسپورٹ" }], steps: uk.steps.map((s) => ({ title: "مرحلہ", detail: s.detail })) };
    const ur = localizeCountry({ ...uk, content_ur: draft }, "ur");
    expect(ur.h1).toBe("برطانیہ ویزا");
    expect(ur.documents).toEqual(uk.documents); // wrong length → ignored, English kept
    expect(ur.steps.length).toBe(uk.steps.length);
    expect(ur.embassy_fee_text).toBe(uk.embassy_fee_text);
    expect(ur.facts_last_checked).toBe(uk.facts_last_checked);
    expect(localizeCountry({ ...uk, content_ur: draft }, "en").h1).toBe(uk.h1);
    expect(cleanUrdu("garbage", uk)).toEqual(expect.objectContaining({ h1: undefined }));
  });
});

import { clientMayUpload, hashCode, newCode, normCode, pathFor, pathIsTheirs, safeFileName, uploadProblem } from "../lib/portal";
describe("client portal rules", () => {
  it("only allows the right file types and sizes", () => {
    expect(uploadProblem("application/pdf", 1000)).toBeNull();
    expect(uploadProblem("image/jpeg", 10 * 1024 * 1024)).toBeNull();
    expect(uploadProblem("image/jpeg", 10 * 1024 * 1024 + 1)).toMatch(/10 MB/);
    expect(uploadProblem("text/html", 100)).toMatch(/PDF/);
    expect(uploadProblem("application/x-msdownload", 100)).toMatch(/PDF/);
    expect(uploadProblem("image/png", 0)).toMatch(/empty/);
  });
  it("a storage path must belong to this client and this document", () => {
    const uuid = "11111111-1111-1111-1111-111111111111";
    const good = pathFor("p1", "d1", uuid, "application/pdf");
    expect(good).toBe(`p1/d1/${uuid}.pdf`);
    expect(pathIsTheirs(good, "p1", "d1")).toBe(true);
    expect(pathIsTheirs(good, "p2", "d1")).toBe(false);
    expect(pathIsTheirs(good, "p1", "d2")).toBe(false);
    expect(pathIsTheirs(`p1/d1/../../p2/d9/${uuid}.pdf`, "p1", "d1")).toBe(false);
    expect(pathIsTheirs("p1/d1/evil.html", "p1", "d1")).toBe(false);
  });
  it("cleans file names and codes", () => {
    expect(safeFileName("../../etc/passwd")).toBe("passwd");
    expect(safeFileName("C:\\Users\\me\\passport scan.pdf")).toBe("passport scan.pdf");
    expect(safeFileName("<script>.pdf")).toBe("script.pdf");
    const c = newCode();
    expect(c).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
    expect(hashCode(c.toLowerCase())).toBe(hashCode(c));
    expect(normCode(" ab-cd ")).toBe("ABCD");
  });
  it("an approved document cannot be replaced by the client", () => {
    expect(clientMayUpload("approved")).toBe(false);
    expect(clientMayUpload("rejected")).toBe(true);
    expect(clientMayUpload("missing")).toBe(true);
  });
});
