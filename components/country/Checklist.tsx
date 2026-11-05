"use client";
import { useDict } from "@/components/DictProvider";
import type { Locale } from "@/config/locales";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import type { Item } from "@/lib/types";
import { track } from "@/lib/track-client";
import { Turnstile, useBotCheck } from "@/components/tools/Turnstile";

export function Checklist({ slug, docs, locale, whatsapp }: { slug: string; docs: Item[]; locale: Locale; whatsapp: string }) {
  const u = useDict().ui;
  const key = `vf_check_${slug}`;
  const [ticked, setTicked] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const bot = useBotCheck();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { try { setTicked(JSON.parse(localStorage.getItem(key) || "[]")); } catch { /* storage blocked */ } }, [key]);
  const toggle = (i: number) => {
    const n = ticked.includes(i) ? ticked.filter((x) => x !== i) : [...ticked, i];
    setTicked(n); try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* ignore */ }
  };

  async function getPdf(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch(`/api/checklist/${slug}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: fd.get("name"), phone: fd.get("phone"), turnstile: await bot.take(), locale, website: "" }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Error");
      const blob = await r.blob();
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `visafeast-${slug}-checklist.pdf`; a.click();
      track("checklist_download", { slug }); setOpen(false);
    } catch (x) { setErr(x instanceof Error ? x.message : "Error"); } finally { setBusy(false); }
  }

  if (!docs.length) return <p style={{ color: "var(--muted)" }}>{u.docsVerifying}</p>;
  return (
    <div>
      <p className="mono" aria-live="polite" style={{ color: "var(--muted-2)", fontSize: 14 }}>{ticked.length} / {docs.length} {u.ready}</p>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
        {docs.map((d, i) => (
          <li key={d.title} className="card" style={{ padding: "12px 16px" }}>
            <label style={{ display: "flex", gap: 14, alignItems: "flex-start", cursor: "pointer", minHeight: 44 }}>
              <input type="checkbox" checked={ticked.includes(i)} onChange={() => toggle(i)} style={{ width: 24, height: 24, marginTop: 2, accentColor: "#8A5300" }} />
              <span><b>{d.title}</b>{d.detail && <span style={{ display: "block", color: "var(--muted)", fontSize: 15 }}>{d.detail}</span>}</span>
            </label>
          </li>
        ))}
      </ul>
      {!open ? (
        <button type="button" className="btn btn-dark" onClick={() => setOpen(true)}><Download size={18} aria-hidden />{u.getPdf}</button>
      ) : (
        <form onSubmit={getPdf} className="card" style={{ padding: 18, display: "grid", gap: 10 }}>
          <div className="g2"><input className="field" name="name" required placeholder={u.yourName} aria-label="Name" /><input className="field" name="phone" required type="tel" dir="ltr" placeholder="WhatsApp +92…" aria-label="WhatsApp number" /></div>
          <Turnstile bot={bot} />
          {err && <p role="alert" style={{ color: "var(--bad)", margin: 0 }}>{err}</p>}
          <button className="btn btn-primary" disabled={busy} type="submit"><Download size={18} aria-hidden />PDF</button>
          <input type="hidden" value={whatsapp} readOnly />
        </form>
      )}
    </div>
  );
}
