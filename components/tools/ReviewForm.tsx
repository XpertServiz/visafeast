"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import en from "@/messages/en.json";
import ur from "@/messages/ur.json";
import { track } from "@/lib/track-client";
import { Turnstile } from "./Turnstile";

export function ReviewForm({ locale }: { locale: "en" | "ur" }) {
  const f = (locale === "ur" ? ur : en).form;
  const [rating, setRating] = useState(5);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");
  const [token, setToken] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setState("busy"); setErr("");
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      name: fd.get("name"), city: fd.get("city") || undefined, visa_type: fd.get("visa_type"), rating, body: fd.get("body"), consent: fd.get("consent") === "on", website: "", turnstile: token,
    }) }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    if (r?.ok && j.ok) { setState("done"); track("review_submitted"); } else { setErr(j?.error || f.error); setState("idle"); }
  }
  if (state === "done") return <p role="status" style={{ fontWeight: 600, color: "var(--ok)" }}>{locale === "ur" ? "شکریہ! آپ کا تبصرہ منظوری کے بعد شائع ہوگا۔" : "Thank you! Your review will appear once we approve it."}</p>;
  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      <div className="g2">
        <div><label className="lbl" htmlFor="rv-name">{f.name}</label><input id="rv-name" className="field" name="name" required minLength={2} maxLength={80} /></div>
        <div><label className="lbl" htmlFor="rv-city">{f.city}</label><input id="rv-city" className="field" name="city" maxLength={60} /></div>
      </div>
      <div><label className="lbl" htmlFor="rv-visa">{f.service}</label>
        <select id="rv-visa" className="field" name="visa_type"><option>{f.visit}</option><option>{f.study}</option><option>{f.immigration}</option></select></div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="lbl">{f.rating}</legend>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-label={`${n} / 5`} aria-pressed={rating === n} onClick={() => setRating(n)} style={{ background: "none", border: 0, cursor: "pointer", minWidth: 44, minHeight: 44 }}>
              <Star size={30} fill={n <= rating ? "#F2A93B" : "none"} stroke={n <= rating ? "#B87400" : "#8A93A3"} />
            </button>
          ))}
        </div>
      </fieldset>
      <div><label className="lbl" htmlFor="rv-body">{f.message}</label><textarea id="rv-body" className="field" name="body" required minLength={10} maxLength={1500} rows={4} /></div>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><input type="checkbox" name="consent" required style={{ width: 22, height: 22, marginTop: 3 }} />{f.consent}</label>
      <Turnstile onToken={setToken} />
      {err && <p role="alert" style={{ color: "var(--bad)", margin: 0 }}>{err}</p>}
      <button className="btn btn-dark" type="submit" disabled={state === "busy"}>{f.submit}</button>
    </form>
  );
}
