import { crossSite } from "@/lib/server/guard";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { serviceClient } from "@/lib/supabase";
import { readMessages } from "@/lib/server/portal";

const uuid = z.string().uuid();
const schema = z.object({ body: z.string().trim().min(1).max(4000) });

async function ctx(req: NextRequest) {
  const a = await getAdmin(); const db = serviceClient();
  const person = uuid.safeParse(req.nextUrl.searchParams.get("person"));
  if (!a || !db || !can.people(a.role) || !person.success) return null;
  return { a, db, personId: person.data };
}

export async function GET(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ ok: false }, { status: 401 });
  const after = Math.max(0, Number(req.nextUrl.searchParams.get("after")) || 0);
  const messages = await readMessages(c.db, c.personId, after);
  if (messages.some((m) => m.sender === "client"))
    await c.db.from("client_messages").update({ read_by_staff_at: new Date().toISOString() }).eq("person_id", c.personId).eq("sender", "client").is("read_by_staff_at", null);
  return NextResponse.json({ ok: true, messages }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (crossSite(req)) return NextResponse.json({ ok: false, error: "Request not allowed." }, { status: 403 });
  const c = await ctx(req);
  if (!c) return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ ok: false, error: "Please write a message." }, { status: 422 });
  const { data, error } = await c.db.from("client_messages").insert({ person_id: c.personId, sender: "staff", staff_id: c.a.id, body: p.data.body }).select("id,sender,body,created_at").single();
  if (error || !data) return NextResponse.json({ ok: false, error: "Could not send." }, { status: 500 });
  return NextResponse.json({ ok: true, message: data });
}
