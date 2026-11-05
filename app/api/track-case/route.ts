import { LOCALE_CODES, type Locale } from "@/config/locales";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit, verifyTurnstile } from "@/lib/server/guard";
import { serviceClient } from "@/lib/supabase";
import { buildTimeline, last4Matches, nextStep, normRef, validRef } from "@/lib/track";

const schema = z.object({ ref: z.string().trim().max(20), last4: z.string().trim().max(8), locale: z.enum(LOCALE_CODES as [Locale, ...Locale[]]).default("en").transform((l) => (l === "ur" ? "ur" as const : "en" as const)), turnstile: z.string().optional() });
const NOPE = { ok: false, error: "We could not find a file with those details. Please check your reference number and the last 4 digits of your phone number." };

/** Shows ONLY the stage timeline and the next step — never documents, notes or money (brief §9A.2). */
export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success || !validRef(p.data.ref)) return NextResponse.json(NOPE, { status: 404 });
  if (!(await rateLimit(`track:${clientIp(req)}`, 12, 3600_000))) return NextResponse.json({ ok: false, error: "Too many tries. Please wait an hour or message us on WhatsApp." }, { status: 429 });
  if (!(await verifyTurnstile(p.data.turnstile, req))) return NextResponse.json({ ok: false, error: "Bot check failed." }, { status: 400 });
  const db = serviceClient();
  if (!db) return NextResponse.json(NOPE, { status: 404 });

  const { data: c } = await db.from("cases").select("ref,service_type,stage,decision,person:people(whatsapp)").eq("ref", normRef(p.data.ref)).is("deleted_at", null).maybeSingle();
  const person = (Array.isArray(c?.person) ? c?.person[0] : c?.person) as { whatsapp: string | null } | null | undefined;
  // identical answer for "no such file" and "wrong digits" so references cannot be guessed
  if (!c || !last4Matches(person?.whatsapp, p.data.last4)) return NextResponse.json(NOPE, { status: 404 });

  const { data: tpl } = await db.from("case_stage_templates").select("stage,label_en,label_ur,sort").eq("service_type", c.service_type);
  return NextResponse.json({
    ok: true, ref: c.ref, current: c.stage, decision: c.decision ?? null,
    timeline: buildTimeline(tpl ?? [], c.stage, p.data.locale), next: nextStep(c.stage, p.data.locale),
  });
}
