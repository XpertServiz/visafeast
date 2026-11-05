import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit, visitorHash } from "@/lib/server/guard";
import { CHAT_SYSTEM, llm, llmAvailable } from "@/lib/server/llm";
import { getAllFaqs, getCountries } from "@/lib/data";

const schema = z.object({ message: z.string().trim().min(2).max(500), locale: z.enum(["en", "ur"]).default("en") });
const STOP = new Set("the a an is are do does i you to for of in on and or my me can how what visa".split(" "));
const tokens = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

interface Doc { text: string; link: string; title: string; body: string }

/** FAQ-first pipeline (brief §11): confident match -> answer without LLM; else LLM with top snippets; else WhatsApp hand-off. */
export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ answer: "Could you rephrase that?" }, { status: 422 });
  if (!(await rateLimit(`chat:${visitorHash(req)}`, 10, 86400_000)) || !(await rateLimit(`chat-ip:${clientIp(req)}`, 40, 86400_000)))
    return NextResponse.json({ answer: "You've reached today's message limit. Please continue on WhatsApp with our consultant." });

  const [faqs, countries] = await Promise.all([getAllFaqs(), getCountries()]);
  const docs: Doc[] = [
    ...faqs.map((f) => ({ title: f.question, body: f.answer_md, text: `${f.question} ${f.answer_md}`, link: f.country_slug ? `/visit-visa/${f.country_slug}` : "/#faq" })),
    ...countries.map((c) => {
      const base = c.kind === "visit" ? "visit-visa" : c.kind === "study" ? "study-visa" : "immigration";
      const body = [c.intro, c.funds_md, c.embassy_fee_text && `Embassy fee: ${c.embassy_fee_text}`, c.processing_time_text && `Processing: ${c.processing_time_text}`, c.documents.map((d) => d.title).join("; ")].filter(Boolean).join(" ");
      return { title: c.h1, body, text: `${c.h1} ${c.country_name} ${c.visa_name} ${body}`, link: `/${base}/${c.slug}` };
    }),
  ];
  const q = new Set(tokens(p.data.message));
  const scored = docs.map((d) => { const t = tokens(d.text); const hit = t.filter((w) => q.has(w)).length; const titleHit = tokens(d.title).filter((w) => q.has(w)).length; return { d, score: (hit + titleHit * 3) / Math.sqrt(t.length + 5) }; }).sort((a, b) => b.score - a.score);
  const best = scored[0];
  const prefix = p.data.locale === "ur" ? "/ur" : "";
  const hand = p.data.locale === "ur" ? "اگر آپ کا سوال اپنے کیس کے بارے میں ہے تو واٹس ایپ پر کنسلٹنٹ سے بات کریں۔" : "For your own case, our consultant can help on WhatsApp.";

  if (best && best.score >= 0.9) {
    return NextResponse.json({ answer: `${best.d.body.slice(0, 420)}\n\n${hand}`, link: prefix + best.d.link });
  }
  if (best && best.score >= 0.35) {
    if (llmAvailable()) {
      const ctx = scored.slice(0, 4).filter((s) => s.score > 0.1).map((s) => `- ${s.d.title}: ${s.d.body.slice(0, 500)} (link: ${prefix}${s.d.link})`).join("\n");
      const out = await llm(CHAT_SYSTEM + ctx, p.data.message, 400);
      if (out) return NextResponse.json({ answer: out, link: prefix + best.d.link });
    }
    return NextResponse.json({ answer: `${best.d.body.slice(0, 420)}\n\n${hand}`, link: prefix + best.d.link });
  }
  return NextResponse.json({ answer: p.data.locale === "ur" ? "مجھے اس کا یقین نہیں۔ ہمارا کنسلٹنٹ واٹس ایپ پر جواب دے گا۔" : "I'm not sure about that one — our consultant can answer it on WhatsApp." });
}
