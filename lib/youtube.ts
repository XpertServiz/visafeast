// Parse an 11-character YouTube ID from every URL format in brief §9.9. Returns null for anything else.
export function parseYouTube(input: string): { id: string; isShort: boolean } | null {
  const raw = input.trim();
  if (!raw) return null;
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); } catch { return null; }
  const host = u.hostname.replace(/^(www\.|m\.)/, "");
  const ID = /^[A-Za-z0-9_-]{11}$/;
  let id: string | null = null, isShort = false;
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] === "watch") id = u.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(parts[0])) { id = parts[1]; isShort = parts[0] === "shorts"; }
  }
  return id && ID.test(id) ? { id, isShort } : null;
}
