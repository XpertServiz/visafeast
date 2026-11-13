import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit, crossSite } from "@/lib/server/guard";
import { serviceClient } from "@/lib/supabase";
import { getClient, readMessages } from "@/lib/server/portal";
import { esc, notifyOwner } from "@/lib/server/notify";
import { siteConfig } from "@/config/site";

const schema = z.object({ body: z.string().trim().min(1).max(4000) });

export async function GET(req: NextRequest) {
  const me = await getClient(); const db = serviceClient();
  if (!me || !db) return NextResponse.json({ ok: false }, { status: 401 });
  const after = Math.max(0, Number(req.nextUrl.searchParams.get("after")) || 0);
  const messages = await readMessages(db, me.person.id, after);
  if (messages.some((m) => m.sender === "staff"))
    await db.from("client_messages").update({ read_by_client_at: new Date().toISOString() }).eq("person_id", me.person.id).eq("sender", "staff").is("read_by_client_at", null);
  return NextResponse.json({ ok: true, messages }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (crossSite(req)) return NextResponse.json({ ok: false, error: "Request not allowed." }, { status: 403 });
  const me = await getClient(); const db = serviceClient();
  if (!me || !db) return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ ok: false, error: "Please write a message (up to 4,000 letters)." }, { status: 422 });
  if (!(await rateLimit(`pmsg:${me.person.id}`, 40, 600_000))) return NextResponse.json({ ok: false, error: "Too many messages. Please wait a few minutes." }, { status: 429 });
  // email the owner only for the first unread message, so a long chat doesn't flood the inbox
  const { count } = await db.from("client_messages").select("id", { count: "exact", head: true }).eq("person_id", me.person.id).eq("sender", "client").is("read_by_staff_at", null);
  const { data, error } = await db.from("client_messages").insert({ person_id: me.person.id, sender: "client", body: p.data.body }).select("id,sender,body,created_at").single();
  if (error || !data) return NextResponse.json({ ok: false, error: "Could not send. Please try again." }, { status: 500 });
  if (!count) void notifyOwner(`New message from ${me.person.full_name}`, `<p><b>${esc(me.person.full_name)}</b> wrote:</p><p>${esc(p.data.body.slice(0, 500))}</p><p><a href="${esc(siteConfig.url)}/admin/people/${esc(me.person.id)}">Reply</a></p>`);
  return NextResponse.json({ ok: true, message: data });
}
