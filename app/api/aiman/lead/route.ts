import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/server/guard";
import { serviceClient } from "@/lib/supabase";
import { notifyOwner } from "@/lib/server/notify";
import { LEAD_LIMIT_PER_HOUR, mergeFunds } from "@/config/aiman";
import { cleanAnswers, membersNum } from "@/lib/aiman/assess";
import { leadEmailHtml, leadText } from "@/lib/aiman/lead";
import { cleanPhone } from "@/lib/aiman/phone";

const schema = z.object({
  step: z.enum(["partial", "complete"]), id: z.string().uuid().optional(), answers: z.unknown(),
  phone: z.string().max(25).optional(), city: z.string().max(60).optional(), secs: z.number().int().min(0).max(86400).optional(),
  country: z.string().length(2).nullable().optional(), lang: z.string().max(5).nullable().optional(),
  utm: z.record(z.string(), z.string().max(200)).optional(), website: z.string().max(100).optional(),
});
const bad = (error: string, status = 422) => NextResponse.json({ ok: false, error }, { status });

/**
 * Two calls only: "partial" saves the lead when the result shows (no phone yet), "complete" adds the WhatsApp number and emails the owner.
 * The browser's own verdict is never trusted: the status, programs and both paragraphs are recomputed here with the same code and the saved funds figures.
 */
export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("Invalid request.");
  if (p.data.website) return NextResponse.json({ ok: true }); // honeypot: bots fill the hidden field; say nothing useful
  if (!(await rateLimit(`aiman:${clientIp(req)}`, LEAD_LIMIT_PER_HOUR, 3600_000))) return bad("Too many tries. Please wait a little.", 429);
  const answers = cleanAnswers(p.data.answers);
  if (!answers) return bad("Some answers are missing or not valid.");
  const db = serviceClient();
  if (!db) return bad("Not available right now.", 503);

  const { data: st } = await db.from("aiman_settings").select("funds").eq("id", 1).maybeSingle();
  const funds = mergeFunds(st?.funds);
  const phoneIn = p.data.step === "complete" ? answers.phone ?? cleanPhone(p.data.phone ?? "") : null;
  if (p.data.step === "complete" && !phoneIn) return bad("Please enter a valid WhatsApp number.");
  // what is already saved for this lead is kept when a later call does not send it again
  let id = p.data.id, alreadySent = false, saved: { city: string | null; phone: string | null; secs: number | null } = { city: null, phone: null, secs: null };
  if (id) {
    const { data: ex } = await db.from("aiman_leads").select("id,email_sent,city,phone,secs").eq("id", id).maybeSingle();
    if (!ex) id = undefined; else { alreadySent = Boolean(ex.email_sent); saved = { city: ex.city, phone: ex.phone, secs: ex.secs }; }
  }
  const phone = phoneIn ?? saved.phone;
  const city = (p.data.city ?? "").trim().slice(0, 60) || saved.city;
  const secs = p.data.secs ?? saved.secs ?? undefined;
  const t = leadText(answers, funds, { secs, phone: phone ?? undefined, city: city ?? undefined });
  const utm = Object.fromEntries(Object.entries(p.data.utm ?? {}).slice(0, 12));

  const row = {
    status: t.status, name: answers.name!, city, visitor_country: p.data.country ?? null, lang: p.data.lang ?? null, purpose: answers.purposeKey,
    target_country: t.target, family_size: membersNum(answers), balance_lacs: answers.balNum, program: t.program, p1: t.p1, p2: t.p2, answers, utm,
    secs: secs ?? null, updated_at: new Date().toISOString(),
    ...(phone ? { phone } : {}), ...(phoneIn ? { completed_at: new Date().toISOString() } : {}),
  };
  if (id) {
    const { error } = await db.from("aiman_leads").update(row).eq("id", id);
    if (error) return bad("Could not save. Please try again.", 500);
  } else {
    const { data, error } = await db.from("aiman_leads").insert(row).select("id").single();
    if (error || !data) return bad("Could not save. Please try again.", 500);
    id = data.id as string;
  }
  if (p.data.step === "complete" && !alreadySent) {
    const sent = await notifyOwner(t.subject, leadEmailHtml(t));
    await db.from("aiman_leads").update({ email_sent: sent }).eq("id", id!);
  }
  return NextResponse.json({ ok: true, id });
}
