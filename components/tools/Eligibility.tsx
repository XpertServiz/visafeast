"use client";
import { useState } from "react";
import { ArrowLeft, Calendar, MessageCircle } from "lucide-react";
import { QUESTIONS, bandOf, score, MAX_SCORE } from "@/lib/eligibility";
import { useDict } from "@/components/DictProvider";
import { Icon } from "@/components/ui";
import type { Locale } from "@/config/locales";
import { track } from "@/lib/track-client";
import { Turnstile } from "./Turnstile";

/** `split`: the homepage layout from the approved prototype (navy panel with the title and progress, white card with the question). */
export function Eligibility({ locale, bookHref, whatsapp, split = false }: { locale: Locale; bookHref: string; whatsapp: string; split?: boolean }) {
  const d = useDict();
  const t = d.elig;
  const q = d.eligQ as Record<string, string>;
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

  const result = (
    <div role="status">
      <div className="mono" style={{ display: "inline-block", border: `3px solid ${color}`, color, padding: "8px 18px", borderRadius: 8, fontSize: 22, fontWeight: 600, letterSpacing: ".1em", transform: "rotate(-3deg)" }}>{t[band === "needs" ? "needs" : band]}</div>
      <p style={{ fontSize: 14, color: "var(--muted-2)", margin: "10px 0 0" }} className="mono">{total} / {MAX_SCORE}</p>
      <p style={{ fontSize: split ? 16 : 19, marginTop: 14, ...(split ? { lineHeight: 1.7, color: "#334155" } : {}) }}>{t[band === "strong" ? "strongT" : band === "moderate" ? "moderateT" : "needsT"]}</p>
      <p style={{ color: "var(--muted)", fontSize: 15 }}>{t.disclaimer}</p>
      {sent ? <p style={{ color: "var(--ok)", fontWeight: 600 }}>{d.book.sent}</p> : (
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
        <a className="btn btn-dark" href={bookHref} onClick={() => track("booking_click")}><Calendar size={18} aria-hidden />{d.cta.book}</a>
        <button type="button" className="btn btn-outline" onClick={() => { setStep(0); setAnswers([]); setSent(false); }}>{t.restart}</button>
      </div>
      <input type="hidden" value={whatsapp} readOnly />
    </div>
  );

  if (split) {
    const h = d.home;
    return (
      <div className="split sky" style={{ gap: 40, borderRadius: 24, padding: 44, color: "#fff" }}>
        <div style={{ flex: "1 1 360px", minWidth: 0 }}>
          <Icon name="thinking" size={84} style={{ marginBottom: 14 }} />
          <p className="eyebrow" style={{ margin: 0, color: "var(--amber)" }}>{t.title}</p>
          <h2 className="disp" style={{ margin: "10px 0 12px", fontSize: 38, fontWeight: 600 }}>{h.eligTitle}</h2>
          <p style={{ margin: 0, color: "var(--on-navy)", lineHeight: 1.6 }}>{h.eligSub}</p>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={Math.min(step, QUESTIONS.length)} style={{ display: "flex", gap: 6, marginTop: 28 }}>
            {QUESTIONS.map((q2, i) => <span key={q2.id} style={{ height: 6, flex: "1 1 0", borderRadius: 3, background: i < step ? "var(--amber)" : "rgba(255,255,255,.18)" }} />)}
          </div>
          <p className="mono" style={{ margin: "10px 0 0", fontSize: 12, color: "var(--on-navy-2)" }}>{h.eligAnswered.replace("{n}", String(Math.min(step, QUESTIONS.length))).replace("{total}", String(QUESTIONS.length))}</p>
        </div>
        <div style={{ flex: "1 1 520px", minWidth: 0, background: "#fff", color: "var(--ink)", borderRadius: 18, padding: 30 }}>
          {!done ? (
            <>
              <p className="mono" style={{ margin: 0, fontSize: 12, color: "var(--muted-2)", letterSpacing: ".08em", textTransform: "uppercase" }}>{t.q} {step + 1} {t.of} {QUESTIONS.length}</p>
              <h3 className="disp" style={{ margin: "8px 0 20px", fontSize: 24, fontWeight: 600 }}>{q[QUESTIONS[step].id] ?? QUESTIONS[step].en}</h3>
              <div className="g2" style={{ gap: 12 }}>
                {QUESTIONS[step].opts.map((o, i) => (
                  <button key={o.en} type="button" className="opt" onClick={() => pick(i)} style={{ textAlign: "start", cursor: "pointer", background: "var(--paper)", border: `1.5px solid ${answers[step] === i ? "var(--navy)" : "var(--line)"}`, borderRadius: 12, padding: 16, fontSize: 15, fontWeight: 500, fontFamily: "inherit", color: "var(--ink)", minHeight: 56 }}>{q[`${QUESTIONS[step].id}_${i}`] ?? o.en}</button>
                ))}
              </div>
              {step > 0 && <button type="button" onClick={() => setStep(step - 1)} style={{ marginTop: 16, border: 0, background: "transparent", cursor: "pointer", color: "var(--muted)", fontWeight: 600, fontFamily: "inherit", fontSize: 16, padding: "10px 0", minHeight: 44 }}>← {t.back}</button>}
            </>
          ) : result}
        </div>
      </div>
    );
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
          <h3 className="disp" style={{ fontSize: 26, margin: "20px 0 14px" }}>{q[QUESTIONS[step].id] ?? QUESTIONS[step].en}</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {QUESTIONS[step].opts.map((o, i) => (
              <button key={o.en} type="button" onClick={() => pick(i)} style={{ textAlign: "start", minHeight: 52, padding: "12px 16px", borderRadius: 14, border: `1.5px solid ${answers[step] === i ? "var(--navy)" : "var(--line)"}`, background: "#fff", font: "inherit", cursor: "pointer", fontSize: 17 }}>{q[`${QUESTIONS[step].id}_${i}`] ?? o.en}</button>
            ))}
          </div>
        </>
      ) : result}
    </div>
  );
}
