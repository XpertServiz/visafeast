// Usage: node scripts/screenshots.mjs <baseUrl> <outDir>   — uses the installed Edge/Chrome (no browser download).
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const base = process.argv[2] || "http://localhost:3056";
const out = process.argv[3] || "screenshots";
mkdirSync(out, { recursive: true });
const pages = [["home", "/"], ["uk", "/visit-visa/uk-visit-visa-from-pakistan"], ["urdu-home", "/ur"], ["eligibility", "/tools/eligibility"]];
const browser = await chromium.launch({ channel: "msedge" }).catch(() => chromium.launch({ channel: "chrome" }));
const problems = [];
for (const [w, h, tag] of [[1366, 900, "desktop"], [360, 740, "phone"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") problems.push(`${tag} console: ${m.text().slice(0, 160)}`); });
  page.on("pageerror", (e) => problems.push(`${tag} pageerror: ${e.message.slice(0, 160)}`));
  for (const [name, path] of pages) {
    await page.goto(base + path, { waitUntil: "load" });
    await page.evaluate(() => { try { sessionStorage.setItem("vf_splash", "1"); localStorage.setItem("vf_consent", "1"); } catch {} });
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(1800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) problems.push(`${tag} ${path}: horizontal overflow ${overflow}px`);
    await page.screenshot({ path: `${out}/${name}-${tag}.png`, fullPage: name === "home" && tag === "phone" ? false : false });
  }
  await ctx.close();
}
await browser.close();
console.log(problems.length ? problems.join("\n") : "No console errors or horizontal overflow.");
