import { describe, expect, it } from "vitest";
import { PROCESSES } from "../lib/guides/process";
import { WORK_GUIDES } from "../lib/guides";

describe("admin step-by-step guides (staff only)", () => {
  it("every work permit page has a guide, and every guide belongs to a page", () => {
    expect(PROCESSES.map((p) => p.slug).sort()).toEqual(WORK_GUIDES.map((g) => g.slug).sort());
  });
  it.each(PROCESSES.map((p) => [p.slug, p] as const))("%s: steps are complete and every link is a real web address", (_slug, p) => {
    expect(p.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(p.steps.length).toBeGreaterThanOrEqual(3);
    for (const st of p.steps) {
      expect(st.title.length).toBeGreaterThan(3);
      expect(st.detail.length).toBeGreaterThan(20);
      for (const l of st.links) expect(() => new URL(l.url)).not.toThrow(), expect(l.url).toMatch(/^https:\/\//);
    }
    // somewhere in the guide the client can start the application
    expect(p.steps.some((st) => st.links.some((l) => l.apply))).toBe(true);
  });
  it("the public pages never show these steps", async () => {
    const { readFileSync } = await import("node:fs");
    for (const f of ["components/country/CountryPage.tsx", "lib/chatbot.ts"]) expect(readFileSync(f, "utf8")).not.toMatch(/guides\/process|PROCESSES/);
  });
});
