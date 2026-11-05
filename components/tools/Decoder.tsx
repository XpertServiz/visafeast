"use client";
import { useState } from "react";
import { Calendar, MessageCircle, Search } from "lucide-react";
import { scrub, type Point } from "@/lib/decoder-rules";
import { useDict } from "@/components/DictProvider";
import type { Locale } from "@/config/locales";
import { waLink } from "@/config/site";
import { Turnstile } from "./Turnstile";

interface Result { points: Point[]; honest_view: string }

export function Decoder({ locale, bookHref, whatsapp }: { locale: Locale; bookHref: string; whatsapp: string }) {
  const d = useDict();
  const t = d.decoder;
  const [text, setText] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [token, setToken] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setRes(null);
    if (!text.trim()) return setErr(t.empty);
    if (text.length > 6000) return setErr(t.tooLong);
    setBusy(true);
    try {
      const r = await fetch("/api/decoder", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: scrub(text), locale, turnstile: token }) });
      const j = await r.json();
      if (!r.ok || !j.ok) setErr(j.error || d.form.error); else setRes(j);
    } catch { setErr(d.form.error); } finally { setBusy(false); }
  }
  async function sendToConsultant() {
    // Only with an explicit consent tick is the (scrubbed) text sent as a lead.
    const name = prompt(d.ui.yourName); const phone = name && prompt(d.ui.yourWhatsapp);
    if (!name || !phone) return;
    const r = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, phone, source: "decoder", message: scrub(text).slice(0, 1500), turnstile: token, website: "" }) });
    if (r.ok) setSent(true);
  }

  return (
    <div className="card" style={{ padding: 28, maxWidth: 860, marginInline: "auto" }}>
      <form onSubmit={run} style={{ display: "grid", gap: 12 }}>
        <label className="lbl" htmlFor="dec-text">{t.label}</label>
        <textarea id="dec-text" className="field" rows={8} value={text} onChange={(e) => setText(e.target.value)} maxLength={6500} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted-2)" }}><span>{t.privacy}</span><span dir="ltr">{text.length} / 6000</span></div>
        <Turnstile onToken={setToken} />
        {err && <p role="alert" style={{ color: "var(--bad)", margin: 0 }}>{err}</p>}
        <button className="btn btn-dark" type="submit" disabled={busy}><Search size={18} aria-hidden />{t.btn}</button>
      </form>
      {res && (
        <div role="status" style={{ marginTop: 24 }}>
          <ol style={{ display: "grid", gap: 14, padding: 0, listStyle: "none", margin: 0 }}>
            {res.points.map((p, i) => (
              <li key={i} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 18 }}>
                <p className="disp" style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{i + 1}. {p.heading}</p>
                <p style={{ margin: "8px 0 0" }}><b>{t.meaning}:</b> {p.meaning}</p>
                <p style={{ margin: "6px 0 0" }}><b>{t.fix}:</b> {p.fix}</p>
              </li>
            ))}
          </ol>
          <p style={{ marginTop: 16, fontWeight: 600 }}>{t.honest}: <span style={{ fontWeight: 400 }}>{res.honest_view}</span></p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
            <a className="btn btn-primary" href={bookHref}><Calendar size={18} aria-hidden />{t.review}</a>
            <a className="btn btn-wa" href={waLink("Hi Visafeast, I used the refusal letter decoder and would like a file review.", whatsapp)}><MessageCircle size={18} aria-hidden />{t.send}</a>
          </div>
          <label style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "flex-start", fontSize: 15 }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: 22, height: 22, marginTop: 3 }} />{t.consent}
          </label>
          {consent && !sent && <button type="button" className="btn btn-outline" style={{ marginTop: 10 }} onClick={sendToConsultant}>{t.send}</button>}
          {sent && <p style={{ color: "var(--ok)", fontWeight: 600 }}>{d.book.sent}</p>}
        </div>
      )}
      <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 18 }}>{t.disclaimer}</p>
    </div>
  );
}
