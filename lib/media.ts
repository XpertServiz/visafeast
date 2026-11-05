import "server-only";
import { cache } from "react";
import { anonClient } from "./supabase";
import { PHOTOS, type PhotoDef } from "./photos";

/** Photo chosen in Admin → Website → Photos (stored in the `media` table + Supabase Storage) wins over the built-in map. */
export const getPhotoMap = cache(async (): Promise<Record<string, PhotoDef>> => {
  const out: Record<string, PhotoDef> = { ...PHOTOS };
  const db = anonClient();
  if (!db) return out;
  try {
    const { data } = await db.from("media").select("slot,storage_path,alt_en,alt_ur,photographer,source_url,licence").not("slot", "is", null);
    for (const m of data ?? []) {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!m.slot || !base) continue;
      out[m.slot] = {
        ...out[m.slot],
        src: `${base}/storage/v1/object/public/media/${m.storage_path}`,
        alt: m.alt_en || out[m.slot]?.alt || "",
        alt_ur: m.alt_ur || out[m.slot]?.alt_ur,
        credit: m.photographer ?? undefined, sourceUrl: m.source_url ?? undefined, licence: m.licence ?? undefined,
      };
    }
  } catch { /* table missing: use built-in map */ }
  return out;
});
