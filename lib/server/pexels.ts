import "server-only";

export interface PexelsPhoto { id: number; alt: string; photographer: string; url: string; thumb: string; large: string; width: number; height: number }
export const pexelsConfigured = () => Boolean(process.env.PEXELS_API_KEY);

type Raw = { id: number; alt?: string; photographer: string; url: string; width: number; height: number; src: { medium: string; large2x: string } };
const shape = (p: Raw): PexelsPhoto => ({ id: p.id, alt: p.alt ?? "", photographer: p.photographer, url: p.url, thumb: p.src.medium, large: p.src.large2x, width: p.width, height: p.height });
const headers = () => ({ Authorization: process.env.PEXELS_API_KEY! });

export async function searchPexels(q: string): Promise<PexelsPhoto[]> {
  if (!pexelsConfigured() || !q.trim()) return [];
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q.slice(0, 80))}&per_page=18&orientation=landscape`, { headers: headers(), cache: "no-store" });
  if (!r.ok) return [];
  return ((await r.json()).photos as Raw[]).map(shape);
}
/** Looked up from the Pexels API by id — we never download a URL that the browser sent us. */
export async function getPexelsPhoto(id: number): Promise<PexelsPhoto | null> {
  if (!pexelsConfigured() || !Number.isInteger(id) || id <= 0) return null;
  const r = await fetch(`https://api.pexels.com/v1/photos/${id}`, { headers: headers(), cache: "no-store" });
  return r.ok ? shape((await r.json()) as Raw) : null;
}
export async function downloadPexelsImage(url: string): Promise<Buffer | null> {
  if (new URL(url).hostname !== "images.pexels.com") return null;
  const r = await fetch(url, { cache: "no-store" });
  return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
}
