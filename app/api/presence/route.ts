import { NextResponse, type NextRequest } from "next/server";
import { isbot } from "isbot";
import { UAParser } from "ua-parser-js";
import { clientIp, rateLimit, visitorHash } from "@/lib/server/guard";
import { serviceClient } from "@/lib/supabase";

const dec = (v: string | null) => { try { return v ? decodeURIComponent(v) : null; } catch { return v; } };

/** Live heartbeat (every 30 s while the tab is visible). Rows older than 10 minutes are pruned. */
export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const none = () => new NextResponse(null, { status: 204 });
  if (isbot(ua)) return none();
  const db = serviceClient();
  if (!db) return none();
  let b: Record<string, string>;
  try { b = JSON.parse(await req.text()); } catch { return none(); }
  if (!b.sid || String(b.path || "").startsWith("/admin")) return none();
  if (!(await rateLimit(`presence:${clientIp(req)}`, 10, 60_000))) return none();
  const t = new UAParser(ua).getDevice().type;
  let ref: string | null = null;
  try { ref = b.referrer ? new URL(b.referrer).hostname : null; } catch { /* ignore */ }
  try {
    await db.from("live_presence").upsert({
      session_id: String(b.sid).slice(0, 64), visitor_hash: visitorHash(req), path: String(b.path || "/").slice(0, 200),
      country: req.headers.get("x-vercel-ip-country"), city: dec(req.headers.get("x-vercel-ip-city")),
      device: t === "mobile" ? "mobile" : t === "tablet" ? "tablet" : "desktop", browser_language: String(b.lang || "").slice(0, 20),
      site_locale: b.locale === "ur" ? "ur" : "en", referrer_host: ref, last_seen: new Date().toISOString(),
    });
    await db.from("live_presence").delete().lt("last_seen", new Date(Date.now() - 10 * 60_000).toISOString());
  } catch (e) { console.error("[presence]", e); }
  return none();
}
