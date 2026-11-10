import "server-only";
import type { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { isLocale } from "@/config/locales";
import { visitorHash } from "./guard";
import type { serviceClient } from "../supabase";

const dec = (v: string | null) => { try { return v ? decodeURIComponent(v) : null; } catch { return v; } };
let lastPrune = 0;

/** Marks a visitor as "live now" (one database call). Old rows are cleaned out at most once every 10 minutes per server instance. */
export async function savePresence(db: NonNullable<ReturnType<typeof serviceClient>>, req: NextRequest, ua: string, b: { sid?: unknown; path?: unknown; lang?: unknown; locale?: unknown; referrer?: unknown }) {
  const sid = String(b.sid ?? "").slice(0, 64);
  if (!sid) return;
  const t = new UAParser(ua).getDevice().type;
  let ref: string | null = null;
  try { ref = b.referrer ? new URL(String(b.referrer)).hostname : null; } catch { /* ignore */ }
  await db.from("live_presence").upsert({
    session_id: sid, visitor_hash: visitorHash(req), path: String(b.path || "/").slice(0, 200),
    country: req.headers.get("x-vercel-ip-country"), city: dec(req.headers.get("x-vercel-ip-city")),
    device: t === "mobile" ? "mobile" : t === "tablet" ? "tablet" : "desktop", browser_language: String(b.lang || "").slice(0, 20),
    site_locale: isLocale(b.locale) ? b.locale : "en", referrer_host: ref, last_seen: new Date().toISOString(),
  });
  const now = Date.now();
  if (now - lastPrune > 600_000) { lastPrune = now; await db.from("live_presence").delete().lt("last_seen", new Date(now - 30 * 60_000).toISOString()); }
}
