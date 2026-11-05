"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { waLink } from "@/config/site";
import en from "@/messages/en.json";
import ur from "@/messages/ur.json";

type Msg = { role: "user" | "assistant"; content: string; link?: string };

export function ChatPanel({ locale, whatsapp, onClose }: { locale: "en" | "ur"; whatsapp: string; onClose: () => void }) {
  const t = (locale === "ur" ? ur : en).chat;
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: t.greeting }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [topic, setTopic] = useState("a visa");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs]);

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setTopic(question.slice(0, 60));
    setMsgs((m) => [...m, { role: "user", content: question }]);
    setText(""); setBusy(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: question, locale }) });
      const j = await r.json();
      setMsgs((m) => [...m, { role: "assistant", content: j.answer ?? "…", link: j.link }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: locale === "ur" ? "معذرت، ابھی جواب نہیں دے سکا۔ واٹس ایپ پر رابطہ کریں۔" : "Sorry, I couldn't answer just now. Please WhatsApp us." }]);
    } finally { setBusy(false); }
  }

  return (
    <div role="dialog" aria-label={t.title} aria-modal="false"
      style={{ position: "fixed", zIndex: 60, bottom: 0, insetInlineEnd: 0, width: "min(380px, 100vw)", height: "min(560px, 90vh)", background: "#fff", border: "1px solid var(--line)", borderRadius: "18px 18px 0 0", boxShadow: "0 -10px 40px rgba(10,26,51,.25)", display: "flex", flexDirection: "column" }}>
      <div className="sky" style={{ padding: "14px 16px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "18px 18px 0 0" }}>
        <strong>{t.title}</strong>
        <button type="button" onClick={onClose} aria-label="Close" style={{ background: "none", border: 0, color: "#fff", cursor: "pointer", minWidth: 44, minHeight: 44 }}><X /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "grid", gap: 10, alignContent: "start" }} aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} style={{ justifySelf: m.role === "user" ? "end" : "start", maxWidth: "88%", background: m.role === "user" ? "var(--navy)" : "#F3EEE4", color: m.role === "user" ? "#fff" : "var(--ink)", padding: "10px 14px", borderRadius: 14, fontSize: 16 }}>
            {m.content}
            {m.link && <div style={{ marginTop: 6 }}><a href={m.link}>{locale === "ur" ? "صفحہ کھولیں" : "Open page"} →</a></div>}
          </div>
        ))}
        {msgs.length === 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[t.q1, t.q2].map((q) => <button key={q} type="button" className="chip" style={{ border: 0, cursor: "pointer", minHeight: 40, fontSize: 14 }} onClick={() => send(q)}>{q}</button>)}
            <a className="chip" style={{ textDecoration: "none", minHeight: 40, display: "inline-flex", alignItems: "center", fontSize: 14 }} href={waLink(`Hi Visafeast, I was chatting on your website about ${topic}.`, whatsapp)}>{t.q3}</a>
          </div>
        )}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void send(text); }} style={{ padding: 12, borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
        <input className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder={t.placeholder} maxLength={500} aria-label={t.placeholder} />
        <button className="btn btn-dark" disabled={busy} type="submit">{t.send}</button>
      </form>
      <a className="btn btn-wa" style={{ margin: "0 12px 12px", minHeight: 44 }} href={waLink(`Hi Visafeast, I was chatting on your website about ${topic}.`, whatsapp)}>{t.wa}</a>
    </div>
  );
}
