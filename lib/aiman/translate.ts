import "server-only";
import { COPY } from "./copy";
import { serviceClient } from "../supabase";

// "Translate once": for a visitor country whose language has no ready-made file, GPT translates all the page's words ONE time, the result is saved
// in the database and every later visitor reuses it. Never per visitor. The first visitor from a new language sees English while it is made.
const KEY = (code: string) => `aiman-ui:${code}:v1`;
const NAMES: Record<string, string> = { ja: "Japanese", zh: "Simplified Chinese", ko: "Korean", th: "Thai", vi: "Vietnamese", pl: "Polish", el: "Greek", sv: "Swedish", da: "Danish", no: "Norwegian", fi: "Finnish", cs: "Czech", hu: "Hungarian", ro: "Romanian", uk: "Ukrainian", he: "Hebrew", sw: "Swahili" };
export const canTranslate = (code: string) => Boolean(NAMES[code]) && Boolean(process.env.OPENAI_API_KEY);

export async function cachedDict(code: string): Promise<Record<string, string> | null> {
  const db = serviceClient(); if (!db) return null;
  const { data } = await db.from("chat_cache").select("answer").eq("q_hash", KEY(code)).maybeSingle();
  try { return data?.answer ? (JSON.parse(data.answer) as Record<string, string>) : null; } catch { return null; }
}

const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).filter((x) => x !== "{s}").sort().join();

/** One GPT call for the whole page. Rows that lose a {placeholder} are dropped (they show English), so a bad translation can never break the chat. */
export async function translateOnce(code: string): Promise<boolean> {
  const db = serviceClient(), lang = NAMES[code];
  if (!db || !lang || !process.env.OPENAI_API_KEY || (await cachedDict(code))) return false;
  const src = Object.fromEntries(Object.entries(COPY).filter(([, r]) => !/^[\d–+\s]+$/.test(r[0])).map(([id, r]) => [id, r[0]]));
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0.2, max_tokens: 16000, response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `You translate the text of a visa-advice chat from English into ${lang}. The speaker is Aiman, a friendly woman advisor at Visafeast. Rules: keep every {placeholder} such as {name}, {n}, {bal}, {need}, {list}, {people} exactly as written; keep the words Visafeast, Aiman, WhatsApp, PKR, IELTS, PTE, Duolingo, NTN, SECP, PR and email addresses unchanged; keep emojis, arrows and numbers; "lacs"/"lakh" is 100,000 rupees (keep the word lakh or its usual local spelling); be warm, short and polite; never promise a visa. Reply with one JSON object with exactly the same keys, values translated.` },
          { role: "user", content: JSON.stringify(src) },
        ],
      }),
    });
    const j = await r.json();
    const out = JSON.parse(j?.choices?.[0]?.message?.content ?? "{}") as Record<string, unknown>;
    const clean: Record<string, string> = {};
    for (const [id, v] of Object.entries(out)) if (COPY[id] && typeof v === "string" && v.trim() && ph(COPY[id][0]) === ph(v)) clean[id] = v.trim();
    if (Object.keys(clean).length < 100) return false; // not a usable translation: try again on a later visit
    await db.from("chat_cache").upsert({ q_hash: KEY(code), answer: JSON.stringify(clean), link: null, created_at: new Date().toISOString() });
    return true;
  } catch (e) { console.error("[aiman translate]", e instanceof Error ? e.message : e); return false; }
}
