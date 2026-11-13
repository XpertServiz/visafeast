import { describe, expect, it } from "vitest";
import { KEEP_DAYS, capBytes, daysLeft, isDue, uploadAllowed, usedPercent, warnToday, wasRemoved } from "../lib/storage-policy";

const now = new Date("2026-11-13T10:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

describe("free-storage rules", () => {
  it("a file is kept 60 days and then due", () => {
    expect(KEEP_DAYS).toBe(60);
    expect(isDue(ago(59), now)).toBe(false);
    expect(isDue(ago(60), now)).toBe(true);
    expect(isDue(ago(90), now)).toBe(true);
    expect(daysLeft(ago(0), now)).toBe(60);
  });
  it("each file is announced exactly once, a week before", () => {
    const days = Array.from({ length: 61 }, (_, d) => d).filter((d) => warnToday(ago(d + 0.01), now));
    expect(days).toEqual([53]);
  });
  it("uploads pause when the cap would be passed, not before", () => {
    const cap = 100 * 1024 * 1024;
    expect(uploadAllowed(cap - 1000, 1000, cap)).toBe(true);
    expect(uploadAllowed(cap - 999, 1000, cap)).toBe(false);
  });
  it("the cap defaults to 900 MB, is changeable, and can never be set tiny", () => {
    expect(capBytes(undefined)).toBe(900 * 1024 * 1024);
    expect(capBytes("500")).toBe(500 * 1024 * 1024);
    expect(capBytes("1")).toBe(50 * 1024 * 1024);
    expect(usedPercent(450 * 1024 * 1024, capBytes("900"))).toBe(50);
  });
  it("a document row without a file but with an upload date was removed by the clean-up", () => {
    expect(wasRemoved({ file_path: null, uploaded_at: ago(70) })).toBe(true);
    expect(wasRemoved({ file_path: "a/b/c.pdf", uploaded_at: ago(1) })).toBe(false);
    expect(wasRemoved({ file_path: null, uploaded_at: null })).toBe(false);
  });
});
