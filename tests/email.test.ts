import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

describe("owner and client emails", () => {
  it("the logo always loads from the public website, even when sent from a computer's localhost", async () => {
    const { emailShell } = await import("../lib/server/notify");
    const html = emailShell("<p>hello</p>");
    expect(html).toContain("https://www.visafeast.com/brand/email-header.png");
    expect(html).not.toMatch(/localhost|127\.0\.0\.1/);
    expect(html).toContain('height="78"'); // a blocked picture keeps a tidy 78px bar instead of a giant box
  });
  it("test runs on a computer never send real emails", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    process.env.RESEND_API_KEY = "re_test_not_real";
    const { notifyOwner, sendEmail } = await import("../lib/server/notify");
    expect(await notifyOwner("subject", "<p>x</p>")).toBe(true);
    expect(await sendEmail("someone@example.com", "subject", "<p>x</p>")).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
