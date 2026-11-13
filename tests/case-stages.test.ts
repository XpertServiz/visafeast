import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { BRANCH_STAGES, CASE_STAGES, isOutcome, stageKey } from "../lib/case-stages";
import { buildTimeline, nextStep } from "../lib/track";

const sql = readFileSync("supabase/migrations/0009_client_files.sql", "utf8");
const tpl = CASE_STAGES.map((c, i) => ({ stage: c.stage, label_en: c.en, label_ur: c.ur, sort: i + 1 }));

describe("file statuses", () => {
  it("the database migration has exactly the statuses in the code, in the same order", () => {
    for (const c of CASE_STAGES) expect(sql, c.stage).toContain(`('${c.stage}', '${c.en}', '${c.ur}', ${CASE_STAGES.indexOf(c) + 1})`);
  });
  it("includes every status the owner asked for", () => {
    const en = CASE_STAGES.map((c) => c.en.toLowerCase()).join(" | ");
    for (const w of ["file received", "scrutinised", "documents missing", "reminder sent", "missing documents received", "case preparation", "case submission", "case submitted", "awaiting embassy", "case approved", "case refused"]) expect(en).toContain(w);
  });
  it("every status has its own plain-language next step in English and Urdu", () => {
    const generic = nextStep("nonsense", "en");
    for (const c of CASE_STAGES) { expect(nextStep(c.stage, "en"), c.stage).not.toBe(generic); expect(nextStep(c.stage, "ur").length).toBeGreaterThan(10); }
  });
  it("results close a file; ordinary statuses do not", () => {
    expect(["approved", "refused", "withdrawn"].every(isOutcome)).toBe(true);
    expect(isOutcome("case_submitted")).toBe(false);
  });
  it("a new status name becomes a safe key", () => {
    expect(stageKey("Interview booked!")).toBe("interview_booked");
    expect(stageKey("  ")).toBe("");
    expect(stageKey("Visa; drop table")).toBe("visa_drop_table");
  });
});

describe("what the client sees under Track my file", () => {
  const names = (current: string) => buildTimeline(tpl, current, "en").map((s) => s.stage);
  it("side steps are hidden until the file is on them", () => {
    expect(names("case_preparation")).not.toContain("docs_missing");
    expect(names("case_preparation")).not.toContain("refused");
    expect(names("docs_missing")).toContain("docs_missing");
    expect(names("refused")).toContain("refused");
  });
  it("steps before the current one are done, the current one is marked, later ones are to do", () => {
    const t = buildTimeline(tpl, "case_preparation", "en");
    expect(t.find((s) => s.stage === "file_received")!.state).toBe("done");
    expect(t.find((s) => s.stage === "case_preparation")!.state).toBe("current");
    expect(t.find((s) => s.stage === "awaiting_embassy")!.state).toBe("todo");
  });
  it("the side steps are exactly the ones named in the code", () => {
    expect([...BRANCH_STAGES].sort()).toEqual(["docs_missing", "missing_received", "refused", "reminder_sent", "withdrawn"]);
  });
});
