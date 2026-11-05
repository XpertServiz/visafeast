"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { parseYouTube } from "@/lib/youtube";

/** One box: paste a YouTube link (unlisted is fine), press Add. The video goes to the end of the list. */
export function VideoAdd({ action }: { action: (fd: FormData) => Promise<{ error?: string }> }) {
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const p = url ? parseYouTube(url) : null;
  const bad = url.trim() && !p;
  return (
    <form ref={form} style={{ display: "grid", gap: 12 }}
      action={async (fd) => {
        setBusy(true); setMsg(null);
        try { const r = await action(fd); if (r.error) setMsg({ ok: false, text: r.error }); else { setMsg({ ok: true, text: "Added. It is now on the homepage." }); setUrl(""); form.current?.reset(); } }
        catch { setMsg({ ok: false, text: "Could not add the video. Please try again." }); }
        setBusy(false);
      }}>
      <label className="lbl">YouTube link
        <input name="url" required className="field" dir="ltr" inputMode="url" placeholder="https://youtu.be/…  or  https://www.youtube.com/watch?v=…" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      {bad && <p role="alert" style={{ color: "var(--bad)", margin: 0 }}>This is not a YouTube link we recognise.</p>}
      {p && <div style={{ display: "flex", gap: 12, alignItems: "center" }}><Image src={`https://i.ytimg.com/vi/${p.id}/hqdefault.jpg`} alt="" width={120} height={68} style={{ borderRadius: 8, objectFit: "cover" }} /><span className="mono" style={{ fontSize: 13 }}>{p.id}{p.isShort ? " · Short" : ""}</span></div>}
      <details>
        <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Title or caption (optional)</summary>
        <div style={{ display: "grid", gap: 10 }}>
          <input name="title" className="field" placeholder="Title (left empty, we use the YouTube title)" aria-label="Title" />
          <input name="caption" className="field" placeholder="Short caption" aria-label="Caption" />
          <label><input type="checkbox" name="short" value="1" style={{ width: 20, height: 20, marginInlineEnd: 6 }} />This is a vertical Short (9:16)</label>
        </div>
      </details>
      {msg && <p role={msg.ok ? "status" : "alert"} style={{ margin: 0, fontWeight: 600, color: msg.ok ? "var(--ok)" : "var(--bad)" }}>{msg.text}</p>}
      <button className="btn btn-primary" disabled={busy || Boolean(bad)}><Plus size={18} aria-hidden />{busy ? "Adding…" : "Add video"}</button>
    </form>
  );
}
