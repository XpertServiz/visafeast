import "server-only";
import { siteConfig } from "@/config/site";

/** IndexNow (free) tells Bing/Yandex a page changed. Silent no-op until INDEXNOW_KEY is set and the site is on a real domain. */
export async function pingIndexNow(paths: string[]): Promise<boolean> {
  const key = process.env.INDEXNOW_KEY;
  const base = siteConfig.url;
  if (!key || /localhost|127\.0\.0\.1/.test(base)) return false;
  try {
    const host = new URL(base).host;
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ host, key, keyLocation: `${base}/${key}.txt`, urlList: paths.map((p) => `${base}${p}`) }),
    });
    return r.ok || r.status === 202;
  } catch { return false; }
}
