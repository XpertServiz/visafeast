import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, ipHash, rateLimit, verifyTurnstile } from "@/lib/server/guard";
import { esc, notifyOwner } from "@/lib/server/notify";
import { serviceClient } from "@/lib/supabase";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  city: z.string().trim().max(60).optional(),
  visa_type: z.string().trim().max(40).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(1500),
  consent: z.literal(true, { message: "Consent is required" }),
  website: z.string().max(0).optional(),
  turnstile: z.string().optional(),
});

/** Reviews arrive as PENDING and only appear after the owner approves them (brief §9.3 / §9.6). */
export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const p = schema.safeParse(body);
  if (!p.success) return NextResponse.json({ ok: false, error: "Please complete the form and tick the consent box." }, { status: 422 });
  if (!(await rateLimit(`review:${clientIp(req)}`, 3, 86400_000))) return NextResponse.json({ ok: false, error: "Too many reviews from this connection." }, { status: 429 });
  if (!(await verifyTurnstile(p.data.turnstile, req))) return NextResponse.json({ ok: false, error: "Bot check failed." }, { status: 400 });
  const { turnstile: _t, website: _w, ...r } = p.data;
  const db = serviceClient();
  if (db) {
    const { error } = await db.from("reviews").insert({ ...r, submitted_via: "website", status: "pending", ip_hash: ipHash(req) });
    if (error) { console.error("[review]", error); return NextResponse.json({ ok: false, error: "Could not save. Try again." }, { status: 500 }); }
  } else console.info("[review:no-db]", r.name);
  void notifyOwner("New review awaiting approval", `<p><b>${esc(r.name)}</b> (${esc(r.city)}) — ${r.rating}/5</p><p>${esc(r.body)}</p>`);
  return NextResponse.json({ ok: true });
}
