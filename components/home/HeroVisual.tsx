"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { STAMPS, LABELS, ROUTES } from "./HeroGlobe2D";

const Globe = dynamic(() => import("./HeroGlobe2D").then((m) => m.HeroGlobe2D), { ssr: false });

/** Globe + passport with stamps. Loads after idle so the H1 stays the LCP element (brief §7). */
export function HeroVisual({ label }: { label: string }) {
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [route, setRoute] = useState(0);
  const [shown, setShown] = useState<number[]>([]);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(rm); setMobile(window.innerWidth < 768);
    if (rm) setShown(STAMPS.map((_, i) => i));
    const go = () => setReady(true);
    const w = window as unknown as { requestIdleCallback?: (f: () => void) => number; cancelIdleCallback?: (n: number) => void };
    const id = w.requestIdleCallback ? w.requestIdleCallback(go) : window.setTimeout(go, 300);
    return () => { if (w.cancelIdleCallback) w.cancelIdleCallback(id); else clearTimeout(id); };
  }, []);

  const [f, t] = ROUTES[route];
  return (
    <div role="img" aria-label={label} style={{ flex: "1 1 620px", minWidth: 0, height: mobile ? 460 : 620, position: "relative" }} dir="ltr">
      {ready && (
        <Globe staticFrame={reduced} mobile={mobile}
          onRoute={(i) => { setRoute(i); if (i === 0) setShown([]); }}
          onArrive={(i) => setShown((s) => (s.includes(i) ? s : [...s, i]))} />
      )}
      <div className="mono" style={{ position: "absolute", left: 8, top: 8, display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 999, background: "rgba(10,26,51,.72)", border: "1px solid rgba(242,169,59,.35)", color: "#fff", fontSize: 13, letterSpacing: ".04em" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)" }} />
        <span>{reduced ? "KHI → WORLD" : `${f} → ${t}`}</span><span style={{ color: "var(--on-navy-2)" }}>·</span><span style={{ color: "var(--amber)" }}>{reduced ? "8 destinations" : LABELS[route]}</span>
      </div>
      <div className="paper" style={{ position: "absolute", right: 0, bottom: 4, width: 272, height: 340, borderRadius: 10, transform: `rotate(-4deg) scale(${mobile ? 0.72 : 1})`, transformOrigin: "bottom right", boxShadow: "0 24px 50px rgba(0,0,0,.45), inset 0 0 0 1px rgba(0,0,0,.06)", overflow: "hidden" }} aria-hidden>
        <div style={{ position: "absolute", insetInline: 0, top: 0, padding: "12px 16px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(31,78,140,.18)" }}>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: ".14em", color: "#4A5872" }}>VISAS</span>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: ".14em", color: "#4A5872" }}>PAGE 07</span>
        </div>
        {STAMPS.map((s, i) => shown.includes(i) && (
          <div key={s.code} className="stamp mono" style={{ position: "absolute", left: s.x, top: s.y, ["--r" as string]: s.rot, transform: `rotate(${s.rot})`, border: `2.5px solid ${s.color}`, color: s.color, borderRadius: s.radius, padding: "7px 10px", textAlign: "center", opacity: 0.9, lineHeight: 1.15 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".06em" }}>{s.country}</div>
            <div style={{ fontSize: 9, letterSpacing: ".1em", marginTop: 2 }}>{s.kind}</div>
            <div style={{ fontSize: 9, marginTop: 3, borderTop: `1px solid ${s.color}`, paddingTop: 3 }}>{s.code}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
