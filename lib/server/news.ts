import "server-only";
import { XMLParser } from "fast-xml-parser";
import { serviceClient } from "../supabase";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const INCLUDE = /(visa|visitor|visit|student|study permit|study visa|\bETA\b|e-?visa|schengen|biometric|\bVFS\b|\bfee|processing|immigration rules|international students|pakistan)/i;
const EXCLUDE = /(\bfuel\b|excise|tax relief|passport renewal|\bvot(e|er|ers|ing)\b|sentenced|\bcharged\b|indicted|arrested|pleads guilty)/i; // editable list: move to admin later

const text = (v: unknown): string => (typeof v === "string" ? v : v && typeof v === "object" ? text((v as Record<string, unknown>)["#text"] ?? "") : "");
const strip = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const linkOf = (l: unknown): string => {
  if (typeof l === "string") return l;
  if (Array.isArray(l)) { const alt = l.find((x) => x["@_rel"] === "alternate") ?? l[0]; return linkOf(alt); }
  if (l && typeof l === "object") return String((l as Record<string, string>)["@_href"] ?? "");
  return "";
};

export interface ParsedItem { title: string; url: string; published_at: string | null; summary: string }

export function parseFeed(xml: string): ParsedItem[] {
  const j = parser.parse(xml);
  const raw = j?.feed?.entry ?? j?.rss?.channel?.item ?? j?.["rdf:RDF"]?.item ?? [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.filter(Boolean).map((e: Record<string, unknown>) => {
    const d = text(e.updated ?? e.published ?? e.pubDate ?? e["dc:date"]);
    return {
      title: strip(text(e.title)).replace(/[‐-―]/g, "-").slice(0, 300),
      url: linkOf(e.link) || text(e.guid),
      published_at: d && !isNaN(Date.parse(d)) ? new Date(d).toISOString() : null,
      summary: strip(text(e.summary ?? e.description ?? e.content)).slice(0, 300), // excerpt only — never republish full text
    };
  }).filter((x) => x.title && x.url);
}

export const isRelevant = (i: ParsedItem) => INCLUDE.test(`${i.title} ${i.summary}`) && !EXCLUDE.test(i.title);

export async function fetchAllNews(): Promise<{ fetched: number; kept: number; errors: string[] }> {
  const db = serviceClient();
  if (!db) return { fetched: 0, kept: 0, errors: ["Supabase not configured"] };
  const { data: sources } = await db.from("news_sources").select("*").eq("is_active", true);
  const { data: countries } = await db.from("countries").select("country_code,keywords");
  let fetched = 0, kept = 0; const errors: string[] = [];
  await Promise.all((sources ?? []).map(async (s) => {
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 10_000);
      const res = await fetch(s.url, { signal: ctl.signal, headers: { "user-agent": "VisafeastBot/1.0 (+https://visafeast.com)" } });
      clearTimeout(to);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      if (s.kind === "youtube_channel") {
        const j = parser.parse(xml);
        const entries = [j?.feed?.entry ?? []].flat();
        for (const e of entries) {
          const vid = text(e["yt:videoId"]);
          if (!vid) continue;
          await db.from("youtube_videos").upsert({ source_id: s.id, video_id: vid, title: text(e.title), description: text(e["media:group"]?.["media:description"]).slice(0, 1000), published_at: text(e.published) || null }, { onConflict: "video_id", ignoreDuplicates: true });
          fetched++;
        }
      } else {
        const news = s.kind === "google_news_rss"; // news-search feeds: headline + outlet only (no excerpt), newest 15 that pass the visa filter
        const { data: have } = await db.from("news_items").select("title").eq("source_id", s.id).limit(500);
        const known = new Set((have ?? []).map((h: { title: string }) => h.title));
        const rows: Record<string, unknown>[] = [];
        for (const it of parseFeed(xml).slice(0, 60)) {
          if (news && rows.length >= 15) break;
          fetched++;
          if (!isRelevant(it) || known.has(it.title)) continue;
          const hay = `${it.title} ${it.summary}`.toLowerCase();
          // A story belongs to the country of the official source it came from. Keyword matching is only a fallback for sources
          // that cover several countries, and it matches whole words only (short codes like "th" or "us" would match "the" or "us").
          const codes = new Set<string>(s.country_codes ?? []);
          if (!codes.size) for (const c of countries ?? []) if ((c.keywords ?? []).some((k: string) => k.length >= 4 && new RegExp(`(?<![a-z])${k.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`).test(hay))) codes.add(c.country_code);
          known.add(it.title);
          const topics = ["visit", "study", "fee", "processing", "policy"].filter((t) => hay.includes(t === "fee" ? "fee" : t));
          rows.push({ source_id: s.id, title: it.title, url: it.url, published_at: it.published_at, summary: news ? "" : it.summary, country_codes: [...codes], topics });
        }
        if (rows.length) { const { error } = await db.from("news_items").upsert(rows, { onConflict: "url", ignoreDuplicates: true }); if (error) throw new Error(error.message); kept += rows.length; }
      }
      await db.from("news_sources").update({ last_fetched_at: new Date().toISOString(), last_status: "ok" }).eq("id", s.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${s.name}: ${msg}`);
      await db.from("news_sources").update({ last_fetched_at: new Date().toISOString(), last_status: `error: ${msg}`.slice(0, 200) }).eq("id", s.id);
    }
  }));
  return { fetched, kept, errors };
}
