import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit, verifyTurnstile, visitorHash } from "@/lib/server/guard";
import { decodeByRules, scrub } from "@/lib/decoder-rules";
import { DECODER_SYSTEM, llm, llmAvailable } from "@/lib/server/llm";
import { serviceClient } from "@/lib/supabase";

const schema = z.object({ text: z.string().trim().min(20).max(6000), locale: z.enum(["en", "ur"]).default("en"), turnstile: z.string().optional() });

/** Nothing is stored. Only an anonymous `decoder_used` event is logged (brief §8.4). */
export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ ok: false, error: "Please paste 20–6,000 characters." }, { status: 422 });
  if (!(await rateLimit(`decode:${visitorHash(req)}`, 3, 86400_000)) || !(await rateLimit(`decode-ip:${clientIp(req)}`, 10, 86400_000)))
    return NextResponse.json({ ok: false, error: "You have used today's 3 free decodes. Please book a free file review." }, { status: 429 });
  if (!(await verifyTurnstile(p.data.turnstile, req))) return NextResponse.json({ ok: false, error: "Bot check failed." }, { status: 400 });

  const text = scrub(p.data.text), lang = p.data.locale;
  let result: ReturnType<typeof decodeByRules> | { points: unknown[]; honest_view: string; language: string; mode: "llm" } = decodeByRules(text, lang);

  if (llmAvailable()) {
    const out = await llm(DECODER_SYSTEM(lang === "ur" ? "Urdu" : "English"), `LETTER_TEXT: ${text}`, 700);
    try {
      const j = out && JSON.parse(out.replace(/^```json\s*|```$/g, "").trim());
      if (j?.points && Array.isArray(j.points)) result = { ...j, mode: "llm" };
    } catch { /* keep rule-based result */ }
  }
  void serviceClient()?.from("events").insert({ name: "decoder_used", path: "/tools/refusal-decoder", visitor_hash: visitorHash(req), country: req.headers.get("x-vercel-ip-country") });
  return NextResponse.json({ ok: true, ...result });
}
