"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { parseYouTube } from "@/lib/youtube";

interface Row { key: number; url: string; title: string; caption: string; short: boolean; active: boolean }
let k = 100;

export function VideosEditor({ initial, action }: { initial: { url: string; title: string; caption: string; short: boolean; active: boolean }[]; action: (fd: FormData) => Promise<void> }) {
  const [rows, setRows] = useState<Row[]>(() => {
    const base = initial.map((r, i) => ({ ...r, key: i }));
    while (base.length < 3) base.push({ key: k++, url: "", title: "", caption: "", short: false, active: true });
    return base;
  });
  const [drag, setDrag] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const set = (key: number, p: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const move = (i: number, d: number) => setRows((r) => { const n = [...r], j = i + d; if (j < 0 || j >= n.length) return r; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const active = rows.filter((r) => r.url && r.active).length;

  return (
    <form action={async (fd) => { try { await action(fd); setMsg("Saved. The homepage now shows your videos."); } catch (e) { setMsg(e instanceof Error ? e.message : "Could not save"); } }} style={{ display: "grid", gap: 12 }}>
      {rows.map((r, i) => {
        const p = r.url ? parseYouTube(r.url) : null;
        const bad = r.url && !p;
        return (
          <div key={r.key} className="card" draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag !== null && drag !== i) setRows((x) => { const n = [...x]; const [m] = n.splice(drag, 1); n.splice(i, 0, m); return n; }); setDrag(null); }}
            style={{ padding: 14, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <GripVertical aria-hidden style={{ cursor: "grab", flex: "none" }} /><b>Video {i + 1}</b>
              <span style={{ marginInlineStart: "auto", display: "flex", gap: 4 }}>
                <button type="button" className="btn btn-outline" aria-label="Move up" style={{ minHeight: 44, minWidth: 44, padding: 0 }} onClick={() => move(i, -1)}><ArrowUp size={18} /></button>
                <button type="button" className="btn btn-outline" aria-label="Move down" style={{ minHeight: 44, minWidth: 44, padding: 0 }} onClick={() => move(i, 1)}><ArrowDown size={18} /></button>
                <button type="button" className="btn btn-outline" aria-label="Delete video" style={{ minHeight: 44, minWidth: 44, padding: 0 }} onClick={() => { if (!r.url || confirm("Remove this video?")) setRows((x) => x.filter((y) => y.key !== r.key)); }}><Trash2 size={18} /></button>
              </span>
            </div>
            <input name="url" className="field" placeholder="Paste YouTube link" value={r.url} onChange={(e) => { const u = e.target.value; const pp = parseYouTube(u); set(r.key, { url: u, short: pp?.isShort ?? r.short }); }} aria-label={`YouTube link ${i + 1}`} />
            {bad && <p role="alert" style={{ color: "var(--bad)", margin: 0 }}>This is not a YouTube link we recognise.</p>}
            {p && <div style={{ display: "flex", gap: 12, alignItems: "center" }}><Image src={`https://i.ytimg.com/vi/${p.id}/hqdefault.jpg`} alt="" width={120} height={68} style={{ borderRadius: 8, objectFit: "cover" }} /><span className="mono" style={{ fontSize: 13 }}>{p.id}{p.isShort ? " · Short" : ""}</span></div>}
            <input name="title" className="field" placeholder="Title (filled in automatically)" value={r.title} onChange={(e) => set(r.key, { title: e.target.value })} aria-label="Title" />
            <input name="caption" className="field" placeholder="Short caption (optional)" value={r.caption} onChange={(e) => set(r.key, { caption: e.target.value })} aria-label="Caption" />
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <label><input type="checkbox" checked={r.short} onChange={(e) => set(r.key, { short: e.target.checked })} style={{ width: 20, height: 20, marginInlineEnd: 6 }} />Short (9:16)</label>
              <label><input type="checkbox" checked={r.active} onChange={(e) => set(r.key, { active: e.target.checked })} style={{ width: 20, height: 20, marginInlineEnd: 6 }} />Show on website</label>
            </div>
            <input type="hidden" name="short" value={r.short ? "1" : "0"} /><input type="hidden" name="active" value={r.active ? "1" : "0"} />
          </div>
        );
      })}
      <button type="button" className="btn btn-outline" onClick={() => setRows((r) => [...r, { key: k++, url: "", title: "", caption: "", short: false, active: true }])}><Plus size={18} aria-hidden />Add video</button>
      <p style={{ color: "var(--muted)", margin: 0 }}>1–3 videos show side by side; 4 or more turn into a swipeable slider. You have {active} showing.</p>
      {msg && <p role="status" style={{ margin: 0, fontWeight: 600 }}>{msg}</p>}
      <button className="btn btn-primary" type="submit">Save</button>
    </form>
  );
}
