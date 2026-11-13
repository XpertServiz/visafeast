import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { serviceClient } from "../supabase";

export function clientIp(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "0.0.0.0").trim();
}

/**
 * True when a browser request comes from ANOTHER website (its Origin header names a different host). Used on endpoints that act on a signed-in
 * user's behalf, as a second layer on top of SameSite cookies. Requests with no Origin (our own tests, servers) are not browsers and pass.
 */
export function crossSite(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host !== (req.headers.get("x-forwarded-host") || req.headers.get("host") || ""); } catch { return true; }
}

/** sha256(daily salt + ip + ua) — the raw IP is never stored (brief §12). */
export function visitorHash(req: NextRequest): string {
  const day = new Date().toISOString().slice(0, 10);
  const salt = (process.env.DAILY_SALT_SECRET || "dev-salt") + day;
  return createHash("sha256").update(salt + clientIp(req) + (req.headers.get("user-agent") || "")).digest("hex").slice(0, 32);
}
export const ipHash = (req: NextRequest) => createHash("sha256").update((process.env.DAILY_SALT_SECRET || "dev-salt") + "ip" + clientIp(req)).digest("hex").slice(0, 32);

// In-memory fixed-window limiter (per server instance). Good enough as a first line; the DB table `rate_limits` is used when available.
const mem = new Map<string, { start: number; count: number }>();
/** Memory-only limiter for the busy tracking calls (no database round trip). Forms keep the stronger database-backed limiter below. */
export function rateLimitFast(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const cur = mem.get(key);
  if (!cur || now - cur.start > windowMs) { mem.set(key, { start: now, count: 1 }); return true; }
  cur.count++;
  return cur.count <= max;
}
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const cur = mem.get(key);
  if (!cur || now - cur.start > windowMs) { mem.set(key, { start: now, count: 1 }); }
  else { cur.count++; if (cur.count > max) return false; }
  if (mem.size > 5000) for (const [k, v] of mem) if (now - v.start > windowMs) mem.delete(k);
  const db = serviceClient();
  if (db) {
    try {
      const { data } = await db.from("rate_limits").select("window_start,count").eq("key", key).maybeSingle();
      if (!data || now - new Date(data.window_start).getTime() > windowMs) await db.from("rate_limits").upsert({ key, window_start: new Date().toISOString(), count: 1 });
      else { if (data.count >= max) return false; await db.from("rate_limits").update({ count: data.count + 1 }).eq("key", key); }
    } catch { /* table missing: rely on memory limiter */ }
  }
  return true;
}

/** Cloudflare Turnstile verification. With no secret configured (local dev) it passes. */
export async function verifyTurnstile(token: string | undefined, req: NextRequest): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!token) return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: clientIp(req) }),
    });
    return Boolean((await r.json()).success);
  } catch { return false; }
}

export const BOT_RE = /bot|crawl|spider|slurp|preview|lighthouse|headless|facebookexternalhit|monitor|curl|wget|python-requests/i;
