// End-to-end check of the client portal against the REAL Supabase project. Creates a throw-away client, then removes everything it made.
// Run with the site already running:  BASE=http://localhost:3100 node tests/e2e/portal.live.mjs
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.BASE || "http://localhost:3100";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const tag = randomBytes(4).toString("hex");
const A = { name: `Test Client ${tag}`, email: `e2e-${tag}@example.com`, phone: `+9230${Math.floor(1e8 + Math.random() * 8e8)}`, password: `Pw-${tag}-12345` };
const B = { name: `Other Client ${tag}`, email: `e2eb-${tag}@example.com`, phone: `+9231${Math.floor(1e8 + Math.random() * 8e8)}`, password: `Pw-${tag}-67890` };
const results = [];
const check = (name, ok, extra = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` (${extra})` : ""}`); };
const made = { users: [], people: [], paths: [] };

const pdf = join(tmpdir(), `vf-${tag}.pdf`);
writeFileSync(pdf, "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

const browser = await chromium.launch({ channel: "msedge" });
async function session() {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { sessionStorage.setItem("vf_splash", "1"); localStorage.setItem("vf_consent", "1"); } catch { /* ignore */ } });
  return { ctx, page };
}
/** A website sign-up is only a REQUEST: no sign-in until the admin approves. */
async function signUp(page, who) {
  await page.goto(`${BASE}/portal/signup`, { waitUntil: "domcontentloaded" });
  await page.fill("#ps-n", who.name); await page.fill("#ps-e", who.email); await page.fill("#ps-w", who.phone); await page.fill("#ps-p", who.password);
  await page.locator("form.card button.btn-primary").click();
  await page.waitForFunction(() => document.body.innerText.includes("Request received"), null, { timeout: 45000 });
}
async function signIn(page, who) {
  await page.goto(`${BASE}/portal/login`, { waitUntil: "domcontentloaded" });
  await page.fill("#pl-e", who.email); await page.fill("#pl-p", who.password);
  await page.locator("form.card button.btn-primary").click();
  await page.waitForURL(/\/portal$/, { timeout: 45000 });
}
const approve = (id) => db.from("people").update({ portal_status: "approved" }).eq("id", id);

try {
  // --- client A signs up
  const a = await session();
  await signUp(a.page, A);
  check("a sign-up shows 'Request received' and does not sign the client in", /\/portal\/signup/.test(a.page.url()));
  const { data: pa } = await db.from("people").select("id,auth_user_id,portal_status").eq("email", A.email).single();
  made.people.push(pa.id); made.users.push(pa.auth_user_id);
  check("the request is saved as pending", pa.portal_status === "pending", pa.portal_status);
  await a.page.goto(`${BASE}/portal`, { waitUntil: "domcontentloaded" });
  check("a pending client cannot open the portal", /\/portal\/login/.test(a.page.url()), a.page.url());
  await a.page.fill("#pl-e", A.email); await a.page.fill("#pl-p", A.password);
  await a.page.locator("form.card button.btn-primary").click();
  await a.page.waitForFunction(() => document.body.innerText.includes("waiting for approval"), null, { timeout: 20000 });
  check("signing in while pending says it is waiting for approval", true);
  const pendDl = await a.ctx.request.post(`${BASE}/api/portal/upload-url`, { data: { title: "Sneaky", mime: "application/pdf", size: 100 } });
  check("a pending client cannot upload", pendDl.status() === 401, `status ${pendDl.status()}`);
  await approve(pa.id);
  await signIn(a.page, A);
  await a.page.waitForSelector("h1");
  check("after approval the client signs in and lands on My file", (await a.page.textContent("h1")).includes("My file"));
  check("no sideways scroll at 360px", await a.page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));

  // --- client A uploads a document that isn't on a checklist
  const det = a.page.locator("details", { has: a.page.locator("#od-t") });
  if (!(await det.evaluate((e) => e.open))) await det.locator("summary").click();
  await a.page.selectOption("#od-s", "work");
  await a.page.fill("#od-t", "Bank statement");
  await a.page.locator("details input[type=file]").setInputFiles(pdf);
  await a.page.waitForFunction(() => document.body.innerText.includes("We are checking"), null, { timeout: 30000 });
  const { data: doc } = await db.from("case_documents").select("id,status,file_path,file_name,person_id").eq("person_id", pa.id).single();
  made.paths.push(doc.file_path);
  check("upload reaches private storage and the database", doc.status === "uploaded" && !!doc.file_path, doc.file_name);
  const { data: fileA } = await db.from("cases").select("id,ref,service_type,stage").eq("person_id", pa.id);
  check("the first upload opens the client's file with a Client ID", fileA?.length === 1 && /^VF-\d{3,7}$/.test(fileA[0].ref), fileA?.[0]?.ref);
  check("the file is a work permit file at 'File received'", fileA?.[0]?.service_type === "work" && fileA?.[0]?.stage === "file_received");
  const { data: docFull } = await db.from("case_documents").select("case_id").eq("id", doc.id).single();
  check("the document is attached to that file", docFull.case_id === fileA?.[0]?.id);
  await a.page.reload({ waitUntil: "domcontentloaded" });
  check("the client sees their Client ID and 'File received' under Track my file", (await a.page.textContent("body")).includes(fileA[0].ref) && (await a.page.textContent("body")).includes("File received"));

  // --- client A sends a chat message
  await a.page.locator("#chat textarea").fill("Hello, I sent my bank statement.");
  await a.page.locator("#chat button.btn-primary").click();
  await a.page.waitForFunction(() => document.querySelector("#chat")?.innerText.includes("I sent my bank statement"), null, { timeout: 15000 });
  const { count: mc } = await db.from("client_messages").select("id", { count: "exact", head: true }).eq("person_id", pa.id);
  check("client message is saved", mc === 1);

  // --- A can download their own file
  const own = await a.ctx.request.get(`${BASE}/api/portal/doc/${doc.id}`, { maxRedirects: 0 });
  check("client can download their own file", own.status() === 302);

  // --- client B must NOT reach A's things
  const b = await session();
  await signUp(b.page, B);
  const { data: pb } = await db.from("people").select("id,auth_user_id").eq("email", B.email).single();
  made.people.push(pb.id); made.users.push(pb.auth_user_id);
  await approve(pb.id);
  await signIn(b.page, B);
  // a third person asks for an account and is left waiting, so the admin can approve them from Client files
  const R = { name: `Waiting Client ${tag}`, email: `e2er-${tag}@example.com`, phone: `+9233${Math.floor(1e8 + Math.random() * 8e8)}`, password: `Pw-${tag}-r1234` };
  const rr = await session();
  await signUp(rr.page, R);
  const { data: pr } = await db.from("people").select("id,auth_user_id").eq("email", R.email).single();
  made.people.push(pr.id); made.users.push(pr.auth_user_id);
  const steal = await b.ctx.request.get(`${BASE}/api/portal/doc/${doc.id}`, { maxRedirects: 0 });
  check("another client CANNOT download it", steal.status() === 404, `status ${steal.status()}`);
  const stealUp = await b.ctx.request.post(`${BASE}/api/portal/upload-url`, { data: { doc_id: doc.id, mime: "application/pdf", size: 100 } });
  check("another client CANNOT replace it", stealUp.status() === 404, `status ${stealUp.status()}`);
  const stealDone = await b.ctx.request.post(`${BASE}/api/portal/upload-done`, { data: { doc_id: doc.id, path: doc.file_path, file_name: "x.pdf" } });
  check("another client CANNOT claim it", stealDone.status() === 404, `status ${stealDone.status()}`);
  const bMsgs = await (await b.ctx.request.get(`${BASE}/api/portal/messages`)).json();
  check("another client CANNOT read the chat", bMsgs.messages.length === 0);
  const bPage = await b.page.content();
  check("another client's page shows none of it", !bPage.includes("Bank statement") && !bPage.includes(A.name));

  // --- a client is locked out of admin
  const adminAsClient = await b.ctx.request.get(`${BASE}/admin/docs/${doc.id}`, { maxRedirects: 0 });
  check("a client CANNOT use the staff download", adminAsClient.status() === 401, `status ${adminAsClient.status()}`);
  const adminMsgs = await b.ctx.request.get(`${BASE}/api/admin/messages?person=${pa.id}`);
  check("a client CANNOT use the staff chat", adminMsgs.status() === 401, `status ${adminMsgs.status()}`);
  await b.page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  check("a client is sent to the admin login", /\/admin\/login/.test(b.page.url()), b.page.url());

  // --- no login at all
  const anon = await browser.newContext();
  const anonDoc = await anon.request.get(`${BASE}/api/portal/doc/${doc.id}`, { maxRedirects: 0 });
  check("no login: file refused", anonDoc.status() === 401);
  const publicFile = await anon.request.get(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/case-documents/${doc.file_path}`);
  check("the storage bucket is not public", publicFile.status() >= 400, `status ${publicFile.status()}`);
  const restLeak = await anon.request.get(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/client_messages?select=body`, { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY } });
  check("the public key cannot read messages", (await restLeak.json()).length === 0);
  const restDocs = await anon.request.get(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/case_documents?select=title`, { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY } });
  check("the public key cannot read documents", (await restDocs.json()).length === 0);

  // --- wrong file type refused
  const bad = await a.ctx.request.post(`${BASE}/api/portal/upload-url`, { data: { title: "Virus", mime: "text/html", size: 100 } });
  check("HTML files are refused", bad.status() === 422, `status ${bad.status()}`);
  const { data: strayDocs } = await db.from("case_documents").select("id,title").eq("person_id", pa.id).eq("title", "Virus");
  for (const s of strayDocs ?? []) await db.from("case_documents").delete().eq("id", s.id);

  // --- consultant side: sign in as staff with a temporary staff account
  const staffEmail = `e2e-staff-${tag}@example.com`, staffPw = `Staff-${tag}-123`;
  const { data: su } = await db.auth.admin.createUser({ email: staffEmail, password: staffPw, email_confirm: true });
  made.users.push(su.user.id);
  await db.from("profiles").insert({ id: su.user.id, full_name: "E2E Staff", role: "consultant" });
  const s = await session();
  await s.ctx.close();
  const sc = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const sp = await sc.newPage();
  await sp.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await sp.fill("#em", staffEmail); await sp.fill("#pw", staffPw);
  await sp.locator("button[type=submit]").click();
  await sp.waitForURL(/\/admin$/, { timeout: 45000 });
  check("consultant can sign in to admin", true);
  check("Today shows the client's message", (await sp.textContent("body")).includes(A.name));

  await sp.goto(`${BASE}/admin/cases`, { waitUntil: "domcontentloaded" });
  const casesText = await sp.textContent("body");
  check("the admin menu calls it Client files", casesText.includes("Client files"));
  check("Client files lists the new file by its Client ID", casesText.includes(fileA[0].ref));
  check("Client files shows the waiting sign-up request", casesText.includes(R.name) && casesText.includes("Sign-up requests"));
  await sp.locator("div", { hasText: R.name }).last().locator("button", { hasText: "Approve" }).click();
  await sp.waitForFunction((n) => !document.body.innerText.includes(n), R.name, { timeout: 20000 });
  const { data: prAfter } = await db.from("people").select("portal_status").eq("id", pr.id).single();
  check("the admin can approve a sign-up request", prAfter.portal_status === "approved", prAfter.portal_status);

  await sp.goto(`${BASE}/admin/cases/documents`, { waitUntil: "domcontentloaded" });
  const docsText = await sp.textContent("body");
  check("all-documents screen lists the upload under the Client ID", docsText.includes("Bank statement") && docsText.includes(fileA[0].ref));
  await sp.goto(`${BASE}/admin/cases/${fileA[0].ref}`, { waitUntil: "domcontentloaded" });
  await sp.selectOption('select[name="stage"]', "docs_missing");
  await sp.locator("button", { hasText: "Save status" }).click();
  await sp.waitForFunction(() => document.body.innerText.includes("Documents missing"), null, { timeout: 20000 });
  const { data: fileNow } = await db.from("cases").select("stage").eq("id", fileA[0].id).single();
  check("the admin sets the status from the drop-down", fileNow.stage === "docs_missing", fileNow.stage);
  await a.page.goto(`${BASE}/portal`, { waitUntil: "domcontentloaded" });
  check("the client sees the new status live", (await a.page.textContent("body")).includes("Documents missing"));
  await sp.selectOption('select[name="stage"]', "refused");
  await sp.locator("button", { hasText: "Save status" }).click();
  await sp.waitForFunction(() => document.body.innerText.includes("Case refused"), null, { timeout: 20000 });
  const { data: refused } = await db.from("cases").select("stage,decision").eq("id", fileA[0].id).single();
  check("choosing 'Case refused' records the decision", refused.stage === "refused" && refused.decision === "refused");
  await sp.selectOption('select[name="stage"]', "awaiting_embassy");
  await sp.locator("button", { hasText: "Save status" }).click();
  await sp.waitForFunction(() => !document.body.innerText.includes("REFUSED"), null, { timeout: 20000 });
  const { data: reopened } = await db.from("cases").select("stage,decision").eq("id", fileA[0].id).single();
  check("moving a file back reopens it", reopened.stage === "awaiting_embassy" && reopened.decision === null);
  const staffDl = await sc.request.get(`${BASE}/admin/docs/${doc.id}`, { maxRedirects: 0 });
  check("consultant can open the file", staffDl.status() === 302, `status ${staffDl.status()}`);
  const { count: logged } = await db.from("activity_log").select("id", { count: "exact", head: true }).eq("action", "doc_download").eq("target_id", doc.id);
  check("the staff download is logged", (logged ?? 0) >= 1);

  await sp.goto(`${BASE}/admin/people/${pa.id}`, { waitUntil: "domcontentloaded" });
  await sp.waitForSelector("textarea");
  await sp.locator("details summary", { hasText: "Ask the client to send it again" }).click();
  await sp.fill('input[name="note"]', "The photo is blurred");
  await sp.locator("button", { hasText: "Send back" }).click();
  await sp.waitForFunction(() => document.body.innerText.includes("Asked again"), null, { timeout: 20000 });
  await sp.fill('input[name="title"]', "Passport copy");
  await sp.locator("button", { hasText: "Ask client" }).click();
  await sp.waitForFunction(() => document.body.innerText.includes("Passport copy"), null, { timeout: 20000 });
  await sp.locator("textarea").fill("Thank you, please also send your CNIC.");
  await sp.locator("button[aria-label=Send]").click();
  await sp.waitForFunction(() => document.body.innerText.includes("please also send your CNIC"), null, { timeout: 15000 });
  check("consultant can send back, ask for a document, and chat", true);

  // --- client sees all of that
  await a.page.goto(`${BASE}/portal`, { waitUntil: "domcontentloaded" });
  await a.page.waitForSelector("#chat");
  const seen = await a.page.textContent("body");
  check("client sees the reason it was sent back", seen.includes("The photo is blurred"));
  check("client sees the newly requested document", seen.includes("Passport copy"));
  check("client sees the consultant's message", seen.includes("please also send your CNIC"));

  // --- review flow: homepage form -> hidden -> approved in admin -> shown on homepage
  const reviewText = `Very helpful service, test review ${tag}.`;
  const rv = await session();
  await rv.page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await rv.page.fill("#rv-name", `Reviewer ${tag}`);
  await rv.page.fill("#rv-body", reviewText);
  await rv.page.locator('#reviews button[aria-label="5 / 5"]').click();
  await rv.page.locator('input[name="consent"]').check();
  await rv.page.locator("#reviews button[type=submit]").click();
  await rv.page.waitForSelector('#reviews [role="status"]', { timeout: 20000 });
  const { data: pending } = await db.from("reviews").select("id,status").eq("body", reviewText).single();
  made.review = pending.id;
  check("homepage review arrives as pending", pending.status === "pending");
  await rv.page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  check("a pending review is NOT shown publicly", !(await rv.page.content()).includes(reviewText));
  const ec = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const ep = await ec.newPage();
  await db.from("profiles").update({ role: "owner" }).eq("id", su.user.id);
  await ep.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await ep.fill("#em", staffEmail); await ep.fill("#pw", staffPw);
  await ep.locator("button[type=submit]").click();
  await ep.waitForURL(/\/admin$/, { timeout: 45000 });
  await ep.goto(`${BASE}/admin/reviews`, { waitUntil: "domcontentloaded" });
  check("admin Reviews screen shows it", (await ep.textContent("body")).includes(reviewText));
  await ep.locator(`form:has(input[name="id"][value="${pending.id}"]) button`, { hasText: "Approve" }).click();
  await ep.waitForTimeout(3000);
  const { data: appr } = await db.from("reviews").select("status").eq("id", pending.id).single();
  check("admin can approve it", appr.status === "approved");
  await rv.page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  check("the approved review now shows on the homepage", (await rv.page.content()).includes(reviewText));
  await db.from("reviews").delete().eq("id", pending.id);
  made.review = null;
  await db.from("profiles").update({ role: "consultant" }).eq("id", su.user.id);

  // --- portal link: a consultant connects a brand-new login to an existing record
  const { data: rec } = await db.from("people").insert({ full_name: `Existing ${tag}`, whatsapp: `+9232${Math.floor(1e8 + Math.random() * 8e8)}` }).select("id").single();
  made.people.push(rec.id);
  await sp.goto(`${BASE}/admin/people/${rec.id}`, { waitUntil: "domcontentloaded" });
  await sp.locator("button", { hasText: "Create client login link" }).click();
  await sp.waitForSelector('input[aria-label="Link for the client"]', { timeout: 20000 });
  const link = await sp.inputValue('input[aria-label="Link for the client"]');
  check("consultant gets a one-time link", /\/portal\/join\?code=[A-Z2-9]{10}$/.test(link));
  const path = link.slice(link.indexOf("/portal"));
  const c = await session();
  await c.page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  const C = { email: `e2ec-${tag}@example.com`, password: `Pw-${tag}-c1234` };
  await c.page.fill("#ps-n", `Existing ${tag}`); await c.page.fill("#ps-e", C.email); await c.page.fill("#ps-w", "+923000000000"); await c.page.fill("#ps-p", C.password);
  await c.page.locator("form.card button.btn-primary").click();
  await c.page.waitForURL(/\/portal$/, { timeout: 45000 });
  const { data: linked } = await db.from("people").select("auth_user_id").eq("id", rec.id).single();
  if (linked.auth_user_id) made.users.push(linked.auth_user_id);
  check("the link connects the login to that client's record", !!linked.auth_user_id);
  const d = await session();
  await d.page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  const D = { email: `e2ed-${tag}@example.com`, password: `Pw-${tag}-d1234` };
  await d.page.fill("#ps-n", "Thief"); await d.page.fill("#ps-e", D.email); await d.page.fill("#ps-w", "+923000000001"); await d.page.fill("#ps-p", D.password);
  await d.page.locator("form.card button.btn-primary").click();
  await d.page.waitForFunction(() => document.body.innerText.includes("not valid"), null, { timeout: 20000 });
  check("the same link cannot be used twice", true);
  const { data: ghost } = await db.auth.admin.listUsers({ perPage: 200 });
  check("the failed attempt leaves no account behind", !ghost.users.some((u) => u.email === D.email));

  await db.from("profiles").delete().eq("id", su.user.id);
} catch (e) {
  results.push(false);
  console.log("FAIL  stopped early:", e.message.split("\n")[0]);
} finally {
  await browser.close();
  // clean up everything the test created
  if (made.review) await db.from("reviews").delete().eq("id", made.review);
  for (const id of made.people) {
    const { data: docs } = await db.from("case_documents").select("id,file_path").eq("person_id", id);
    const files = (docs ?? []).map((x) => x.file_path).filter(Boolean);
    if (files.length) await db.storage.from("case-documents").remove(files);
    await db.from("timeline_events").delete().eq("person_id", id);
    await db.from("cases").delete().eq("person_id", id);
    await db.from("leads").delete().eq("person_id", id);
    await db.from("people").delete().eq("id", id);
  }
  const { data: all } = await db.auth.admin.listUsers({ perPage: 200 });
  for (const u of all.users) if (u.email?.includes(tag)) { await db.from("profiles").delete().eq("id", u.id); await db.auth.admin.deleteUser(u.id); }
  await db.from("activity_log").delete().like("target_id", "%").eq("action", "doc_download").is("meta", null).in("actor", made.users.length ? made.users : ["00000000-0000-0000-0000-000000000000"]);
  const pass = results.filter(Boolean).length;
  console.log(`\n${pass} of ${results.length} checks passed. Test data removed.`);
  process.exit(pass === results.length ? 0 : 1);
}
