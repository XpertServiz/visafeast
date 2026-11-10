import { NextResponse, type NextRequest } from "next/server";
import { isbot } from "isbot";
import { clientIp, rateLimitFast } from "@/lib/server/guard";
import { serviceClient } from "@/lib/supabase";
import { automated } from "@/lib/bots";
import { savePresence } from "@/lib/server/presence";

/** Live heartbeat (every 2 minutes while the tab is visible; page views also mark the visitor live). */
export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const none = () => new NextResponse(null, { status: 204 });
  if (isbot(ua)) return none();
  let b: Record<string, string>;
  try { b = JSON.parse(await req.text()); } catch { return none(); }
  if (!b.sid || String(b.path || "").startsWith("/admin")) return none();
  if (!rateLimitFast(`presence:${clientIp(req)}`, 10, 60_000)) return none();
  if (automated({ lang: String(b.lang ?? ""), webdriver: (b as unknown as { wd?: unknown }).wd === true })) return none();
  const db = serviceClient();
  if (!db) return none();
  try { await savePresence(db, req, ua, b); } catch (e) { console.error("[presence]", e); }
  return none();
}
