import { chromium } from "playwright";
// Usage: BASE=http://localhost:3100 node tests/e2e/video.live.mjs [screenshot folder]
const S = process.argv[2] || "test-results";
const BASE = process.env.BASE || "http://localhost:3100";
const b = await chromium.launch();
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
for (const [name, w, h] of [["desk", 1440, 900], ["phone", 360, 780]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, userAgent: UA, extraHTTPHeaders: { "x-vercel-ip-country": "US" } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("vf_splash_seen", "1"); } catch {} });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "load" });
  await p.waitForTimeout(4000);
  const sec = p.locator("#videos");
  await sec.scrollIntoViewIfNeeded(); await p.waitForTimeout(2500);
  console.log(name, "iframes before click:", await sec.locator("iframe").count(), "| eyebrow:", await sec.locator(".eyebrow").innerText());
  const img = sec.locator(".vthumb img").first();
  console.log(name, "thumb src:", decodeURIComponent((await img.getAttribute("src")) || "").slice(0, 120), "| loaded w:", await img.evaluate((e) => e.naturalWidth));
  await sec.screenshot({ path: `${S}/vid-${name}.png` });
  await sec.locator(".vthumb").first().click(); await p.waitForTimeout(3000);
  console.log(name, "iframes after click:", await sec.locator("iframe").count(), await sec.locator("iframe").first().getAttribute("src"));
  console.log(name, "page wider than screen:", await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await sec.screenshot({ path: `${S}/vid-${name}-play.png` });
  await ctx.close();
}
await b.close();
