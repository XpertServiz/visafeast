// Real checks: admin Checklists tab + staff PDFs, the visitor's checklist PDF from an Aiman lead, and the chatbot's "Talk with Aiman" pointer.
// Usage: BASE=http://localhost:3100 node tests/e2e/checklists.live.mjs   (needs the real .env.local)
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const BASE = process.env.BASE || "http://localhost:3100";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const tag = randomBytes(3).toString("hex");
let pass = 0, fail = 0; const ok = (n, c, x = "") => { if (c) pass++; else { fail++; console.log("FAIL", n, x); } };
const made = { user: null, lead: null };
const isPdf = async (r) => { const b = Buffer.from(await r.body()); return r.status() === 200 && /pdf/.test(r.headers()["content-type"] ?? "") && b.subarray(0, 4).toString() === "%PDF" && b.length > 3000; };
try {
  const email = `chk-${tag}@example.com`, pw = `Staff-${tag}-123`;
  const { data: su } = await db.auth.admin.createUser({ email, password: pw, email_confirm: true }); made.user = su.user.id;
  await db.from("profiles").insert({ id: su.user.id, full_name: "E2E Staff", role: "consultant" });
  const b = await chromium.launch({ channel: "msedge" }); const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } }); const p = await ctx.newPage();
  await p.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" }); await p.fill("#em", email); await p.fill("#pw", pw); await p.locator("button[type=submit]").click(); await p.waitForURL(/\/admin$/, { timeout: 45000 });
  await p.goto(`${BASE}/admin/checklists`, { waitUntil: "domcontentloaded" });
  const t = await p.innerText("body");
  ok("admin menu has Checklists", t.includes("Checklists"));
  ok("the tab lists all countries and the four services", ["France", "New Zealand", "Portugal", "Ireland", "Germany", "Visit", "Study", "Work permit", "Immigration"].every((x) => t.includes(x)));
  ok("one PDF button per country and service (23 x 4)", (await p.locator('a[href^="/admin/checklists/pdf"]').count()) === 92);
  for (const [k, c] of [["visit", "uk"], ["study", "germany"], ["work", "germany"], ["immigration", "canada"], ["work", "japan"]]) {
    const r = await ctx.request.get(`${BASE}/admin/checklists/pdf?kind=${k}&c=${c}`);
    ok(`staff PDF ${k} / ${c} is a real PDF`, await isPdf(r), `status ${r.status()}`);
  }
  const anon = await (await b.newContext()).request.get(`${BASE}/admin/checklists/pdf?kind=work&c=germany`, { maxRedirects: 0 });
  ok("the staff PDF needs a login", anon.status() === 401, `status ${anon.status()}`);
  const bad = await ctx.request.get(`${BASE}/admin/checklists/pdf?kind=work&c=mars`); ok("an unknown country is refused", bad.status() === 404);

  // visitor's checklist: only after finishing the Aiman chat (the link carries the lead id)
  const lead = await fetch(`${BASE}/api/aiman/lead`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "10.77.77.77" }, body: JSON.stringify({ step: "complete", country: "PK", answers: { name: `Chk ${tag}`, age: "26–35", edu: "bach", job: "salaried", salmode: "bank", travel: "west", refusal: "never", purpose: "work", family: "alone", english: "ok", exp: "5plus", offer: "yes", balNum: 30, deposits: "steady", countries: ["germany"], phone: "03001234567", email: "c@example.com" } }) });
  const lj = await lead.json(); made.lead = lj.id; ok("an Aiman lead was saved", lj.ok && lj.id, JSON.stringify(lj));
  ok("visitor PDF works with the lead id", await isPdf(await ctx.request.get(`${BASE}/api/aiman/checklist?lead=${lj.id}&c=germany`)));
  const nolead = await ctx.request.get(`${BASE}/api/aiman/checklist?lead=00000000-0000-4000-8000-000000000000&c=germany`); ok("no lead, no PDF", nolead.status() === 404);
  await b.close();

  // chatbot
  for (const q of ["what are the fees for germany opportunity card", "germany opportunity card documents checklist"]) {
    const r = await (await fetch(`${BASE}/api/chat`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `10.88.${Math.floor(Math.random() * 250)}.1` }, body: JSON.stringify({ message: q, locale: "en" }) })).json();
    ok(`chatbot "${q}" points to Talk with Aiman`, r.link === "/talk-with-aiman" && /Talk with Aiman/.test(r.answer) && !/can't provide|cannot provide/i.test(r.answer), `${r.link} | ${String(r.answer).slice(-90)}`);
  }
} catch (e) { fail++; console.log("FAIL stopped early:", e.message.split("\n")[0]); }
finally {
  if (made.lead) await db.from("aiman_leads").delete().eq("id", made.lead);
  await db.from("aiman_leads").delete().like("name", `%${tag}`);
  if (made.user) { await db.from("profiles").delete().eq("id", made.user); await db.auth.admin.deleteUser(made.user); }
  console.log(`${pass} passed, ${fail} failed. Test data removed.`); process.exit(fail ? 1 : 0);
}
