import { headers } from "next/headers";
import { aimanLangFor } from "@/config/locales";
import { mergeFunds } from "@/config/aiman";
import { getSettings, getVideos } from "@/lib/data";
import { serviceClient } from "@/lib/supabase";
import { loadDict } from "@/lib/aiman/dict";
import { AimanApp } from "@/components/aiman/AimanApp";

export const dynamic = "force-dynamic"; // the language depends on where the visitor is

export default async function TalkWithAiman({ searchParams }: { searchParams: Promise<{ geo?: string }> }) {
  const [h, sp] = await Promise.all([headers(), searchParams]);
  // the country comes from the hosting edge; ?geo=XX lets the team preview another country
  const raw = (sp.geo || h.get("x-vercel-ip-country") || "").toUpperCase();
  const country = /^[A-Z]{2}$/.test(raw) ? raw : null;
  const lang = aimanLangFor(country);
  const db = serviceClient();
  const [dict, settings, videos, saved] = await Promise.all([
    loadDict(lang), getSettings(), getVideos(),
    db ? db.from("aiman_settings").select("funds").eq("id", 1).maybeSingle().then((r) => r.data?.funds ?? null, () => null) : Promise.resolve(null),
  ]);
  return <AimanApp country={country} lang={lang} dict={dict} funds={mergeFunds(saved)} whatsapp={settings.whatsapp_number} videos={videos} />;
}
