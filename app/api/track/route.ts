import { isLocale } from "@/config/locales";
import { NextResponse, type NextRequest } from "next/server";
import { isbot } from "isbot";
import { UAParser } from "ua-parser-js";
import { clientIp, rateLimit, visitorHash } from "@/lib/server/guard";
import { serviceClient } from "@/lib/supabase";
import { automated } from "@/lib/bots";

const dec = (v: string | null) => { try { return v ? decodeURIComponent(v) : null; } catch { return v; } };
const EVENTS = new Set(["whatsapp_click", "cta_click", "chat_open", "checklist_download", "booking_click", "eligibility_complete", "review_submitted", "decoder_used", "video_view", "video_click"]);

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (isbot(ua) || req.headers.get("purpose") === "prefetch") return new NextResponse(null, { status: 204 });
  let b: Record<string, unknown>;
  try { b = JSON.parse(await req.text()); } catch { return new NextResponse(null, { status: 204 }); }
  const path = String(b.path || "/").slice(0, 200);
  if (path.startsWith("/admin") || path.startsWith("/api")) return new NextResponse(null, { status: 204 });
  if (!(await rateLimit(`track:${clientIp(req)}`, 120, 60_000))) return new NextResponse(null, { status: 204 });

  const db = serviceClient();
  const vh = visitorHash(req);
  const country = req.headers.get("x-vercel-ip-country");
  if (!db) return new NextResponse(null, { status: 204 });

  try {
    if (b.type === "view") {
      const p = new UAParser(ua).getResult();
      const t = p.device.type;
      // robots that pretend to be a phone or a browser are not counted
      if (automated({ lang: String(b.lang ?? ""), os: p.os.name, screen: String(b.screen ?? ""), webdriver: b.wd === true })) return new NextResponse(null, { status: 204 });
      let ref: string | null = null;
      try { ref = b.referrer ? new URL(String(b.referrer)).hostname : null; } catch { /* ignore */ }
      const utm = (b.utm ?? {}) as Record<string, string | null>;
      await db.from("page_views").insert({
        path, referrer_host: ref, utm_source: utm.source, utm_medium: utm.medium, utm_campaign: utm.campaign,
        country, region: dec(req.headers.get("x-vercel-ip-country-region")), city: dec(req.headers.get("x-vercel-ip-city")),
        device: t === "mobile" ? "mobile" : t === "tablet" ? "tablet" : "desktop", visitor_hash: vh, session_id: String(b.sid || ""),
        browser: p.browser.name, os: p.os.name, screen: String(b.screen || "").slice(0, 20), browser_language: String(b.lang || "").slice(0, 20),
        accept_language: (req.headers.get("accept-language") || "").split(",")[0].slice(0, 20), site_locale: isLocale(b.locale) ? b.locale : "en",
        is_new_visitor: !b.returning, landing: Boolean(b.landing),
      });
    } else if (b.type === "duration") {
      const ms = Math.min(Number(b.ms) || 0, 3600_000);
      await db.from("page_views").update({ duration_ms: ms }).eq("session_id", String(b.sid || "")).eq("path", path).order("ts", { ascending: false }).limit(1);
    } else if (b.type === "event" && EVENTS.has(String(b.name))) {
      await db.from("events").insert({ name: String(b.name), path, meta: b.meta ?? null, visitor_hash: vh, country });
    }
  } catch (e) { console.error("[track]", e); }
  return new NextResponse(null, { status: 204 });
}
