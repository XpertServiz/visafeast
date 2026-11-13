import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/server/guard";
import { authClient } from "@/lib/server/admin-auth";
import { serviceClient } from "@/lib/supabase";
import { hashCode } from "@/lib/portal";

const schema = z.object({ code: z.string().trim().min(6).max(40) });

/** An already signed-in client uses the consultant's link to connect their login to their file. */
export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ ok: false, error: "This link is not valid." }, { status: 422 });
  if (!(await rateLimit(`pjoin:${clientIp(req)}`, 10, 3600_000))) return NextResponse.json({ ok: false, error: "Too many tries. Please wait an hour." }, { status: 429 });
  const c = await authClient(); const db = serviceClient();
  const user = c ? (await c.auth.getUser()).data.user : null;
  if (!db || !user) return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  const { error } = await db.rpc("portal_claim_code", { p_hash: hashCode(p.data.code), p_user: user.id });
  if (error) return NextResponse.json({ ok: false, error: /^This /.test(error.message) ? error.message : "This link is not valid any more. Please ask your consultant for a new one." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
