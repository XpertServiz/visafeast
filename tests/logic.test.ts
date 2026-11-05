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
