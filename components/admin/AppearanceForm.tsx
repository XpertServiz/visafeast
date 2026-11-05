"use client";
import { useState } from "react";
import { HEADING_FONTS, BODY_FONTS, URDU_FONTS } from "@/lib/font-lists";
import { THEMES, contrast, type ThemeKey } from "@/lib/themes";
import { Splash } from "@/components/splash/Splash";

const VAR: Record<string, string> = {
  Fraunces: "--f-fraunces", Sora: "--f-sora", "Playfair Display": "--f-playfair", "DM Serif Display": "--f-dmserif", "Plus Jakarta Sans": "--f-jakarta", Poppins: "--f-poppins",
  Inter: "--f-inter", Manrope: "--f-manrope", "DM Sans": "--f-dmsans", "Noto Nastaliq Urdu": "--f-nastaliq", "Noto Naskh Arabic": "--f-naskh", Gulzar: "--f-gulzar",
};
const SPLASH = [["plane_stamp", "Plane lands a stamp"], ["globe_spin", "Spinning globe"], ["passport_open", "Passport opens"], ["boarding_pass", "Boarding pass scanned"], ["logo_fade", "Simple logo (lightest)"], ["off", "No intro"]] as const;

type S = { heading_font: string; body_font: string; urdu_font: string; theme: string; accent_color: string; splash_style: string; splash_duration_ms: number; splash_once_per_session: boolean; hero_globe_style: string };

export function AppearanceForm({ s, save, reset }: { s: S; save: (fd: FormData) => Promise<void>; reset: () => Promise<void> }) {
  const [h, setH] = useState(s.heading_font), [b, setB] = useState(s.body_font), [u, setU] = useState(s.urdu_font);
  const [theme, setTheme] = useState(s.theme as ThemeKey), [accent, setAccent] = useState(s.accent_color);
  const [splash, setSplash] = useState(s.splash_style), [dur, setDur] = useState(s.splash_duration_ms);
  const [play, setPlay] = useState(0);
  const [msg, setMsg] = useState("");
  const t = THEMES[theme] ?? THEMES.night_flight;
  const cr = contrast(accent, t.vars["--navy"]);

  return (
    <div className="g2" style={{ alignItems: "start" }}>
      <form action={async (fd) => { await save(fd); setMsg("Saved and published."); }} style={{ display: "grid", gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Fonts</h2>
        <label className="lbl">Headings<select name="heading_font" className="field" value={h} onChange={(e) => setH(e.target.value)}>{HEADING_FONTS.map((f) => <option key={f}>{f}</option>)}</select></label>
        <label className="lbl">Body text<select name="body_font" className="field" value={b} onChange={(e) => setB(e.target.value)}>{BODY_FONTS.map((f) => <option key={f}>{f}</option>)}</select></label>
        <label className="lbl">Urdu<select name="urdu_font" className="field" value={u} onChange={(e) => setU(e.target.value)}>{URDU_FONTS.map((f) => <option key={f}>{f}</option>)}</select></label>

        <h2 style={{ margin: "10px 0 0", fontSize: 18 }}>Colour theme</h2>
        <div role="radiogroup" aria-label="Theme" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
            <label key={k} className="card" style={{ padding: 10, cursor: "pointer", borderColor: theme === k ? "var(--amber)" : undefined, borderWidth: 2 }}>
              <input type="radio" name="theme" value={k} checked={theme === k} onChange={() => setTheme(k)} style={{ marginInlineEnd: 8 }} />
              <span style={{ display: "inline-flex", gap: 4, verticalAlign: "middle" }}>{["--navy", "--paper", "--on-navy"].map((v) => <i key={v} style={{ width: 18, height: 18, borderRadius: 4, background: THEMES[k].vars[v], border: "1px solid #0002" }} />)}</span> {THEMES[k].label}
            </label>
          ))}
        </div>
        <label className="lbl">Accent colour<input name="accent_color" type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="field" style={{ padding: 4 }} /></label>
        {cr < 4.5 && <p role="alert" style={{ color: "var(--bad)", margin: 0 }}>Warning: text on this accent colour would be hard to read (contrast {cr.toFixed(1)}:1; needs 4.5).</p>}

        <h2 style={{ margin: "10px 0 0", fontSize: 18 }}>Intro screen</h2>
        <label className="lbl">Style<select name="splash_style" className="field" value={splash} onChange={(e) => setSplash(e.target.value)}>{SPLASH.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="lbl">How long: {(dur / 1000).toFixed(1)} s<input name="splash_duration_ms" type="range" min={1000} max={3000} step={100} value={dur} onChange={(e) => setDur(Number(e.target.value))} style={{ width: "100%" }} /></label>
        <label><input type="checkbox" name="splash_once" defaultChecked={s.splash_once_per_session} style={{ width: 20, height: 20, marginInlineEnd: 8 }} />Show only once per visit</label>
        <button type="button" className="btn btn-outline" onClick={() => { try { sessionStorage.removeItem("vf_splash"); } catch { /* ignore */ } setPlay((n) => n + 1); }}>Play preview</button>
        <label className="lbl">Globe style<select name="globe" className="field" defaultValue={s.hero_globe_style}><option value="realistic">Realistic Earth</option><option value="dotted">Dotted ball</option></select></label>

        {msg && <p role="status" style={{ margin: 0, fontWeight: 600 }}>{msg}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" type="submit">Save and publish</button>
          <button className="btn btn-outline" type="button" onClick={async () => { await reset(); location.reload(); }}>Reset to default</button>
        </div>
      </form>

      <div style={{ position: "sticky", top: 16 }}>
        <div className="sky" style={{ ...Object.fromEntries(Object.entries(t.vars).map(([k, v]) => [k, v])), borderRadius: 20, padding: 28, color: "#fff", ["--font-display" as string]: `var(${VAR[h]})`, ["--font-body" as string]: `var(${VAR[b]})`, ["--font-urdu" as string]: `var(${VAR[u]})` }}>
          <p className="eyebrow" style={{ color: accent }}>Live preview</p>
          <h3 className="disp" style={{ fontSize: 34, margin: "6px 0", fontWeight: 600, fontFamily: `var(${VAR[h]})` }}>Your visa, prepared right the first time.</h3>
          <p style={{ fontFamily: `var(${VAR[b]})`, color: t.vars["--on-navy"] }}>Visit visas, study visas and immigration pathways — with fees and timelines published openly.</p>
          <span className="btn" style={{ background: accent, color: "#0A1A33", fontFamily: `var(${VAR[b]})` }}>Check my eligibility — free</span>
          <p dir="rtl" style={{ fontFamily: `var(${VAR[u]})`, lineHeight: 1.9, marginBottom: 0 }}>آپ کا ویزا، پہلی ہی بار درست تیاری کے ساتھ</p>
        </div>
      </div>
      {play > 0 && <Splash key={play} style={splash} duration={dur} oncePerSession={false} skipLabel="Skip" />}
    </div>
  );
}
