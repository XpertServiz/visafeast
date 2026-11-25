import "server-only";
import { cache } from "react";
import { serviceClient } from "@/lib/supabase";
import type { RealityCheck } from "@/lib/reality";

export const REALITY_COLS = "id,slug,title,claim,country,type,verdict,summary,what_true,what_misleading,what_missing,rows,checklist,sources,verified_on,ur_summary,status,published_at,updated_at";
/** Published fact-checks, newest first. Public pages are statically generated, so this runs only when a page is rebuilt. */
export const getRealityChecks = cache(async (): Promise<RealityCheck[]> => {
  const db = serviceClient(); if (!db) return [];
  try {
    const { data } = await db.from("reality_checks").select(REALITY_COLS).eq("status", "published").order("published_at", { ascending: false });
    return (data ?? []) as RealityCheck[];
  } catch { return []; }
});
export const getRealityCheck = async (slug: string) => (await getRealityChecks()).find((c) => c.slug === slug) ?? null;
