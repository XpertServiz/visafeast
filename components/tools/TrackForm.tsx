"use client";
import { useState } from "react";
import { Check, Search } from "lucide-react";
import { useDict } from "@/components/DictProvider";
import type { Locale } from "@/config/locales";
import { Turnstile, useBotCheck } from "./Turnstile";

interface Result { ref: string; decision: string | null; next: string; timeline: { stage: string; label: string; state: "done" | "current" | "todo" }[] }

export function TrackForm({ locale }: { locale: Locale }) {
  const t = useDict().track;
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [err, setErr] = useState(""); const [res, setRes] = useState<Result | null>(null); const bot = useBotCheck();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("busy"); setErr(""); setRes(null);
    try {
      const r = await fetch("/api/track-case", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ref: fd.get("ref"), last4: fd.get("last4"), locale, turnstile: await bot.take() }) });
      const j = await r.json();
      if (!r.ok || !j.ok) { setErr(locale === "en" ? j.error || t.notFound : t.notFound); setState("error"); return; }
      setRes(j); setState("idle");
    } catch { setErr(t.notFound); setState("error"); }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <form onSubmit={submit} className="card" style={{ padding: 24, display: "grid", gap: 14 }}>
        <div><label className="lbl" htmlFor="tr-ref">{t.ref}</label><input id="tr-ref" name="ref" className="field mono" placeholder="VF-1001" required maxLength={20} autoComplete="off" dir="ltr" /></div>
        <div><label className="lbl" htmlFor="tr-l4">{t.last4}</label><input id="tr-l4" name="last4" className="field mono" inputMode="numeric" pattern="\d{4}" maxLength={4} minLength={4} placeholder="1234" required autoComplete="off" dir="ltr" /></div>
        <Turnstile bot={bot} />
        {err && <p role="alert" style={{ color: "var(--bad)", margin: 0 }}>{err}</p>}
        <button className="btn btn-primary" disabled={state === "busy"}><Search size={18} aria-hidden />{t.button}</button>
      </form>
      {res && (
        <section aria-live="polite" className="card" style={{ padding: 24, marginTop: 20 }}>
          <p className="mono" style={{ margin: 0, color: "var(--muted)" }}>{res.ref}</p>
          <ol style={{ listStyle: "none", padding: 0, margin: "16px 0", display: "grid", gap: 10 }}>
            {res.timeline.map((s) => (
              <li key={s.stage} style={{ display: "flex", gap: 12, alignItems: "center", opacity: s.state === "todo" ? 0.5 : 1, fontWeight: s.state === "current" ? 700 : 500 }}>
                <span aria-hidden style={{ width: 26, height: 26, borderRadius: 99, display: "grid", placeItems: "center", background: s.state === "done" ? "var(--ok)" : s.state === "current" ? "var(--amber)" : "#E4DED3", color: s.state === "done" ? "#fff" : "#0A1A33" }}>{s.state === "done" ? <Check size={16} /> : ""}</span>
                {s.label}{s.state === "current" && <span className="sr-only"> — {t.now}</span>}
              </li>
            ))}
          </ol>
          <p style={{ margin: 0, padding: 14, borderRadius: 12, background: "var(--passport)" }}><b>{t.next}:</b> {res.next}</p>
          {res.decision && <p style={{ marginBottom: 0 }}>{res.decision === "approved" ? t.approved : res.decision === "refused" ? t.refused : t.withdrawn}</p>}
        </section>
      )}
    </div>
  );
}
