"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

export interface ChatMsg { id: number; sender: "client" | "staff"; body: string; created_at: string }
export interface ChatText { placeholder: string; send: string; empty: string; me: string; them: string; failed: string }

/** Client ↔ consultant chat. Checks for new messages every 10 seconds while the page is visible (free, no extra service). */
export function ChatThread({ endpoint, query = "", me, initial, text, height = 380 }: {
  endpoint: string; query?: string; me: "client" | "staff"; initial: ChatMsg[]; text: ChatText; height?: number;
}) {
  const [list, setList] = useState<ChatMsg[]>(initial);
  const [draft, setDraft] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const last = useRef(initial.at(-1)?.id ?? 0);

  const merge = useCallback((more: ChatMsg[]) => {
    if (!more.length) return;
    setList((cur) => { const seen = new Set(cur.map((m) => m.id)); return [...cur, ...more.filter((m) => !seen.has(m.id))]; });
    last.current = Math.max(last.current, ...more.map((m) => m.id));
  }, []);

  useEffect(() => {
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch(`${endpoint}?after=${last.current}${query ? `&${query}` : ""}`, { cache: "no-store" });
        if (r.ok) merge((await r.json()).messages ?? []);
      } catch { /* try again next time */ }
    };
    const t = setInterval(poll, 10_000);
    return () => clearInterval(t);
  }, [endpoint, query, merge]);

  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [list.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${endpoint}${query ? `?${query}` : ""}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || text.failed);
      merge([j.message]); setDraft("");
    } catch (x) { setErr(x instanceof Error ? x.message : text.failed); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div ref={box} aria-live="polite" style={{ height, overflowY: "auto", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {list.length === 0 && <p style={{ margin: "auto", color: "var(--muted)", textAlign: "center" }}>{text.empty}</p>}
        {list.map((m) => {
          const mine = m.sender === me;
          return (
            <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "85%", background: mine ? "var(--navy)" : "#fff", color: mine ? "#fff" : "var(--ink)", border: mine ? "none" : "1px solid var(--line)", borderRadius: 14, padding: "8px 12px" }}>
              <p dir="auto" style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{m.body}</p>
              <p className="mono" dir="ltr" style={{ margin: "4px 0 0", fontSize: 11, opacity: 0.7 }}>{mine ? text.me : text.them} · {new Date(m.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <textarea className="field" rows={2} value={draft} maxLength={4000} onChange={(e) => setDraft(e.target.value)} placeholder={text.placeholder} aria-label={text.placeholder} dir="auto" style={{ flex: 1, minWidth: 0 }} />
        <button className="btn btn-primary" disabled={busy || !draft.trim()} aria-label={text.send}><Send size={18} aria-hidden /></button>
      </form>
      {err && <p role="alert" style={{ margin: "6px 0 0", color: "var(--bad)", fontSize: 14 }}>{err}</p>}
    </div>
  );
}
