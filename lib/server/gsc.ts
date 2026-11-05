import "server-only";
import { createSign } from "node:crypto";
import { serviceClient } from "../supabase";

/** Free Google Search Console pull (brief §12). Needs GOOGLE_SEARCH_CONSOLE_CREDENTIALS (base64 service-account JSON) + GSC_SITE_URL. */
export const gscConfigured = () => Boolean(process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS && process.env.GSC_SITE_URL);

const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64url");
async function accessToken(): Promise<string | null> {
  try {
    const cred = JSON.parse(Buffer.from(process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS!, "base64").toString("utf8")) as { client_email: string; private_key: string };
    const now = Math.floor(Date.now() / 1000);
    const head = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = b64u(JSON.stringify({ iss: cred.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3000 }));
    const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(cred.private_key);
    const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${b64u(sig)}` }) });
    return r.ok ? (await r.json()).access_token : null;
  } catch { return null; }
}

export async function pullSearchConsole(): Promise<{ ok: boolean; rows: number; note?: string }> {
  if (!gscConfigured()) return { ok: false, rows: 0, note: "not configured" };
  const db = serviceClient(); if (!db) return { ok: false, rows: 0, note: "no db" };
  const token = await accessToken(); if (!token) return { ok: false, rows: 0, note: "could not sign in to Google" };
  const day = (n: number) => new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10);
  // Search Console data is ~2 days behind; re-pulling the last few days is safe because rows are upserted.
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE_URL!)}/searchAnalytics/query`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ startDate: day(6), endDate: day(2), dimensions: ["date", "page", "query", "country", "device"], rowLimit: 5000 }),
  });
  if (!r.ok) return { ok: false, rows: 0, note: `Google said ${r.status}` };
  const j = (await r.json()) as { rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[] };
  const rows = (j.rows ?? []).map((x) => ({ day: x.keys[0], page: x.keys[1], query: x.keys[2], country: x.keys[3], device: x.keys[4], clicks: x.clicks, impressions: x.impressions, ctr: x.ctr, position: x.position }));
  for (let i = 0; i < rows.length; i += 500) await db.from("search_console_daily").upsert(rows.slice(i, i + 500), { onConflict: "day,page,query,country,device" });
  return { ok: true, rows: rows.length };
}
