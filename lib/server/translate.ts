import "server-only";
import { LOCALES, type Locale } from "@/config/locales";
import { llm, llmAvailable } from "./llm";
import { serviceClient } from "../supabase";
import { SEED_COUNTRIES } from "../seed";
import { countrySource, faqSource, keepSafe, postSource, sourceHash, translateSystem } from "../translate";
import type { Country } from "../types";

type Db = NonNullable<ReturnType<typeof serviceClient>>;
interface Job { entity: "country" | "faq" | "post"; id: string; locale: Locale; language: string; source: unknown; hash: string }

const parse = (out: string | null): unknown => {
  if (!out) return null;
  try { return JSON.parse(out.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "")); } catch { return null; }
};

/**
 * Translates whatever is new or changed, into every language, until the time budget runs out. The rest continues on the next run.
 * Safe to run any time: nothing is re-translated while the English stays the same, so this costs nothing on a quiet day.
 */
export async function translateContent(db: Db, budgetMs = 40000) {
  if (!llmAvailable()) return { skipped: "no AI key", done: 0, remaining: 0 };
  const started = Date.now();
  const [{ data: countries }, { data: faqs }, { data: posts }, { data: existing }] = await Promise.all([
    db.from("countries").select("*").eq("is_published", true),
    db.from("faqs").select("id,question,answer_md").eq("is_published", true),
    db.from("posts").select("id,title,excerpt,body_md"),
    db.from("content_translations").select("entity,entity_id,locale,source_hash"),
  ]);
  const have = new Set((existing ?? []).map((r) => `${r.entity}:${r.entity_id}:${r.locale}:${r.source_hash}`));
  const list = ((countries?.length ? countries : SEED_COUNTRIES) as Country[]);
  const sources: { entity: Job["entity"]; id: string; source: unknown; approvedUrdu?: boolean }[] = [
    ...list.map((c) => ({ entity: "country" as const, id: c.id, source: countrySource(c), approvedUrdu: c.ur_status === "approved" })),
    ...(faqs ?? []).map((f) => ({ entity: "faq" as const, id: f.id as string, source: faqSource(f as { question: string; answer_md: string }) })),
    ...(posts ?? []).map((p) => ({ entity: "post" as const, id: p.id as string, source: postSource(p as { title: string; excerpt: string | null; body_md: string }) })),
  ];
  const jobs: Job[] = [];
  for (const s of sources) {
    const hash = sourceHash(s.source);
    for (const l of LOCALES) {
      if (l.code === "en" || (l.code === "ur" && s.approvedUrdu)) continue; // owner-approved Urdu is never overwritten
      if (!have.has(`${s.entity}:${s.id}:${l.code}:${hash}`)) jobs.push({ entity: s.entity, id: s.id, locale: l.code, language: l.english, source: s.source, hash });
    }
  }
  let done = 0, failed = 0, next = 0;
  const worker = async () => {
    while (next < jobs.length && Date.now() - started < budgetMs) {
      const j = jobs[next++];
      const json = parse(await llm(translateSystem(j.language), JSON.stringify(j.source), 6000));
      if (!json) { failed++; continue; }
      const { error } = await db.from("content_translations").upsert({ entity: j.entity, entity_id: j.id, locale: j.locale, source_hash: j.hash, content: keepSafe(j.source, json), updated_at: new Date().toISOString() });
      if (error) failed++; else done++;
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return { done, failed, remaining: Math.max(0, jobs.length - next) };
}
