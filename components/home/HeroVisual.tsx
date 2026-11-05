"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { GUIDE } from "@/lib/photos";
import { STAMPS, ROUTES } from "./HeroGlobe2D";

const Globe = dynamic(() => import("./HeroGlobe2D").then((m) => m.HeroGlobe2D), { ssr: false });

/** Globe + passport with stamps. Loads after idle so the H1 stays the LCP element (brief §7). */
export function HeroVisual({ label, routeLabels, allLabel }: { label: string; routeLabels: string[]; allLabel: string }) {
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [route, setRoute] = useState(0);
  const [shown, setShown] = useState<number[]>([]);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(rm); setMobile(window.innerWidth < 768);
    if (rm) setShown(STAMPS.map((_, i) => i));
    const net = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (net?.saveData || net?.effectiveType === "2g" || net?.effectiveType === "slow-2g") { setShown(STAMPS.map((_, i) => i)); setReduced(true); return; }
    const go = () => setReady(true);
    const w = window as unknown as { requestIdleCallback?: (f: () => void) => number; cancelIdleCallback?: (n: number) => void };
    const id = w.requestIdleCallback ? w.requestIdleCallback(go) : window.setTimeout(go, 300);
    return () => { if (w.cancelIdleCallback) w.cancelIdleCallback(id); else clearTimeout(id); };
  }, []);

  const [f, t] = ROUTES[route];
  return (
    <div role="img" aria-label={label} className="heroviz" dir="ltr">
      {ready && (
        <Globe staticFrame={reduced} mobile={mobile}
          onRoute={(i) => { setRoute(i); if (i === 0) setShown([]); }}
          onArrive={(i) => setShown((s) => (s.includes(i) ? s : [...s, i]))} />
      )}
      <Image className="hero-guide" src={GUIDE.happy.src} alt="" width={GUIDE.happy.width} height={GUIDE.happy.height} unoptimized loading="eager" />
      <div className="mono" style={{ position: "absolute", zIndex: 3, left: 8, top: 8, display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 999, background: "rgba(10,26,51,.72)", border: "1px solid rgba(242,169,59,.35)", color: "#fff", fontSize: 13, letterSpacing: ".04em" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)" }} />
        <span>{reduced ? "KHI → WORLD" : `${f} → ${t}`}</span><span style={{ color: "var(--on-navy-2)" }}>·</span><span style={{ color: "var(--amber)" }}>{reduced ? allLabel : routeLabels[route]}</span>
      </div>
      <div className="passport paper" aria-hidden>
        <div style={{ position: "absolute", insetInline: 0, top: 0, padding: "12px 16px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(31,78,140,.18)" }}>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: ".14em", color: "#4A5872" }}>VISAS</span>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: ".14em", color: "#4A5872" }}>PAGE 07</span>
        </div>
        {STAMPS.map((s, i) => shown.includes(i) && (
          <div key={s.code} className="stamp mono" style={{ position: "absolute", left: s.x, top: s.y, ["--r" as string]: s.rot, transform: `rotate(${s.rot})`, border: `2.5px solid ${s.color}`, color: s.color, borderRadius: s.radius, padding: "7px 10px", textAlign: "center", opacity: 0.9, lineHeight: 1.15 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em" }}>{s.country}</div>
            <div style={{ fontSize: 9.5, letterSpacing: ".1em", marginTop: 2 }}>{s.kind}</div>
            <div style={{ fontSize: 9, marginTop: 3, borderTop: `1px solid ${s.color}`, paddingTop: 3 }}>{s.code}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
