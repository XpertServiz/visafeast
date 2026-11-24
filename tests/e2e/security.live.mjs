// Outsider check of the live database. Run it after every database change and once a month:  node tests/e2e/security.live.mjs
// It behaves like a stranger holding only the public key and fails if a private table leaks, a database function answers, or the file bucket is open.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, H = { apikey: K, Authorization: `Bearer ${K}`, "content-type": "application/json" };
const all = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).map((f) => readFileSync(`supabase/migrations/${f}`, "utf8")).join("\n");
const tables = [...new Set([...all.matchAll(/create table (?:if not exists )?(?:public\.)?([a-z_]+)/gi)].map((m) => m[1]))];
const fns = [...new Set([...all.matchAll(/create (?:or replace )?function ([a-z_]+)/gi)].map((m) => m[1]))].filter((f) => f !== "staff_role");
// tables the public website is MEANT to read (published rows only; each has a policy that limits the rows)
const PUBLIC_READ = new Set(["settings", "countries", "faqs", "news_sources", "news_items", "hero_videos", "content_translations", "reviews", "case_studies", "posts", "media"]);
let fail = 0; const bad = (m) => { fail++; console.log("FAIL", m); };
for (const t of tables) {
  const r = await fetch(`${U}/rest/v1/${t}?select=*&limit=1`, { headers: H }); const j = await r.json().catch(() => null);
  if (r.ok && Array.isArray(j) && j.length && !PUBLIC_READ.has(t)) bad(`a stranger can READ ${t}`);
  const w = await fetch(`${U}/rest/v1/${t}`, { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: "{}" });
  if (w.status === 201 || w.status === 204) bad(`a stranger can WRITE ${t}`);
}
for (const f of fns) { const r = await fetch(`${U}/rest/v1/rpc/${f}`, { method: "POST", headers: H, body: "{}" }); if (r.status === 200) bad(`a stranger can CALL the function ${f}`); }
const o = await fetch(`${U}/storage/v1/object/list/case-documents`, { method: "POST", headers: H, body: JSON.stringify({ prefix: "", limit: 3 }) }); const oj = await o.json().catch(() => []); if (Array.isArray(oj) && oj.length) bad("a stranger can LIST client files");
const pub = await fetch(`${U}/storage/v1/object/public/case-documents/x`); if (pub.status === 200) bad("the file bucket is public");
// sign-up: strangers should NOT be able to create logins (turn it off in Supabase: Authentication > Sign In / Providers > Allow new users to sign up)
const email = `secprobe${Date.now()}@visafeast.com`;
const s = await fetch(`${U}/auth/v1/signup`, { method: "POST", headers: H, body: JSON.stringify({ email, password: "Probe-12345-xyzQ" }) });
if (s.status === 200) {
  bad("a stranger can create a login (public sign-up is ON in Supabase)");
  const db = createClient(U, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data } = await db.auth.admin.listUsers({ perPage: 200 }); for (const u of data.users) if (u.email === email) await db.auth.admin.deleteUser(u.id);
}
console.log(`${tables.length} tables, ${fns.length} functions checked. ${fail ? fail + " problem(s)" : "All closed."}`); process.exit(fail ? 1 : 0);
