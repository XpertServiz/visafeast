// Browser checks for /talk-with-aiman. Usage: BASE=http://localhost:3100 node tests/e2e/aiman.live.mjs [screenshot folder]
import { chromium } from "playwright";
const BASE = process.env.BASE || "http://localhost:3100", SHOTS = process.argv[2];
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
let pass = 0, fail = 0;
const ok = (n, c, x = "") => { if (c) pass++; else { fail++; console.log("FAIL", n, x); } };
const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const open = async (geo, w = 390, h = 844) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, userAgent: UA, extraHTTPHeaders: geo ? { "x-vercel-ip-country": geo } : {} });
  const p = await ctx.newPage(); await p.goto(`${BASE}/talk-with-aiman`, { waitUntil: "load" }); await p.waitForTimeout(800); return { ctx, p };
};
const text = (p, sel) => p.locator(sel).first().innerText();

// ---- languages by visitor country
for (const [geo, want, sample] of [["PK", "اردو", "السلام علیکم"], ["SA", "العربية", "السلام عليكم"], ["DE", "Deutsch", "Ich bin Aiman"], ["GB", null, null]]) {
  const { ctx, p } = await open(geo);
  const toggle = await p.locator(".lang").count();
  if (want) {
    ok(`${geo}: language toggle offers ${want}`, toggle === 1 && (await text(p, ".lang")).includes(want), await text(p, ".lang").catch(() => ""));
    ok(`${geo}: first message shows English and the local line`, (await text(p, ".thread")).includes("I'm Aiman") && (await text(p, ".thread")).includes(sample));
  } else ok(`${geo}: English only (no toggle)`, toggle === 0 && !/[؀-ۿ]/.test(await text(p, ".thread")));
  ok(`${geo}: page is noindex`, (await p.locator('meta[name="robots"]').getAttribute("content"))?.includes("noindex"));
  await ctx.close();
}
{ // the toggle switches to local-only and is remembered
  const { ctx, p } = await open("PK");
  await p.locator(".lang button").nth(1).click(); await p.waitForTimeout(300);
  ok("PK: local-only mode hides the English line", !(await text(p, ".thread")).includes("I'm Aiman"));
  await p.reload({ waitUntil: "load" }); await p.waitForTimeout(500);
  ok("PK: the choice is remembered", !(await text(p, ".thread")).includes("I'm Aiman"));
  await ctx.close();
}

// ---- hero video: plays once, rests on the last frame, no side gaps
for (const w of [360, 390, 768, 1280]) {
  const { ctx, p } = await open("GB", w, w >= 768 ? 900 : 800);
  await p.waitForSelector("video", { timeout: 8000 });
  const info = await p.evaluate(() => { const v = document.querySelector("video"), panel = document.querySelector(".aiman"), a = v.getBoundingClientRect(), c = panel.getBoundingClientRect(); return { loop: v.loop, covers: a.left <= c.left + 1 && a.right >= c.right - 1 && a.top <= c.top + 1 && a.bottom >= c.bottom - 1, w: Math.round(c.width), h: Math.round(c.height), sideScroll: document.documentElement.scrollWidth > innerWidth + 1 }; });
  ok(`${w}px: video covers the panel (no side gaps)`, info.covers, JSON.stringify(info)); ok(`${w}px: no loop`, info.loop === false); ok(`${w}px: no sideways scroll`, !info.sideScroll);
  if (w === 360) {
    await p.waitForFunction(() => document.querySelector("video")?.ended, null, { timeout: 12000 }).catch(() => {});
    const st = await p.evaluate(() => { const v = document.querySelector("video"); return { ended: v.ended, paused: v.paused, t: v.currentTime, d: v.duration }; });
    ok("video played to the end and is paused on the last frame", st.paused && st.t >= st.d - 0.3, JSON.stringify(st));
    await p.locator(".resetbtn").click(); await p.waitForTimeout(600);
    const st2 = await p.evaluate(() => { const v = document.querySelector("video"); return { paused: v.paused, t: v.currentTime, d: v.duration }; });
    ok("reset does not replay the video", st2.paused && st2.t >= st2.d - 0.3, JSON.stringify(st2));
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/aiman-360.png` });
  }
  if (SHOTS && w === 1280) await p.screenshot({ path: `${SHOTS}/aiman-1280.png` });
  await ctx.close();
}

// ---- the whole chat, and no server call while it runs
{
  const { ctx, p } = await open("PK", 390, 844);
  const calls = []; p.on("request", (r) => { if (/\/api\//.test(r.url()) && !/\/api\/(track|presence)/.test(r.url())) calls.push(`${r.method()} ${new URL(r.url()).pathname} ${r.postData()?.includes('"step":"partial"') ? "partial" : r.postData()?.includes('"step":"complete"') ? "complete" : ""}`); });
  const tapChip = async (t) => { await p.locator(".chips button", { hasText: t }).first().click(); await p.waitForTimeout(560); };
  const type = async (t) => { await p.fill(".textrow input", t); await p.press(".textrow input", "Enter"); await p.waitForTimeout(560); };
  await tapChip("Let's start"); await type("Ali");
  for (const t of ["26–35", "Bachelor's", "Salaried job", "Bank account", "UK / Schengen", "Never refused", "Visit / Tourism", "With family", "5"]) await tapChip(t);
  await tapChip("3");
  ok("family of 5 with 3 children: asks the youngest child's age", (await text(p, ".thread")).includes("youngest child"));
  await tapChip("2–11"); await type("80"); await tapChip("Steady"); await tapChip("UK");
  await p.waitForSelector("#result", { timeout: 5000 });
  const res = await text(p, "#result");
  ok("result shows 'You qualify' and the UK program", res.includes("You qualify") && res.includes("UK Standard Visitor Visa"));
  ok("result shows the Urdu line too", /[؀-ۿ]/.test(res));
  ok("no server call during the questions (only the one partial save when the result shows)", calls.length === 1 && calls[0].includes("partial"), calls.join(" | "));
  await p.locator(".msg.me.editable", { hasText: /^5$/ }).first().click(); await p.waitForTimeout(700);
  ok("tapping an earlier answer removes the result and re-asks", (await p.locator("#result").count()) === 0 && (await text(p, ".thread")).includes("How many people in total"));
  await tapChip("2"); await tapChip("0"); await type("12"); await tapChip("Steady"); await tapChip("UK");
  ok("the sponsor question appears when the balance is short", (await text(p, ".thread")).includes("below what is usually expected"));
  await p.locator(".resetbtn").click(); await p.waitForTimeout(400);
  ok("reset clears the chat, timer and progress", (await p.locator(".msg.me").count()) === 0 && (await text(p, ".timer")).includes("0:00") && (await p.locator("#result").count()) === 0);
  ok("no sideways scroll on the phone", await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await ctx.close();
}
await b.close();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
