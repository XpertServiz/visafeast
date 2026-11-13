// Checks the Work permits section: hub, a country page, the homepage tab, the menu on wide screens in long languages, and the assistant.
// Usage: BASE=http://localhost:3100 node tests/e2e/work.live.mjs [screenshot folder]
import { chromium } from "playwright";
const S = process.argv[2] || "test-results";
const BASE = process.env.BASE || "http://localhost:3100";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
let pass = 0, fail = 0;
const ok = (name, cond, info = "") => { if (cond) pass++; else { fail++; console.log("FAIL", name, info); } };

const b = await chromium.launch();
for (const [name, w, h] of [["desk", 1280, 900], ["phone", 360, 780]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, userAgent: UA, extraHTTPHeaders: { "x-vercel-ip-country": "US" } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("vf_splash_seen", "1"); sessionStorage.setItem("vf_splash", "1"); } catch { /* ignore */ } });
  const p = await ctx.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));

  let r = await p.goto(`${BASE}/work-permit`, { waitUntil: "load" });
  ok(`${name}: hub opens`, r.status() === 200, String(r.status()));
  ok(`${name}: hub lists 14 countries`, (await p.locator('a.card[href^="/work-permit/"]').count()) === 14, String(await p.locator('a.card[href^="/work-permit/"]').count()));
  ok(`${name}: hub no sideways scroll`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await p.screenshot({ path: `${S}/work-hub-${name}.png`, fullPage: false });

  r = await p.goto(`${BASE}/work-permit/germany-work-visa-from-pakistan`, { waitUntil: "load" });
  ok(`${name}: Germany page opens`, r.status() === 200);
  const text = await p.locator("#options").locator("xpath=..").innerText();
  ok(`${name}: Opportunity Card shown`, text.includes("Opportunity Card (Chancenkarte)"));
  ok(`${name}: Opportunity Card figures shown`, text.includes("€1,027 per month") && text.includes("€75"));
  ok(`${name}: canonical is the English page`, (await p.locator('link[rel="canonical"]').getAttribute("href"))?.endsWith("/work-permit/germany-work-visa-from-pakistan"));
  ok(`${name}: Germany page no sideways scroll`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await p.locator("#options").scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${S}/work-de-${name}.png`, fullPage: false });

  r = await p.goto(`${BASE}/de/work-permit/uk-work-visa-from-pakistan`, { waitUntil: "load" });
  ok(`${name}: German version of an English-only page is noindex`, (await p.locator('meta[name="robots"]').getAttribute("content"))?.includes("noindex"));

  await p.goto(`${BASE}/`, { waitUntil: "load" });
  await p.locator("#tab-work").click();
  ok(`${name}: homepage Work tab shows cards`, (await p.locator('#panel-work a[href^="/work-permit/"]').count()) >= 14);
  ok(`${name}: homepage no sideways scroll`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await p.locator("#visas").scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${S}/work-tab-${name}.png`, fullPage: false });
  ok(`${name}: no page errors`, errors.length === 0, errors.join("; ").slice(0, 200));
  await ctx.close();
}

// The menu must stay on one line on a laptop screen in the longest languages.
for (const [lang, width] of ["", "de", "fr", "es", "pt", "pl", "it", "nl", "tr", "ar", "ur", "zh", "hi"].flatMap((l) => [[l, 1024], [l, 1280], [l, 1440]])) {
  const ctx = await b.newContext({ viewport: { width, height: 800 }, userAgent: UA });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("vf_splash_seen", "1"); sessionStorage.setItem("vf_splash", "1"); } catch { /* ignore */ } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/${lang}`, { waitUntil: "load" });
  // one line = the text of every visible menu link and of the Book button sits on a single line
  const lines = await p.locator('nav[aria-label="Main"]').evaluate((n) => [...n.querySelectorAll(".hide-sm a, a.btn-primary")].filter((a) => a.getBoundingClientRect().width > 0).map((a) => { const r = document.createRange(); r.selectNodeContents(a); return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size; }));
  ok(`${lang || "en"}: menu fits on one line at ${width}px`, lines.every((n) => n <= 1), lines.join(","));
  ok(`${lang || "en"}: no sideways scroll at ${width}px`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  if (!lang || lang === "fr") await p.screenshot({ path: `${S}/nav-${lang || "en"}-${width}.png`, clip: { x: 0, y: 0, width, height: 90 } });
  await ctx.close();
}

// The assistant answers work questions from the new pages.
for (const [q, link] of [["germany opportunity card", "/work-permit/germany-work-visa-from-pakistan"], ["uk work visa fee", "/work-permit/uk-work-visa-from-pakistan"], ["dubai naukri", "/work-permit/uae-work-visa-from-pakistan"]]) {
  const res = await fetch(`${BASE}/api/chat`, { method: "POST", headers: { "content-type": "application/json", "user-agent": UA }, body: JSON.stringify({ message: q, locale: "en" }) });
  const j = await res.json();
  ok(`assistant: "${q}"`, j.link === link, `${j.link} | ${String(j.answer).slice(0, 80)}`);
  if (q === "germany opportunity card") console.log("\nAssistant says:\n" + j.answer + "\n");
}

const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
ok("sitemap lists the work hub", sm.includes("/work-permit</loc>"));
ok("sitemap lists 14 work pages", (sm.match(/\/work-permit\/[a-z-]+<\/loc>/g) || []).length === 14);
await b.close();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
