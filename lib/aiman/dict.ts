import "server-only";
import { COPY } from "./copy";
import ar from "./gen/ar.json";
import { after } from "next/server";
import { AIMAN_FILE_LANGS } from "@/config/locales";
import { cachedDict, canTranslate, translateOnce } from "./translate";

/** The visitor's-language text for every copy id. Urdu and Arabic come from the approved prototype; the others from lib/aiman/gen/<code>.json. */
export async function loadDict(code: string | null): Promise<Record<string, string>> {
  if (!code) return {};
  if (code === "ur") return Object.fromEntries(Object.entries(COPY).map(([id, r]) => [id, r[1]]));
  if (code === "ar") return { ...(ar as Record<string, string>), ...Object.fromEntries(Object.entries(COPY).filter(([, r]) => r[2]).map(([id, r]) => [id, r[2]!])) };
  if (!AIMAN_FILE_LANGS.includes(code)) {
    const saved = await cachedDict(code);
    if (saved) return saved;
    if (canTranslate(code)) after(() => translateOnce(code)); // made once in the background; the next visitor gets it
    return {};
  }
  try {
    const m = await LOADERS[code]?.();
    return (m?.default ?? {}) as Record<string, string>;
  } catch { return {}; } // a missing file shows English only
}

const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  de: () => import("./gen/de.json"), es: () => import("./gen/es.json"), fr: () => import("./gen/fr.json"), tr: () => import("./gen/tr.json"), hi: () => import("./gen/hi.json"),
  bn: () => import("./gen/bn.json"), id: () => import("./gen/id.json"), ms: () => import("./gen/ms.json"), pt: () => import("./gen/pt.json"), it: () => import("./gen/it.json"),
  ru: () => import("./gen/ru.json"), fa: () => import("./gen/fa.json"), nl: () => import("./gen/nl.json"),
};
