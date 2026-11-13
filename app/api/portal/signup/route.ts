import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit, verifyTurnstile } from "@/lib/server/guard";
import { authClient } from "@/lib/server/admin-auth";
import { serviceClient } from "@/lib/supabase";
import { normPhone } from "@/lib/server/leads";
import { esc, notifyOwner } from "@/lib/server/notify";
import { hashCode } from "@/lib/portal";
import { siteConfig } from "@/config/site";

const schema = z.object({
  name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email().max(200), phone: z.string().trim().min(7).max(20),
  password: z.string().min(8).max(72), code: z.string().trim().max(40).optional(), turnstile: z.string().optional(), website: z.string().max(0).optional(),
});
const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

/** Asks for a client login. A website sign-up waits for the admin's approval; a consultant's link (code) is approved at once. Access to an existing file comes ONLY from such a code, never from typing a phone number. */
export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return fail("Please check your name, email, WhatsApp number, and use a password of at least 8 characters.", 422);
  if (!(await rateLimit(`psignup:${clientIp(req)}`, 6, 3600_000))) return fail("Too many tries. Please wait an hour or message us on WhatsApp.", 429);
  if (!(await verifyTurnstile(p.data.turnstile, req))) return fail("Bot check failed. Please try again.");
  const db = serviceClient(); const auth = await authClient();
  if (!db || !auth) return fail("Sign-up is not available right now.", 503);

  const { name, email, phone, password, code } = p.data;
  const { data: made, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { kind: "client" } });
  if (error || !made.user) return fail("We could not create this account. If you already have one, please sign in.", 409);
  const uid = made.user.id;
  const undo = async (msg: string) => { await db.auth.admin.deleteUser(uid); return fail(msg); };

  if (code) {
    // the consultant's link: attach this login to the client's existing file
    const { error: e } = await db.rpc("portal_claim_code", { p_hash: hashCode(code), p_user: uid });
    if (e) return undo(e.message);
  } else {
    // self sign-up: a fresh record. If the number is already known, it stays unlinked so nobody can reach someone else's file.
    const whatsapp = normPhone(phone);
    const { data: taken } = await db.from("people").select("id").eq("whatsapp", whatsapp).maybeSingle();
    const { data: person, error: e } = await db.from("people").insert({
      full_name: name, email, whatsapp: taken ? null : whatsapp, auth_user_id: uid, portal_status: "pending", portal_requested_at: new Date().toISOString(),
      notes: taken ? `Signed up saying WhatsApp ${whatsapp}, which is already on another record. Send them a portal link from that record to connect them.` : null,
    }).select("id").single();
    if (e || !person) return undo("We could not create this account. Please try again.");
    await db.from("leads").insert({ person_id: person.id, name, phone: whatsapp, email, source: "portal_signup", page_path: "/portal/signup" });
    void notifyOwner(`Sign-up request: ${name}`, `<p><b>${esc(name)}</b> asked for a client account.</p><p>WhatsApp: ${esc(whatsapp)}<br>Email: ${esc(email)}</p>${taken ? "<p>This number is already on another record: connect them from that record.</p>" : ""}<p><a href="${esc(siteConfig.url)}/admin/cases#requests">Open Client files to approve or decline</a>. They cannot sign in until you approve.</p>`);
    // nobody gets in before the admin approves: no automatic sign-in
    return NextResponse.json({ ok: true, pending: true });
  }

  const { error: e2 } = await auth.auth.signInWithPassword({ email, password });
  if (e2) return NextResponse.json({ ok: true, signIn: true });
  return NextResponse.json({ ok: true });
}
