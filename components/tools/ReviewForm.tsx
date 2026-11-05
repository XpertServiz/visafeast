"use client";
import { useState } from "react";
import { useDict } from "@/components/DictProvider";
import type { Locale } from "@/config/locales";
import { track } from "@/lib/track-client";
import { Turnstile } from "./Turnstile";

export function ReviewForm({ locale }: { locale: Locale }) {
  const d = useDict();
  const f = d.form, h = d.home;
  const [rating, setRating] = useState(0);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");
  const [token, setToken] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) { setErr(`${f.rating}: ★ ?`); return; }
    setState("busy"); setErr("");
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      name: fd.get("name"), city: fd.get("city") || undefined, visa_type: fd.get("visa_type"), rating, body: fd.get("body"), consent: fd.get("consent") === "on", website: "", turnstile: token,
    }) }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    if (r?.ok && j.ok) { setState("done"); track("review_submitted"); } else { setErr(j?.error || f.error); setState("idle"); }
  }
  if (state === "done") return <p role="status" style={{ fontWeight: 600, color: "var(--ok)" }}>{d.ui.reviewThanks}</p>;
  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      <div className="g2" style={{ gap: 14 }}>
        <div><label className="lbl" htmlFor="rv-name">{f.name}</label><input id="rv-name" className="field" name="name" required minLength={2} maxLength={80} placeholder={h.rvNamePh} /></div>
        <div><label className="lbl" htmlFor="rv-city">{f.city}</label><input id="rv-city" className="field" name="city" maxLength={60} placeholder={h.rvCityPh} /></div>
        <div><label className="lbl" htmlFor="rv-visa">{f.service}</label>
          <select id="rv-visa" className="field" name="visa_type"><option>{f.visit}</option><option>{f.study}</option><option>{f.immigration}</option></select></div>
        <fieldset style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <legend className="lbl" style={{ padding: 0 }}>{f.rating}</legend>
          <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={`${n} / 5`} aria-pressed={rating === n} onClick={() => setRating(n)} style={{ background: "none", border: 0, cursor: "pointer", padding: 6, minWidth: 40, minHeight: 44 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill={n <= rating ? "#F2A93B" : "none"} stroke="#C98A1E" strokeWidth="1.5" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <div><label className="lbl" htmlFor="rv-body">{h.rvBody}</label><textarea id="rv-body" className="field" name="body" required minLength={10} maxLength={1500} rows={3} placeholder={h.rvBodyPh} style={{ resize: "vertical" }} /></div>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}><input type="checkbox" name="consent" required style={{ width: 20, height: 20, marginTop: 1, flex: "none" }} />{f.consent}</label>
      <Turnstile onToken={setToken} />
      {err && <p role="alert" style={{ color: "var(--bad)", margin: 0 }}>{err}</p>}
      <div><button className="btn btn-dark" type="submit" disabled={state === "busy"} style={{ padding: "14px 22px", fontSize: 15 }}>{h.rvSubmit}</button></div>
    </form>
  );
}
