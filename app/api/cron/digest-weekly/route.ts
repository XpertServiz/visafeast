import { NextResponse, type NextRequest } from "next/server";
import { serviceClient } from "@/lib/supabase";
import { llm, llmAvailable } from "@/lib/server/llm";
import { notifyOwner } from "@/lib/server/notify";
import { siteConfig } from "@/config/site";

export const maxDuration = 60;

const SYSTEM = `You write a short weekly visa-news digest for Visafeast, a visit & study visa consultancy in Pakistan.
Audience: Pakistani travellers, families and students. Plain English, short sentences.
Rules:
- Use ONLY the items provided. Do not add facts, numbers, dates or rules that are not in the items.
- Write in your own words. Never copy sentences from the items.
- For each point, add "What it means for Pakistani applicants" in one sentence, and the source link.
- If an item is not relevant to Pakistani passport holders, either skip it or say clearly that it does not apply to them.
- No visa guarantees, no legal advice, no exaggeration, no clickbait.
- YouTube items are UNVERIFIED claims. For each, state the claim in one neutral sentence and return "supported_by" = the URL of an official item that supports it, or null. Never present an unsupported claim as fact.
Return JSON: { "title": str, "excerpt": str (<=155 chars), "body_md": str, "sources": [{"title","url"}], "country_codes": [str], "youtube": [{"video_id","claim","supported_by"}] }`;

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ ok: false }, { status: 401 });
  const db = serviceClient();
  if (!db) return NextResponse.json({ ok: false, error: "no db" }, { status: 503 });

  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [{ data: items }, { data: vids }, { data: settings }] = await Promise.all([
    db.from("news_items").select("title,url,published_at,summary,country_codes,source:news_sources(name,is_official)").eq("is_relevant", true).gte("created_at", since).limit(40),
    db.from("youtube_videos").select("video_id,title,description,published_at").eq("verification", "unchecked").gte("published_at", since).limit(10),
    db.from("settings").select("digest_auto_publish").eq("id", 1).maybeSingle(),
  ]);
  const official = (items ?? []).filter((i) => (i as unknown as { source: { is_official: boolean } | null }).source?.is_official);
  const wkStart = since.slice(0, 10), wkEnd = new Date().toISOString().slice(0, 10);
  const slug = `visa-updates-week-of-${wkEnd}`;

  let post: { title: string; excerpt: string; body_md: string; sources: unknown[]; country_codes: string[]; youtube?: { video_id: string; claim: string; supported_by: string | null }[] } | null = null;
  let by = "human";
  if (llmAvailable() && official.length) {
    const out = await llm(SYSTEM, `Week: ${wkStart}–${wkEnd}\nOFFICIAL_ITEMS: ${JSON.stringify(official)}\nYOUTUBE_ITEMS: ${JSON.stringify(vids ?? [])}`, 1500);
    try { post = out ? JSON.parse(out.replace(/^```json\s*|```$/g, "").trim()) : null; by = `llm:${process.env.LLM_PROVIDER}`; } catch { post = null; }
  }
  if (!post) {
    // zero-cost mode: simple list for the owner to annotate
    post = {
      title: `Visa updates this week (${wkStart} to ${wkEnd})`, excerpt: "A list of this week's official visa updates, with sources.",
      body_md: official.length ? official.map((i) => `- **${i.title}** — [source](${i.url})`).join("\n") : "No relevant official updates were found this week.",
      sources: official.map((i) => ({ title: i.title, url: i.url })), country_codes: [...new Set(official.flatMap((i) => i.country_codes ?? []))],
    };
  }
  const autoPublish = Boolean(settings?.digest_auto_publish);
  const body = `${post.body_md}\n\n*Last updated ${wkEnd}. ${siteConfig.disclaimer}*`;
  await db.from("posts").upsert({
    slug, type: "digest", title: post.title, excerpt: post.excerpt?.slice(0, 155), body_md: body, sources: post.sources, country_codes: post.country_codes,
    status: autoPublish ? "published" : "draft", generated_by: by, published_at: autoPublish ? new Date().toISOString() : null,
    meta_title: `${post.title} | Visafeast`.slice(0, 60), meta_description: post.excerpt?.slice(0, 155),
  }, { onConflict: "slug" });
  // YouTube claims: supported -> confirmed (never published as fact unless confirmed); unsupported -> unconfirmed
  for (const y of post.youtube ?? []) {
    await db.from("youtube_videos").update({ claim: y.claim, verification: y.supported_by ? "confirmed" : "unconfirmed", official_url: y.supported_by, checked_at: new Date().toISOString() }).eq("video_id", y.video_id);
  }
  if (!autoPublish) void notifyOwner("Weekly digest ready for approval", `<p>Your weekly visa digest draft is ready.</p><p><a href="${siteConfig.url}/admin/website/news">Open the admin to approve it</a></p>`);
  return NextResponse.json({ ok: true, slug, items: official.length, generated_by: by });
}
