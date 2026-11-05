import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { clientIp, rateLimit, visitorHash } from "@/lib/server/guard";
import { CHAT_SYSTEM, llm, llmAvailable } from "@/lib/server/llm";
import { getAllFaqs, getCountries } from "@/lib/data";
import { answerFromSite, buildKb, cacheKey, withEnglishHints, words } from "@/lib/chatbot";
import { serviceClient } from "@/lib/supabase";
import { LOCALE_CODES, localeMeta, lp, type Locale } from "@/config/locales";
import { getT } from "@/lib/i18n";
import { originCountry, withOrigin } from "@/lib/server/origin";

const schema = z.object({ message: z.string().trim().min(1).max(500), locale: z.enum(LOCALE_CODES as [Locale, ...Locale[]]).default("en"), lastCountry: z.string().max(80).optional() });
const CACHE_DAYS = 7;

/** Three steps, cheapest first: (1) answer from the site's own content, free; (2) reuse a saved GPT answer, free; (3) only then ask GPT, and save the answer. */
export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ answer: "Could you rephrase that?" }, { status: 422 });
  const vh = visitorHash(req), uiLoc = p.data.locale, loc = uiLoc === "ur" ? "ur" : "en";
  // A visitor outside Pakistan gets "UK Visit Visa from Saudi Arabia" instead of "...from Pakistan". Saved GPT answers stay generic.
  const cc = originCountry(req);
  const reply = (b: { answer: string; country?: string } & Record<string, unknown>, init?: ResponseInit) =>
    NextResponse.json(cc ? { ...b, answer: withOrigin(b.answer, cc, uiLoc, Boolean(b.country)) } : b, init);
  const otherLang = uiLoc !== "en" && uiLoc !== "ur"; // answers come from English content; GPT can reply in the visitor's language
  const fixLink = (l?: string) => (l && otherLang && l.startsWith("/") ? lp(uiLoc, l) : l);
  if (!(await rateLimit(`chat:${vh}`, 60, 86400_000)) || !(await rateLimit(`chat-ip:${clientIp(req)}`, 200, 86400_000)))
    return reply({ answer: getT(uiLoc)("ui.chatLimit") });

  const [faqs, countries] = await Promise.all([getAllFaqs(), getCountries()]);
  const kb = buildKb(faqs, countries, loc);
  const site = answerFromSite(otherLang ? withEnglishHints(p.data.message) : p.data.message, { kb, countries, locale: loc, lastCountry: p.data.lastCountry });
  // Other languages: GPT answers from the same site content in the visitor's language when switched on; otherwise the free English answer.
  const viaGpt = otherLang && llmAvailable() && words(p.data.message).length >= 2;
  if (site.kind !== "none" && !viaGpt) return reply({ answer: site.answer, link: fixLink(site.link), country: site.country, suggest: site.suggest, source: "site" });

  // Too short to be a real question, or GPT not switched on: hand over without spending anything.
  if (!llmAvailable() || words(p.data.message).length < 2) return reply({ answer: site.answer, link: fixLink(site.link), handoff: true, source: "site" });

  const db = serviceClient();
  const hash = createHash("sha256").update(cacheKey(p.data.message, uiLoc)).digest("hex");
  if (db) {
    const { data: hit } = await db.from("chat_cache").select("answer,link").eq("q_hash", hash).gte("created_at", new Date(Date.now() - CACHE_DAYS * 86400_000).toISOString()).maybeSingle();
    if (hit) return reply({ answer: hit.answer, link: hit.link ?? undefined, source: "cache" });
  }
  // Spending limits: per visitor, and a daily total shared across the whole site.
  const cap = Number(process.env.LLM_DAILY_CAP || 60);
  if (!(await rateLimit(`llm:${vh}`, 5, 86400_000)) || !(await rateLimit(`llm-day:${new Date().toISOString().slice(0, 10)}`, cap, 86400_000)))
    return reply({ answer: site.answer, handoff: true, source: "site" });

  const snippets = site.context?.length ? site.context : (site.kind !== "none" ? [{ title: "Website answer", body: site.answer, link: site.link ?? "" }] : []);
  const context = snippets.length ? snippets.map((d) => `- ${d.title}: ${d.body.slice(0, 450)} (link: ${d.link})`).join("\n") : "(no matching content)";
  const out = await llm(`${CHAT_SYSTEM}${context}\nReply in ${localeMeta(uiLoc).english}. Keep every number and amount exactly as in the content.`, p.data.message, 220);
  if (!out) return reply({ answer: site.answer, handoff: true, source: "site" });
  const link = fixLink(snippets[0]?.link || undefined);
  if (db) await db.from("chat_cache").upsert({ q_hash: hash, answer: out, link: link ?? null, created_at: new Date().toISOString() });
  return reply({ answer: out, link, source: "gpt" });
}
