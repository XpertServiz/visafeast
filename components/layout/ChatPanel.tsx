"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { waLink, type Locale } from "@/config/site";
import { useDict } from "@/components/DictProvider";
import { AimanAvatar } from "./Avatar";

type Msg = { role: "user" | "assistant"; content: string; link?: string; suggest?: string[]; handoff?: boolean };

export function ChatPanel({ locale, whatsapp, onClose, firstQuestion }: { locale: Locale; whatsapp: string; onClose: () => void; firstQuestion?: string }) {
  const d = useDict();
  const t = d.chat;
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: t.greeting, suggest: [t.q1, t.q2] }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [topic, setTopic] = useState("a visa");
  const lastCountry = useRef<string | undefined>(undefined);
  const asked = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, busy]);

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setTopic(question.slice(0, 60));
    setMsgs((m) => [...m, { role: "user", content: question }]);
    setText(""); setBusy(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: question, locale, lastCountry: lastCountry.current }) });
      const j = await r.json();
      if (j.country) lastCountry.current = j.country;
      setMsgs((m) => [...m, { role: "assistant", content: j.answer ?? "…", link: j.link, suggest: j.suggest, handoff: j.handoff }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: d.ui.chatError, handoff: true }]);
    } finally { setBusy(false); }
  }

  useEffect(() => {
    if (firstQuestion && !asked.current) { asked.current = true; void send(firstQuestion); }
    // only once, when she opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstQuestion]);

  const wa = waLink(`Hi Visafeast, I was chatting on your website about ${topic}.`, whatsapp);
  const last = msgs[msgs.length - 1];

  return (
    <div role="dialog" aria-label={t.title} aria-modal="false"
      style={{ position: "fixed", zIndex: 60, bottom: 0, insetInlineEnd: 0, width: "min(390px, 100vw)", height: "min(600px, 92vh)", background: "#fff", border: "1px solid var(--line)", borderRadius: "18px 18px 0 0", boxShadow: "0 -10px 40px rgba(10,26,51,.25)", display: "flex", flexDirection: "column" }}>
      <div className="sky" style={{ padding: "10px 12px 10px 14px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "18px 18px 0 0", gap: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <AimanAvatar size={44} />
          <span style={{ minWidth: 0 }}><strong style={{ display: "block" }}>{t.title}</strong><small style={{ color: "var(--on-navy)" }}>{t.subtitle}</small></span>
        </span>
        <button type="button" onClick={onClose} aria-label="Close" style={{ background: "none", border: 0, color: "#fff", cursor: "pointer", minWidth: 44, minHeight: 44 }}><X /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "grid", gap: 10, alignContent: "start" }} aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} dir="auto" style={{ justifySelf: m.role === "user" ? "end" : "start", maxWidth: "90%", background: m.role === "user" ? "var(--navy)" : "#F3EEE4", color: m.role === "user" ? "#fff" : "var(--ink)", padding: "10px 14px", borderRadius: 14, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {m.content}
            {m.link && <div style={{ marginTop: 6 }}><a href={m.link}>{d.ui.openPage} →</a></div>}
            {m.handoff && <div style={{ marginTop: 8 }}><a className="btn btn-wa" style={{ minHeight: 40, padding: "6px 14px" }} href={wa}>{t.wa}</a></div>}
          </div>
        ))}
        {busy && <div aria-label="…" style={{ justifySelf: "start", background: "#F3EEE4", padding: "12px 14px", borderRadius: 14 }}><span className="typing"><i /><i /><i /></span></div>}
        {!busy && last.suggest && last.suggest.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {last.suggest.map((q) => <button key={q} type="button" className="chip" style={{ border: 0, cursor: "pointer", minHeight: 40, fontSize: 14, margin: 0 }} onClick={() => send(q)}>{q}</button>)}
          </div>
        )}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void send(text); }} style={{ padding: 12, borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
        <input className="field" dir="auto" value={text} onChange={(e) => setText(e.target.value)} placeholder={t.placeholder} maxLength={500} aria-label={t.placeholder} style={{ minWidth: 0 }} />
        <button className="btn btn-dark" disabled={busy} type="submit">{t.send}</button>
      </form>
      <p style={{ margin: "0 12px 10px", fontSize: 12, color: "var(--muted)" }}>{t.disclaimer}</p>
    </div>
  );
}
