// Checks automatic language, Google-facing pages, currency and the intro screen against a running site.
// Run:  BASE=http://localhost:3100 node tests/e2e/lang.live.mjs [screenshot-folder]
import { chromium } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:3100";
const SHOTS = process.argv[2];
let pass = 0, fail = 0;
const ok = (name, good, extra = "") => { if (good) pass++; else { fail++; console.log(`FAIL ${name} ${extra}`); } };

const hit = (path, headers = {}) => fetch(BASE + path, { redirect: "manual", headers });
const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const GOOGLE = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

// --- which language opens
for (const [country, lang] of [["DE", "de"], ["CN", "zh"], ["SA", "ar"], ["FR", "fr"], ["ES", "es"], ["IN", "hi"], ["TR", "tr"], ["IT", "it"], ["BR", "pt"], ["NL", "nl"], ["PL", "pl"]]) {
  const r = await hit("/", { "x-vercel-ip-country": country, "user-agent": CHROME });
  ok(`${country} redirects to /${lang}`, r.status === 307 && new URL(r.headers.get("location"), BASE).pathname === `/${lang}`, `${r.status} ${r.headers.get("location")}`);
  ok(`${country} remembers the country`, (r.headers.get("set-cookie") || "").includes(`vf_cc=${country}`));
}
for (const country of ["US", "GB", "AU"]) ok(`${country} stays English`, (await hit("/", { "x-vercel-ip-country": country, "user-agent": CHROME })).status === 200);
let r = await hit("/visit-visa", { "x-vercel-ip-country": "DE", "user-agent": CHROME });
ok("inner page keeps its path", new URL(r.headers.get("location"), BASE).pathname === "/de/visit-visa");
r = await hit("/", { "x-vercel-ip-country": "DE", "user-agent": GOOGLE });
ok("Googlebot is never redirected", r.status === 200 && /<html[^>]*lang="en"/.test(await r.text()));
r = await hit("/", { "x-vercel-ip-country": "DE", "user-agent": CHROME, cookie: "vf_lang=en" });
ok("choosing English sticks", r.status === 200);
r = await hit("/", { "x-vercel-ip-country": "US", "user-agent": CHROME, cookie: "vf_lang=de" });
ok("a chosen language sticks anywhere", r.status === 307 && new URL(r.headers.get("location"), BASE).pathname === "/de");
r = await hit("/fr", { "x-vercel-ip-country": "DE", "user-agent": CHROME });
ok("an address with a language is respected", r.status === 200);

// --- what Google sees
const STATIC = ["/visit-visa", "/study-visa", "/immigration", "/tools/eligibility", "/tools/refusal-decoder", "/book", "/contact", "/reviews", "/news"];
for (const lang of ["de", "zh", "ar", "hi", "ur"]) {
  for (const path of ["", ...STATIC]) {
    const res = await hit(`/${lang}${path}`, { "user-agent": GOOGLE });
    const html = await res.text();
    ok(`/${lang}${path} loads`, res.status === 200, String(res.status));
    ok(`/${lang}${path} lang attribute`, new RegExp(`<html[^>]*lang="${lang}"`).test(html));
    ok(`/${lang}${path} canonical`, new RegExp(`rel="canonical" href="[^"]*/${lang}${path}"`).test(html));
    ok(`/${lang}${path} has hreflang`, /hrefLang="de"/i.test(html) && /hrefLang="x-default"/i.test(html));
    ok(`/${lang}${path} is indexable`, !/name="robots" content="[^"]*noindex/.test(html));
    ok(`/${lang}${path} title differs from English`, lang === "en" || !/<title>(Visa Consultant|Visit Visas from|Client Reviews)/.test(html));
  }
}
let html = await (await hit("/de", { "user-agent": GOOGLE })).text();
ok("German text is in the page itself", html.includes("Ihr Visum, gleich beim ersten Mal richtig vorbereitet"));
ok("no English hero in German", !html.includes("Your visa, prepared right the first time"));
html = await (await hit("/zh", { "user-agent": GOOGLE })).text();
ok("Chinese text is in the page itself", html.includes("您的签证"));
html = await (await hit("/ar", { "user-agent": GOOGLE })).text();
ok("Arabic reads right to left", /<html[^>]*dir="rtl"/.test(html));
const sm = await (await hit("/sitemap.xml")).text();
for (const lang of ["de", "fr", "es", "zh", "ar", "hi", "tr", "it", "pt", "nl", "pl", "ur"]) ok(`sitemap lists /${lang}`, sm.includes(`/${lang}</loc>`));
ok("sitemap lists language versions", sm.includes('hreflang="de"') || sm.includes("hreflang=\"de\""));
const robots = await (await hit("/robots.txt")).text();
ok("robots keeps portals private in every language", robots.includes("Disallow: /de/portal") && robots.includes("Disallow: /portal"));
ok("robots points at the sitemap", /Sitemap: .*sitemap\.xml/.test(robots));
html = await (await hit("/de/portal/login", { "user-agent": GOOGLE })).text();
ok("client login stays out of Google", /name="robots" content="[^"]*noindex/.test(html));

