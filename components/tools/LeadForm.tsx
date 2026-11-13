"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Send } from "lucide-react";
import { useDict } from "@/components/DictProvider";
import type { Locale } from "@/config/locales";
import { Turnstile, useBotCheck } from "./Turnstile";

/** `compact`: the homepage version from the approved prototype (one column for name and number, no message box). */
export function LeadForm({ locale, countries, defaultService, defaultCountry, dark = true, source = "enquiry", compact = false }: {
  locale: Locale; countries: string[]; defaultService?: "visit" | "study" | "immigration" | "work"; defaultCountry?: string; dark?: boolean; source?: string; compact?: boolean;
}) {
  const d = useDict();
  const f = d.form, b = d.book;
  const path = usePathname();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const bot = useBotCheck();
  const cls = `field ${dark ? "field-dark" : ""}`;
  const lbl = { color: dark ? (compact ? "#fff" : "var(--on-navy)") : "inherit", ...(compact ? { fontWeight: 400 } : {}) };
  const row = compact ? { gap: 12 } : undefined;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("busy"); setErr("");
    try {
      const body = { ...Object.fromEntries([...fd.entries()].filter(([, v]) => v !== "")), source: source === "enquiry" && fd.get("visa_type") === "immigration" ? "immigration" : source, page_path: path, turnstile: await bot.take() };
      const r = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || !j.ok) { setErr(j.error || f.error); setState("error"); return; }
      setState("done");
    } catch { setErr(f.error); setState("error"); }
  }

  if (state === "done") return <p role="status" style={{ fontSize: 20, fontWeight: 600, color: dark ? "#fff" : "var(--ok)" }}>{b.sent}</p>;
  return (
    <form onSubmit={submit} style={{ display: "grid", gap: compact ? 12 : 14 }} noValidate={false}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
      <div className={compact ? undefined : "g2"} style={compact ? { display: "grid", gap: 12 } : undefined}>
        <div><label className="lbl" style={lbl} htmlFor="lf-name">{compact ? d.home.rvNamePh : f.name}</label><input id="lf-name" className={cls} name="name" required minLength={2} maxLength={80} autoComplete="name" /></div>
        <div><label className="lbl" style={lbl} htmlFor="lf-phone">{f.whatsapp}</label><input id="lf-phone" className={cls} name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="+92 3xx xxxxxxx" dir="ltr" /></div>
      </div>
      <div className="g2" style={row}>
        <div><label className="lbl" style={lbl} htmlFor="lf-service">{f.service}</label>
          <select id="lf-service" className={cls} name="visa_type" defaultValue={defaultService ?? "visit"}>
            <option value="visit">{f.visit}</option><option value="study">{f.study}</option><option value="work">{f.work}</option><option value="immigration">{f.immigration}</option>
          </select></div>
        <div><label className="lbl" style={lbl} htmlFor="lf-country">{f.country}</label>
          <select id="lf-country" className={cls} name="destination" defaultValue={defaultCountry ?? ""}>
            <option value="">—</option>{countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select></div>
      </div>
      <div className="g2" style={row}>
        <div><label className="lbl" style={lbl} htmlFor="lf-nat">{f.nationality}</label><input id="lf-nat" className={cls} name="nationality" defaultValue="Pakistan" maxLength={60} /></div>
        <div><label className="lbl" style={lbl} htmlFor="lf-res">{f.residence}</label><input id="lf-res" className={cls} name="residence_country" maxLength={60} placeholder="Pakistan" /></div>
      </div>
      <div><label className="lbl" style={lbl} htmlFor="lf-ref">{f.refused}</label>
        <select id="lf-ref" className={cls} name="prior_refusal" defaultValue="no"><option value="no">{f.no}</option><option value="once">{f.once}</option><option value="more">{f.more}</option></select></div>
      {!compact && <div><label className="lbl" style={lbl} htmlFor="lf-msg">{f.message}</label><textarea id="lf-msg" className={cls} name="message" rows={3} maxLength={1500} /></div>}
      <Turnstile bot={bot} />
      {err && <p role="alert" style={{ color: dark ? "var(--amber)" : "var(--bad)", margin: 0 }}>{err}</p>}
      <button className="btn btn-primary" type="submit" disabled={state === "busy"} style={compact ? { marginTop: 6, padding: "14px 22px" } : undefined}>{!compact && <Send size={18} aria-hidden />}{b.send}</button>
    </form>
  );
}
