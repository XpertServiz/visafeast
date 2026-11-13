// Real-database check of the Aiman lead flow, the admin screens and GPT translate-once. Creates throw-away data and removes it.
// Usage: BASE=http://localhost:3100 node tests/e2e/aiman-admin.live.mjs   (the site must run with the real .env.local)
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const BASE = process.env.BASE || "http://localhost:3100";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const tag = randomBytes(3).toString("hex");
let pass = 0, fail = 0; const ok = (n, c, x = "") => { if (c) pass++; else { fail++; console.log("FAIL", n, x); } };
const made = { leads: [], users: [] };
const post = async (body, ip = `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`) => {
  const r = await fetch(`${BASE}/api/aiman/lead`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify({ country: "PK", lang: "ur", utm: { utm_source: "facebook", utm_campaign: `t-${tag}` }, ...body }) });
  return { status: r.status, j: await r.json().catch(() => ({})) };
};
const A = (o = {}) => ({ name: `Qual ${tag}`, age: "26–35", edu: "bach", job: "salaried", salmode: "bank", travel: "west", refusal: "never", purpose: "visit", family: "alone", balNum: 40, deposits: "steady", country: "uk", ...o });

try {
  // qualified lead: partial then complete
  const p1 = await post({ step: "partial", answers: A() });
  ok("a result saves a partial lead", p1.status === 200 && p1.j.ok && p1.j.id, JSON.stringify(p1));
  const id1 = p1.j.id; made.leads.push(id1);
  let { data: r1 } = await db.from("aiman_leads").select("*").eq("id", id1).single();
  ok("partial: status qualified, no phone yet, utm kept", r1.status === "qualified" && !r1.phone && r1.utm.utm_source === "facebook" && !r1.email_sent);
  // the browser cannot force a status
  const forged = await post({ step: "partial", answers: A({ name: `Forged ${tag}`, balNum: 1 }), status: "qualified" });
  made.leads.push(forged.j.id);
  const { data: rf } = await db.from("aiman_leads").select("status").eq("id", forged.j.id).single();
  ok("a forged 'qualified' is ignored: the server decides (not qualified)", rf.status === "not_qualified");
  const bad = await post({ step: "partial", answers: A({ edu: "phd" }) }); ok("invalid answers are refused", bad.status === 422);
  const nophone = await post({ step: "complete", id: id1, answers: A(), phone: "12" }); ok("a bad WhatsApp number is refused", nophone.status === 422);
  const c1 = await post({ step: "complete", id: id1, answers: A(), phone: "0300 1234567", city: "Karachi", secs: 75 });
  ok("complete: ok", c1.status === 200 && c1.j.ok && c1.j.id === id1, JSON.stringify(c1));
  ({ data: r1 } = await db.from("aiman_leads").select("*").eq("id", id1).single());
  ok("complete: phone normalised, city, completed time", r1.phone === "+923001234567" && r1.city === "Karachi" && !!r1.completed_at);
  ok("the owner email was sent (Resend)", r1.email_sent === true, `email_sent=${r1.email_sent}`);
  const again = await post({ step: "complete", id: id1, answers: A(), phone: "0300 1234567" });
  const { data: r1b } = await db.from("aiman_leads").select("email_sent").eq("id", id1).single(); ok("completing twice does not send a second email", again.j.ok && r1b.email_sent === true);
  // not qualified lead
  const n = await post({ step: "complete", answers: A({ name: `Plan ${tag}`, balNum: 3, deposits: "big" }), phone: "+4915112345678", city: "Berlin", country: "DE" });
  made.leads.push(n.j.id);
  const { data: rn } = await db.from("aiman_leads").select("*").eq("id", n.j.id).single();
  ok("not-qualified lead: status, subject gaps in the summary, email sent", rn.status === "not_qualified" && /Gaps:/.test(rn.p2) && rn.email_sent === true);
  const hp = await post({ step: "partial", answers: A(), website: "http://spam" }); ok("honeypot: bots get a quiet 'ok' and nothing is saved", hp.j.ok && !hp.j.id);
  let limited = 0; for (let i = 0; i < 16; i++) { const x = await post({ step: "partial", answers: A({ name: `Rate ${tag}` }) }, "10.99.99.99"); if (x.status === 429) limited++; else if (x.j.id) made.leads.push(x.j.id); }
  ok("the lead endpoint is rate limited per IP", limited >= 1, `${limited} refused`);

  // admin screens with a temporary staff login
  const email = `aiman-staff-${tag}@example.com`, pw = `Staff-${tag}-123`;
  const { data: su } = await db.auth.admin.createUser({ email, password: pw, email_confirm: true }); made.users.push(su.user.id);
  await db.from("profiles").insert({ id: su.user.id, full_name: "E2E Staff", role: "consultant" });
  const b = await chromium.launch({ channel: "msedge" }); const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } }); const p = await ctx.newPage();
  await p.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" }); await p.fill("#em", email); await p.fill("#pw", pw); await p.locator("button[type=submit]").click(); await p.waitForURL(/\/admin$/, { timeout: 45000 });
  await p.goto(`${BASE}/admin/aiman-leads`, { waitUntil: "domcontentloaded" });
  const t = await p.innerText("body");
  ok("admin menu has Aiman leads", t.includes("Aiman leads"));
  ok("list shows both leads with badges and a NEW tag", t.includes(`Qual ${tag}`) && t.includes(`Plan ${tag}`) && t.includes("QUALIFIED") && t.includes("NOT YET QUALIFIED") && t.includes("NEW"));
  await p.goto(`${BASE}/admin/aiman-leads?status=not_qualified&q=${tag}`, { waitUntil: "domcontentloaded" });
  const f = await p.innerText("body"); ok("filter by status and search works", f.includes(`Plan ${tag}`) && !f.includes(`Qual ${tag}`), `plan:${f.includes(`Plan ${tag}`)} qual:${f.includes(`Qual ${tag}`)} :: ${f.replace(/\s+/g, " ").slice(0, 300)}`);
  await p.goto(`${BASE}/admin/aiman-leads/${id1}`, { waitUntil: "domcontentloaded" });
  const d = await p.innerText("body"); ok("detail shows the summary paragraphs and answers", d.includes("Recommended action: call within 24 hours") && d.includes("Karachi") && d.includes("balNum"), `rec:${d.includes("Recommended action: call within 24 hours")} kar:${d.includes("Karachi")} bal:${d.includes("balNum")} :: ${d.replace(/\s+/g, " ").slice(0, 400)}`);
  await p.locator("button", { hasText: "Mark as contacted" }).click(); await p.waitForTimeout(1500);
  const { data: rc } = await db.from("aiman_leads").select("contacted,seen").eq("id", id1).single(); ok("opening clears NEW, 'Mark as contacted' works", rc.contacted === true && rc.seen === true);
  const csv = await ctx.request.get(`${BASE}/admin/aiman-leads/export?q=${tag}`);
  const body = await csv.text(); ok("CSV export works and has both leads", csv.status() === 200 && body.includes(`Qual ${tag}`) && body.includes(`Plan ${tag}`) && body.split("\n")[0].includes("created_at"));
  const anon = await (await b.newContext()).request.get(`${BASE}/admin/aiman-leads/export`, { maxRedirects: 0 }); ok("CSV is staff only", anon.status() === 401);
  // funds: change in Settings, and the server uses it
  await db.from("profiles").update({ role: "owner" }).eq("id", su.user.id);
  await p.goto(`${BASE}/admin/settings`, { waitUntil: "domcontentloaded" });
  ok("Settings has the Aiman funds card", (await p.innerText("body")).includes("Aiman funds"));
  await p.fill('input[name="v_uk"]', "50"); await p.locator("button", { hasText: "Save funds" }).click(); await p.waitForTimeout(2000);
  const { data: st } = await db.from("aiman_settings").select("funds").eq("id", 1).single(); ok("saving funds stores the figure", st.funds?.visit?.uk === 50, JSON.stringify(st.funds).slice(0, 80));
  const raised = await post({ step: "partial", answers: A({ name: `Funds ${tag}`, balNum: 40 }) }); made.leads.push(raised.j.id);
  const { data: rr } = await db.from("aiman_leads").select("status").eq("id", raised.j.id).single(); ok("the server now needs 50 lacs for the UK: 40 is not enough", rr.status === "not_qualified");
  await db.from("aiman_settings").update({ funds: {} }).eq("id", 1); // back to the defaults
  await b.close();

  // GPT translate-once: first visit shows English and starts it, a later visit shows the saved translation
  await db.from("chat_cache").delete().eq("q_hash", "aiman-ui:ja:v1");
  await fetch(`${BASE}/talk-with-aiman?geo=JP`);
  let ja = null; for (let i = 0; i < 40 && !ja; i++) { await new Promise((r) => setTimeout(r, 3000)); const { data } = await db.from("chat_cache").select("answer").eq("q_hash", "aiman-ui:ja:v1").maybeSingle(); if (data) ja = JSON.parse(data.answer); }
  ok("GPT translated the page once and it was saved", !!ja && Object.keys(ja).length > 120, ja ? `${Object.keys(ja).length} rows` : "no translation");
  if (ja) { console.log("sample:", ja.q_edu, "|", ja.u_send); ok("placeholders survived", /\{name\}/.test(ja.q_age ?? "")); }
  const html = await (await fetch(`${BASE}/talk-with-aiman?geo=JP`)).text(); ok("the next visitor from Japan gets the saved translation", ja ? html.includes(ja.q_name.slice(0, 8)) : false);
} catch (e) { fail++; console.log("FAIL stopped early:", e.message.split("\n")[0]); }
finally {
  if (made.leads.length) await db.from("aiman_leads").delete().in("id", made.leads.filter(Boolean));
  await db.from("aiman_leads").delete().like("name", `%${tag}`);
  await db.from("chat_cache").delete().eq("q_hash", "aiman-ui:ja:v1");
  for (const u of made.users) { await db.from("profiles").delete().eq("id", u); await db.auth.admin.deleteUser(u); }
  console.log(`${pass} passed, ${fail} failed. Test data removed.`); process.exit(fail ? 1 : 0);
}
