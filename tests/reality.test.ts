import { describe, expect, it } from "vitest";
import { bannedIn, offerRisk, publishErrors, reviewDue, sourceUrlOk, type RcInput } from "@/lib/reality";
import { BANNED_WORDS, FOOTER_NOTE, OFFER_RULES } from "@/config/reality-check";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const good: RcInput = {
  slug: "x", title: "T", claim: "C", country: "Norway", type: "study", verdict: "partly_true", summary: "S", what_true: "", what_misleading: "", what_missing: "",
  rows: [{ claim: "a", rule: "b", verdict: "true" }], checklist: ["one"], sources: [{ title: "UDI", url: "https://www.udi.no/en/want-to-apply/studies/" }], verified_on: "2026-11-25", ur_summary: null, status: "draft",
};

describe("publish rules", () => {
  it("passes a complete post", () => expect(publishErrors(good)).toEqual([]));
  it("blocks a post with no official source link", () => expect(publishErrors({ ...good, sources: [] }).join(" ")).toMatch(/official source/));
  it("blocks social media links as sources", () => {
    for (const u of ["https://www.facebook.com/x", "https://youtu.be/abc", "https://wa.me/92300", "http://www.udi.no/"]) expect(sourceUrlOk(u)).toBe(false);
    expect(publishErrors({ ...good, sources: [{ title: "x", url: "https://www.instagram.com/p/1" }] }).length).toBeGreaterThan(0);
  });
  it("blocks a missing verdict", () => expect(publishErrors({ ...good, verdict: "" as never }).join(" ")).toMatch(/verdict/));
  it("blocks every banned word, in any field", () => {
    for (const w of ["guaranteed", "100%", "approved", "scam", "fraud", "fake", "Guaranteed"]) {
      expect(publishErrors({ ...good, summary: `This is ${w} here` }).join(" "), w).toMatch(/Remove these words/);
      expect(publishErrors({ ...good, rows: [{ claim: "a", rule: `it is ${w}`, verdict: "true" }] }).length, w).toBeGreaterThan(0);
    }
  });
  it("does not trip on harmless words", () => { expect(bannedIn("Fakeer approvedly scampi")).toEqual([]); expect(bannedIn("a 100 % result")).toEqual(["100%"]); });
  it("blocks a name from the do-not-name list", () => expect(publishErrors({ ...good, summary: "Sky Visa Agency says" }, ["sky visa agency"]).join(" ")).toMatch(/name/));
});

describe("review due", () => {
  it("is due after 90 days, not before", () => {
    const now = Date.parse("2026-11-25T00:00:00Z");
    expect(reviewDue("2026-08-27", now)).toBe(false);
    expect(reviewDue("2026-08-26", now)).toBe(true);
  });
});

describe("check an offer", () => {
  it("is low with nothing ticked, medium and high as weights grow", () => {
    expect(offerRisk([]).risk).toBe("low");
    expect(offerRisk(["pressure", "too-good"]).risk).toBe("medium");
    expect(offerRisk(["pay-first", "personal-account"]).risk).toBe("high");
    expect(offerRisk(OFFER_RULES.map((r) => r.id)).risk).toBe("high");
  });
});

describe("wording on the public pages", () => {
  const files: string[] = [];
  const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); } };
  walk("components/reality"); walk("app/[locale]/reality-check");
  it("uses no banned word in the page copy, and the footer note has none either", () => {
    expect(bannedIn(FOOTER_NOTE)).toEqual([]);
    for (const f of files) for (const w of BANNED_WORDS.filter((x) => x !== "100%")) expect(new RegExp(`\\b${w.replace("%", "")}\\b`, "i").test(readFileSync(f, "utf8").replace(/BANNED_WORDS/g, "")), `${f}: ${w}`).toBe(false);
  });
  it("seed post has no banned word", () => {
    const sql = readFileSync("supabase/migrations/0012_reality_check.sql", "utf8").split("insert into reality_checks")[1];
    expect(bannedIn(sql)).toEqual([]);
  });
  it("seed post is a draft", () => expect(readFileSync("supabase/migrations/0012_reality_check.sql", "utf8")).toMatch(/null, 'draft'\)/));
});
