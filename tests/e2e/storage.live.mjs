// Checks the 60-day clean-up against the REAL Supabase project with throw-away data, then removes everything it made.
// Needs the site running with CRON_SECRET set:  BASE=http://localhost:3100 node tests/e2e/storage.live.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";

const BASE = process.env.BASE || "http://localhost:3100";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const tag = randomBytes(4).toString("hex");
const results = []; const check = (n, ok, x = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? ` (${x})` : ""}`); };
const ago = (d) => new Date(Date.now() - d * 86_400_000).toISOString();
const made = { person: null, paths: [], docs: [] };
const exists = async (path) => { const dir = path.slice(0, path.lastIndexOf("/")), name = path.slice(path.lastIndexOf("/") + 1); const { data } = await db.storage.from("case-documents").list(dir, { search: name, limit: 1 }); return Boolean(data?.some((f) => f.name === name)); };

try {
  const { data: p } = await db.from("people").insert({ full_name: `Storage Test ${tag}`, whatsapp: `+9234${Math.floor(1e8 + Math.random() * 8e8)}` }).select("id").single();
  made.person = p.id;
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
  const mk = async (title, days) => {
    const { data: d } = await db.from("case_documents").insert({ person_id: p.id, title, required: false }).select("id").single();
    const path = `${p.id}/${d.id}/${randomUUID()}.pdf`;
    const up = await db.storage.from("case-documents").upload(path, pdf, { contentType: "application/pdf" });
    if (up.error) throw new Error("test upload failed: " + up.error.message);
    await db.from("case_documents").update({ file_path: path, file_name: `${title}.pdf`, mime: "application/pdf", size_bytes: pdf.length, uploaded_by: "client", status: "uploaded", uploaded_at: ago(days) }).eq("id", d.id);
    made.paths.push(path); made.docs.push(d.id);
    return { id: d.id, path };
  };
  const old = await mk("Old file", 61), soon = await mk("Soon file", 53.5), fresh = await mk("Fresh file", 10);
  check("test files are in storage before the clean-up", (await exists(old.path)) && (await exists(soon.path)) && (await exists(fresh.path)));

  const r = await fetch(`${BASE}/api/cron/daily`, { headers: { Authorization: `Bearer ${env.CRON_SECRET}` } });
  const j = await r.json();
  check("the daily job runs", r.ok && j.ok, `HTTP ${r.status}`);
  check("the storage step reports", j.storage && typeof j.storage.removed === "number", JSON.stringify(j.storage));
  check("a week-before warning was counted", (j.storage?.warned ?? 0) >= 1);

  const { data: rows } = await db.from("case_documents").select("id,file_path,file_name,uploaded_at,size_bytes").in("id", made.docs);
  const by = Object.fromEntries(rows.map((x) => [x.id, x]));
  check("the 61-day-old file is gone from storage", !(await exists(old.path)));
  check("its row stays, without a file, with its upload date", by[old.id].file_path === null && !!by[old.id].uploaded_at && by[old.id].file_name === "Old file.pdf");
  check("the 53-day-old file is still there", (await exists(soon.path)) && by[soon.id].file_path === soon.path);
  check("the fresh file is still there", (await exists(fresh.path)) && by[fresh.id].file_path === fresh.path);
  check("stored-size total no longer counts the removed file", by[old.id].size_bytes === null);
} catch (e) {
  results.push(false); console.log("FAIL  stopped early:", e.message.split("\n")[0]);
} finally {
  if (made.paths.length) await db.storage.from("case-documents").remove(made.paths);
  if (made.docs.length) await db.from("case_documents").delete().in("id", made.docs);
  if (made.person) await db.from("people").delete().eq("id", made.person);
  const pass = results.filter(Boolean).length;
  console.log(`\n${pass} of ${results.length} checks passed. Test data removed.`);
  process.exit(pass === results.length ? 0 : 1);
}
