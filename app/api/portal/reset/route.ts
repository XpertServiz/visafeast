import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/server/guard";
import { serviceClient } from "@/lib/supabase";
import { hashCode } from "@/lib/portal";

const schema = z.object({ code: z.string().trim().min(6).max(40), password: z.string().min(8).max(72) });

/** Forgot password: the consultant sends a one-time link by WhatsApp, so no email service is needed. */
export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ ok: false, error: "Please use a password of at least 8 characters." }, { status: 422 });
  if (!(await rateLimit(`preset:${clientIp(req)}`, 10, 3600_000))) return NextResponse.json({ ok: false, error: "Too many tries. Please wait an hour." }, { status: 429 });
  const db = serviceClient();
  if (!db) return NextResponse.json({ ok: false, error: "Not available right now." }, { status: 503 });
  const { data: uid, error } = await db.rpc("portal_use_reset_code", { p_hash: hashCode(p.data.code) });
  if (error || !uid) return NextResponse.json({ ok: false, error: error?.message ?? "This link is not valid." }, { status: 400 });
  const { error: e2 } = await db.auth.admin.updateUserById(uid, { password: p.data.password });
  if (e2) return NextResponse.json({ ok: false, error: "Could not set the password. Please choose a stronger one and ask for a new link." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
