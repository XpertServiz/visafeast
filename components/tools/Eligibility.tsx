"use client";
import { useState } from "react";
import { ArrowLeft, Calendar, MessageCircle } from "lucide-react";
import { QUESTIONS, bandOf, score, MAX_SCORE } from "@/lib/eligibility";
import en from "@/messages/en.json";
import ur from "@/messages/ur.json";
import { track } from "@/lib/track-client";
import { Turnstile } from "./Turnstile";

export function Eligibility({ locale, bookHref, whatsapp }: { locale: "en" | "ur"; bookHref: string; whatsapp: string }) {
  const t = (locale === "ur" ? ur : en).elig;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const done = step >= QUESTIONS.length;
  const total = done ? score(answers) : 0;
  const band = bandOf(total);
  const color = band === "strong" ? "var(--ok)" : band === "moderate" ? "var(--amber-text)" : "var(--bad)";

  function pick(i: number) {
    const next = [...answers.slice(0, step), i];
    setAnswers(next);
    if (step + 1 >= QUESTIONS.length) track("eligibility_complete", { band: bandOf(score(next)) });
    setStep(step + 1);
  }
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      name: fd.get("name"), phone: fd.get("phone"), source: "eligibility", visa_type: answers[0] === 5 ? "study" : "visit",
      destination: QUESTIONS[0].opts[answers[0]].en, eligibility: { answers: answers.map((a, i) => ({ q: QUESTIONS[i].id, a: QUESTIONS[i].opts[a].en })), score: total, band }, turnstile: token, website: "",
    }) }).catch(() => null);
    setBusy(false); if (res?.ok) setSent(true);
  }

  return (
    <div className="card" style={{ padding: 28, maxWidth: 760, marginInline: "auto" }}>
      {!done ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span className="eyebrow" style={{ color: "var(--muted-2)" }}>{t.q} {step + 1} {t.of} {QUESTIONS.length}</span>
            {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="btn btn-outline" style={{ minHeight: 40, padding: "6px 14px" }}><ArrowLeft size={16} aria-hidden />{t.back}</button>}
          </div>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={step} style={{ height: 8, background: "#EEE8DC", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${(step / QUESTIONS.length) * 100}%`, height: "100%", background: "var(--amber)", transition: "width .3s" }} />
          </div>
          <h3 className="disp" style={{ fontSize: 26, margin: "20px 0 14px" }}>{QUESTIONS[step][locale]}</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {QUESTIONS[step].opts.map((o, i) => (
              <button key={o.en} type="button" onClick={() => pick(i)} style={{ textAlign: "start", minHeight: 52, padding: "12px 16px", borderRadius: 14, border: `1.5px solid ${answers[step] === i ? "var(--navy)" : "var(--line)"}`, background: "#fff", font: "inherit", cursor: "pointer", fontSize: 17 }}>{o[locale]}</button>
            ))}
          </div>
        </>
      ) : (
        <div role="status">
          <div className="mono" style={{ display: "inline-block", border: `3px solid ${color}`, color, padding: "8px 18px", borderRadius: 8, fontSize: 22, fontWeight: 600, letterSpacing: ".1em", transform: "rotate(-3deg)" }}>{t[band === "needs" ? "needs" : band]}</div>
          <p style={{ fontSize: 14, color: "var(--muted-2)", margin: "10px 0 0" }} className="mono">{total} / {MAX_SCORE}</p>
          <p style={{ fontSize: 19, marginTop: 14 }}>{t[band === "strong" ? "strongT" : band === "moderate" ? "moderateT" : "needsT"]}</p>
          <p style={{ color: "var(--muted)", fontSize: 15 }}>{t.disclaimer}</p>
          {sent ? <p style={{ color: "var(--ok)", fontWeight: 600 }}>{(locale === "ur" ? ur : en).book.sent}</p> : (
            <form onSubmit={send} style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <div className="g2">
                <input className="field" name="name" required placeholder={t.yourName} aria-label={t.yourName} />
                <input className="field" name="phone" required type="tel" placeholder={t.yourWhatsapp} aria-label={t.yourWhatsapp} dir="ltr" />
              </div>
              <Turnstile onToken={setToken} />
              <button className="btn btn-wa" disabled={busy} type="submit"><MessageCircle size={18} aria-hidden />{t.sendChecklist}</button>
            </form>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
            <a className="btn btn-dark" href={bookHref} onClick={() => track("booking_click")}><Calendar size={18} aria-hidden />{(locale === "ur" ? ur : en).cta.book}</a>
            <button type="button" className="btn btn-outline" onClick={() => { setStep(0); setAnswers([]); setSent(false); }}>{t.restart}</button>
          </div>
          <input type="hidden" value={whatsapp} readOnly />
        </div>
      )}
    </div>
  );
}
