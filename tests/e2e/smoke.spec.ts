import { test, expect, type Page } from "@playwright/test";

// Skip the intro animation and the cookie banner so tests see the real page.
async function open(page: Page, path: string) {
  await page.addInitScript(() => { try { sessionStorage.setItem("vf_splash", "1"); localStorage.setItem("vf_consent", "1"); } catch { /* ignore */ } });
  const res = await page.goto(path, { waitUntil: "domcontentloaded" });
  return res!;
}
const noSideScroll = async (page: Page) => {
  const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(w.sw, "page scrolls sideways").toBeLessThanOrEqual(w.cw + 1);
};

for (const [name, path] of [["home", "/"], ["UK visit visa", "/visit-visa/uk-visit-visa-from-pakistan"], ["eligibility", "/tools/eligibility"], ["track", "/track"], ["Urdu home", "/ur"]] as const) {
  test(`${name}: loads, one h1, no sideways scroll`, async ({ page }) => {
    const res = await open(page, path);
    expect(res.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await page.waitForTimeout(600);
    await noSideScroll(page);
  });
}

test("Urdu pages read right-to-left", async ({ page }) => {
  await open(page, "/ur");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ur");
});

test("a fact that is not confirmed shows the fallback, never an invented number", async ({ page }) => {
  await open(page, "/visit-visa/canada-visit-visa-from-pakistan");
  await expect(page.getByText(/Being verified/i).first()).toBeVisible();
});

test("track page never reveals whether a reference exists", async ({ request }) => {
  const a = await request.post("/api/track-case", { data: { ref: "VF-9999", last4: "0000" } });
  const b = await request.post("/api/track-case", { data: { ref: "nonsense", last4: "x" } });
  test.skip(a.status() === 429, "the hourly limit of 12 tries was used up by earlier runs from this computer");
  expect(a.status()).toBe(404);
  expect(b.status()).toBe(404);
  expect((await a.json()).error).toBe((await b.json()).error);
});

test("enquiry form rejects empty submissions", async ({ request }) => {
  const r = await request.post("/api/leads", { data: {} });
  expect(r.status()).toBeGreaterThanOrEqual(400);
});

test("admin shows no private data without a login", async ({ page }) => {
  await open(page, "/admin");
  // with no database connected it explains what is missing; with one connected it sends you to the login page
  await expect(page.getByText(/not connected|sign in|log in/i).first()).toBeVisible();
  await expect(page.getByText(/PKR/)).toHaveCount(0);
});

test("admin PDFs are refused without a login", async ({ request }) => {
  const r = await request.get("/admin/money/pdf?type=invoice&id=00000000-0000-0000-0000-000000000000");
  expect(r.status()).toBe(401);
});

test("private areas are not indexable", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/admin/);
  expect(robots).toMatch(/Disallow: \/track/);
});

test("refusal decoder answers in plain language", async ({ page }) => {
  await open(page, "/tools/refusal-decoder");
  await page.locator("textarea").first().fill("We are not satisfied that you are a genuine visitor or that you will leave the UK at the end of your visit. Your funds were not shown.");
  await page.locator("form", { has: page.locator("#dec-text") }).locator("button[type=submit]").click();
  // either the plain-language answer, or the daily free limit message: never a blank screen or a crash
  await expect(page.getByText(/funds|ties to pakistan|3 free decodes/i).first()).toBeVisible({ timeout: 15_000 });
});
