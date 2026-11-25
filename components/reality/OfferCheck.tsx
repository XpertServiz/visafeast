"use client";
import { useMemo, useState } from "react";
import { OFFER_RULES, RISK_TEXT } from "@/config/reality-check";
import { offerRisk } from "@/lib/reality";
import type { Locale } from "@/config/locales";
import { LeadForm } from "@/components/tools/LeadForm";

const TONE = { low: ["#EEF2F8", "var(--navy)"], medium: ["var(--amber)", "var(--navy)"], high: ["var(--navy)", "#fff"] } as const;

/** "Check an offer": ticks in the browser, rules from config/reality-check.ts. No server call, no AI. */
export function OfferCheck({ locale, countries }: { locale: Locale; countries: string[] }) {
  const [ticked, setTicked] = useState<string[]>([]);
  const [shown, setShown] = useState(false);
  const { risk, score } = offerRisk(ticked);
  const t = RISK_TEXT[risk];
  const [bg, fg] = TONE[risk];
  const note = useMemo(() => `Offer check result: ${t.label} (score ${score}). Warning signs ticked: ${OFFER_RULES.filter((r) => ticked.includes(r.id)).map((r) => r.text).join("; ") || "none"}.\nMy question: `, [ticked, t.label, score]);
  const toggle = (id: string) => { setShown(false); setTicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])); };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <fieldset className="card" style={{ padding: 20, margin: 0, border: "1px solid var(--line)" }}>
        <legend style={{ fontWeight: 700, padding: "0 6px" }}>Tick what the offer says or does</legend>
        <div style={{ display: "grid", gap: 4 }}>
          {OFFER_RULES.map((r) => (
            <label key={r.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 4px", minHeight: 48, cursor: "pointer" }}>
              <input type="checkbox" checked={ticked.includes(r.id)} onChange={() => toggle(r.id)} style={{ width: 24, height: 24, flex: "none", accentColor: "#0B2A4A" }} />
              <span>{r.text}</span>
            </label>
          ))}
        </div>
        <button type="button" className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setShown(true)}>Check this offer</button>
      </fieldset>
      {shown && (
        <section aria-live="polite" className="card" style={{ padding: 22 }}>
          <p style={{ margin: 0 }}><span style={{ display: "inline-block", background: bg, color: fg, border: "2px solid var(--navy)", borderRadius: 999, padding: "6px 16px", fontWeight: 700, fontSize: 20 }}>{t.label}</span></p>
          <p style={{ fontSize: 17 }}>{t.why}</p>
          <h2 className="disp" style={{ fontSize: 20, margin: "16px 0 6px" }}>What to do next</h2>
          <ul style={{ margin: 0, paddingInlineStart: 22, lineHeight: 1.8 }}>{t.next.map((n) => <li key={n}>{n}</li>)}</ul>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 0 }}>This is a simple guide based on common warning signs. It cannot say whether a particular company is right or wrong.</p>
        </section>
      )}
      {shown && (
        <section className="sky" style={{ borderRadius: 20, padding: 24 }}>
          <h2 className="disp" style={{ color: "#fff", margin: "0 0 6px", fontSize: 24 }}>Send this offer to Visafeast</h2>
          <p style={{ color: "var(--on-navy)", margin: "0 0 16px" }}>We will compare it with the official rules and reply on WhatsApp.</p>
          <LeadForm key={note} locale={locale} countries={countries} defaultMessage={note} />
        </section>
      )}
    </div>
  );
}
