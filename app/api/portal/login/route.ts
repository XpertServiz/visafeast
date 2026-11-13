import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit, crossSite } from "@/lib/server/guard";
import { authClient } from "@/lib/server/admin-auth";
import { serviceClient } from "@/lib/supabase";
import { portalStatusFor } from "@/lib/server/portal";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(72) });
const WRONG = { ok: false, error: "Wrong email or password." };

export async function POST(req: NextRequest) {
  if (crossSite(req)) return NextResponse.json({ ok: false, error: "Request not allowed." }, { status: 403 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json(WRONG, { status: 401 });
  if (!(await rateLimit(`plogin:${clientIp(req)}`, 15, 900_000)) || !(await rateLimit(`plogin-e:${p.data.email}`, 10, 900_000)))
    return NextResponse.json({ ok: false, error: "Too many tries. Please wait 15 minutes." }, { status: 429 });
  const c = await authClient();
  if (!c) return NextResponse.json({ ok: false, error: "Sign-in is not available right now." }, { status: 503 });
  const { data, error } = await c.auth.signInWithPassword(p.data);
  if (error || !data.user) return NextResponse.json(WRONG, { status: 401 });
  // a sign-up the admin has not approved yet cannot get in
  const db = serviceClient();
  const status = db ? await portalStatusFor(db, data.user.id) : null;
  if (status === "pending" || status === "rejected") {
    await c.auth.signOut();
    return NextResponse.json({ ok: false, waiting: status, error: status === "pending" ? "Your sign-up request is waiting for approval. We will email you as soon as it is approved." : "This sign-up request was not approved. Please contact us on WhatsApp." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const c = await authClient();
  await c?.auth.signOut();
  return NextResponse.json({ ok: true });
}
