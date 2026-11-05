import { describe, expect, it } from "vitest";
import { automated, automatedSessions, inHub } from "@/lib/bots";

describe("robot spotting", () => {
  it("lets ordinary visitors through", () => {
    expect(automated({ lang: "en-US", os: "Windows", screen: "1920x1080" })).toBeNull();
    expect(automated({ lang: "ur-PK", os: "Android", screen: "360x800" })).toBeNull();
    expect(automated({ lang: "en-GB", os: "iOS", screen: "393x852" })).toBeNull();
    expect(automated({ lang: "en", os: "iOS", screen: "820x1180" })).toBeNull(); // 820 wide, under the desktop cut
  });
  it("refuses automation, server languages and phones with desktop screens", () => {
    expect(automated({ lang: "en-US", webdriver: true })).toBe("automation");
    expect(automated({ lang: "en-US@posix", os: "iOS", screen: "1920x1080" })).toBe("server language");
    expect(automated({ lang: "" })).toBe("server language");
    expect(automated({ lang: "en-US", os: "Android", screen: "1366x768" })).toBe("phone with a desktop screen");
  });
  it("does not judge what it was not told", () => {
    expect(automated({})).toBeNull();
    expect(automated({ os: "Windows" })).toBeNull();
  });
  it("knows data-centre cities", () => {
    expect(inHub("Ashburn")).toBe(true);
    expect(inHub(" san jose ")).toBe(true);
    expect(inHub("Karachi")).toBe(false);
    expect(inHub(null)).toBe(false);
  });
  it("flags a one-page data-centre visit but never a person who read two pages and stayed", () => {
    const bots = automatedSessions([
      { session_id: "a", city: "Ashburn", os: "Linux", lang: "en-US", screen: "1366x768" },
      { session_id: "b", city: "Ashburn", os: "Windows", lang: "en-US", screen: "1920x1080", duration_ms: 20000 },
      { session_id: "b", city: "Ashburn", os: "Windows", lang: "en-US", screen: "1920x1080", duration_ms: 9000 },
      { session_id: "c", city: "Karachi", os: "Windows", lang: "en-US", screen: "1920x1080" },
      { session_id: "d", city: "Lima", os: "iOS", lang: "en-US@posix", screen: "1920x1080" },
    ]);
    expect([...bots].sort()).toEqual(["a", "d"]);
  });
});