// --- browser: intro screen, currency, switch, layout
const browser = await chromium.launch({ channel: "msedge" });
const open = async (country, viewport) => {
  const ctx = await browser.newContext({ viewport, extraHTTPHeaders: { "x-vercel-ip-country": country }, userAgent: CHROME });
  await ctx.addInitScript(() => { try { localStorage.setItem("vf_consent", "1"); } catch { /* ignore */ } });
  return ctx;
};
{
  const ctx = await open("DE", { width: 1366, height: 800 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "commit" });
  await page.waitForSelector("#vf-splash", { state: "visible", timeout: 8000 });
  ok("intro screen shows while loading", true);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/splash.png` });
  await page.waitForSelector("#vf-splash", { state: "hidden", timeout: 12000 });
  ok("intro screen leaves by itself", true);
  ok("opens in German by itself", new URL(page.url()).pathname === "/de");
  ok("switch offers EN and DE", (await page.locator('[aria-label="Language"] a').allTextContents()).join() === "EN,DE");
  await page.waitForTimeout(800);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/de-desktop.png` });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  ok("intro screen only once in a tab", !(await page.locator("#vf-splash").isVisible()));
  await page.goto(`${BASE}/visit-visa/uk-visit-visa-from-pakistan`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelectorAll(".local-price").length > 0, undefined, { timeout: 10000 }).catch(() => {});
  const prices = await page.locator(".local-price").allTextContents();
  ok("fees show an approximate euro amount", prices.length > 0 && prices.every((p) => p.includes("≈") && p.includes("€")), prices.join(" | "));
  await page.locator('[aria-label="Language"] a', { hasText: "EN" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/de"), { timeout: 10000 }).catch(() => {});
  ok("EN button opens the same page in English", new URL(page.url()).pathname === "/visit-visa/uk-visit-visa-from-pakistan", page.url());
  await page.goto(`${BASE}/`);
  ok("English stays after coming back", new URL(page.url()).pathname === "/");
  await ctx.close();
}
for (const [country, lang] of [["DE", "de"], ["CN", "zh"], ["SA", "ar"], ["IN", "hi"], ["PK", ""], ["TR", "tr"], ["PL", "pl"], ["FR", "fr"], ["ES", "es"], ["IT", "it"], ["BR", "pt"], ["NL", "nl"], ["US", ""]]) {
  const ctx = await open(country, { width: 360, height: 740 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("vf_splash", "1"); } catch { /* ignore */ } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${BASE}/${lang}`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  const wide = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(`${lang || "en"}: no sideways scroll at 360px`, wide[0] <= wide[1] + 1, wide.join("/"));
  ok(`${lang || "en"}: no page errors`, errors.length === 0, errors.join("; ").slice(0, 200));
  if (SHOTS && lang) await page.screenshot({ path: `${SHOTS}/${lang}-phone.png` });
  await ctx.close();
}
for (const lang of ["de", "zh", "ar", "hi", "pl"]) {
  const ctx = await open("US", { width: 1366, height: 800 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("vf_splash", "1"); } catch { /* ignore */ } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${lang}`, { waitUntil: "load" });
  const box = await page.evaluate(() => { const n = document.querySelector("nav.nav-inner"); return n ? [n.scrollWidth, n.clientWidth] : [0, 0]; });
  ok(`${lang}: header fits on desktop`, box[0] <= box[1] + 1, box.join("/"));
  const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  if (lang === "zh") ok("Chinese uses Chinese system fonts", /PingFang/.test(font), font);
  if (SHOTS) { await page.waitForTimeout(500); await page.screenshot({ path: `${SHOTS}/${lang}-desktop.png` }); }
  await ctx.close();
}
await browser.close();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
