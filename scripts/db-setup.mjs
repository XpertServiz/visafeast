// Usage: DATABASE_URL=postgresql://... node scripts/db-setup.mjs [--seed]
// Runs supabase/migrations/*.sql in order (safe to re-run: they use "if not exists"), then optionally the seed.
import pg from "pg";
import { readdirSync, readFileSync } from "node:fs";
const url = process.env.DATABASE_URL;
if (!url) { console.error("Set DATABASE_URL"); process.exit(1); }
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
const files = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
for (const f of files) {
  try { await c.query(readFileSync(`supabase/migrations/${f}`, "utf8")); console.log("ok  ", f); }
  catch (e) { console.error("FAIL", f, e.message); if (!/already exists/.test(e.message)) { await c.end(); process.exit(1); } }
}
if (process.argv.includes("--seed")) { await c.query(readFileSync("supabase/seed.sql", "utf8")); console.log("ok   seed.sql"); }
await c.end();
