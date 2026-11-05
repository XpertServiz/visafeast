import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/server/guard";
import { authClient } from "@/lib/server/admin-auth";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(72) });
const WRONG = { ok: false, error: "Wrong email or password." };

export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json(WRONG, { status: 401 });
  if (!(await rateLimit(`plogin:${clientIp(req)}`, 15, 900_000)) || !(await rateLimit(`plogin-e:${p.data.email}`, 10, 900_000)))
    return NextResponse.json({ ok: false, error: "Too many tries. Please wait 15 minutes." }, { status: 429 });
  const c = await authClient();
  if (!c) return NextResponse.json({ ok: false, error: "Sign-in is not available right now." }, { status: 503 });
  const { error } = await c.auth.signInWithPassword(p.data);
  if (error) return NextResponse.json(WRONG, { status: 401 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const c = await authClient();
  await c?.auth.signOut();
  return NextResponse.json({ ok: true });
}
