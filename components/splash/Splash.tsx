"use client";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/layout/Logo";

type Style = "plane_stamp" | "globe_spin" | "passport_open" | "boarding_pass" | "logo_fade" | "off" | string;

/**
 * Intro overlay (brief §9.12). Rules: once per session, max 3 s, visible Skip button, never for bots,
 * never when prefers-reduced-motion, never delays LCP (real content renders underneath; this mounts after hydration).
 * Styles are lightweight CSS animations (no 3D download). Text inside is only the brand name.
 */
export function Splash({ style, duration, oncePerSession, skipLabel }: { style: Style; duration: number; oncePerSession: boolean; skipLabel: string }) {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);
  const ms = Math.min(Math.max(duration || 2200, 800), 3000);

  useEffect(() => {
    if (style === "off") return;
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (/bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent)) return;
      if (oncePerSession) { if (sessionStorage.getItem("vf_splash")) return; sessionStorage.setItem("vf_splash", "1"); }
    } catch { /* storage blocked: still show once */ }
    setShow(true);
    const a = setTimeout(() => setFading(true), ms - 350);
    const b = setTimeout(() => setShow(false), ms);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [style, ms, oncePerSession]);

  if (!show) return null;
  const close = () => { setFading(true); setTimeout(() => setShow(false), 250); };
  return (
    <div aria-hidden={false} role="presentation" className="sky" dir="ltr"
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 18, transition: "opacity .35s", opacity: fading ? 0 : 1, pointerEvents: fading ? "none" : "auto" }}>
      <style>{`
        @keyframes sp-fade{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
        @keyframes sp-fly{0%{transform:translate(-160px,40px) rotate(-12deg);opacity:0}40%{opacity:1}100%{transform:translate(120px,-30px) rotate(-12deg);opacity:1}}
        @keyframes sp-stamp{0%,55%{opacity:0;transform:scale(2) rotate(-8deg)}75%{opacity:.95}100%{opacity:.92;transform:scale(1) rotate(-8deg)}}
        @keyframes sp-spin{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}
        @keyframes sp-open{from{transform:rotateY(0)}to{transform:rotateY(-150deg)}}
        @keyframes sp-slide{from{transform:translateX(-120%)}to{transform:translateX(0)}}
        @keyframes sp-scan{0%,60%{top:0;opacity:0}70%{opacity:1}100%{top:100%;opacity:0}}
      `}</style>
      <div style={{ position: "relative", height: 150, display: "flex", alignItems: "center", justifyContent: "center", perspective: 700 }}>
        {style === "plane_stamp" && (<>
          <svg width="84" height="84" viewBox="0 0 24 24" fill="#fff" style={{ animation: `sp-fly ${ms * 0.5}ms ease-out forwards`, filter: "drop-shadow(0 0 10px #F2A93B)" }} aria-hidden><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
          <div className="mono" style={{ position: "absolute", border: "3px solid #2F6B3A", color: "#6FD08A", padding: "6px 14px", borderRadius: 6, fontWeight: 600, letterSpacing: ".12em", animation: `sp-stamp ${ms}ms ease-out forwards`, background: "rgba(10,26,51,.6)" }}>APPROVED</div>
        </>)}
        {style === "globe_spin" && (
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #3E7BC4, #0B2A52 70%)", boxShadow: "0 0 40px rgba(64,132,220,.4)", animation: `sp-spin ${ms}ms ease-in-out` }} />
        )}
        {style === "passport_open" && (
          <div style={{ width: 110, height: 140, background: "#0F2A4D", border: "2px solid #F2A93B", borderRadius: "6px 12px 12px 6px", transformOrigin: "left center", animation: `sp-open ${ms * 0.7}ms ease-in-out forwards`, display: "flex", alignItems: "center", justifyContent: "center" }}><LogoMark size={48} /></div>
        )}
        {style === "boarding_pass" && (
          <div style={{ position: "relative", overflow: "hidden", width: 260, background: "#fff", borderRadius: 14, padding: "14px 18px", color: "#0A1A33", animation: `sp-slide ${ms * 0.35}ms ease-out`, display: "flex", justifyContent: "space-between" }}>
            <span className="mono" style={{ fontWeight: 600 }}>KHI</span><span>✈</span><span className="mono" style={{ fontWeight: 600 }}>ANY</span>
            <i style={{ position: "absolute", left: 0, right: 0, height: 3, background: "#F2A93B", animation: `sp-scan ${ms}ms linear` }} />
          </div>
        )}
        {(style === "logo_fade" || !["plane_stamp", "globe_spin", "passport_open", "boarding_pass"].includes(style)) && (
          <div style={{ animation: "sp-fade .6s ease-out both" }}><LogoMark size={96} /></div>
        )}
      </div>
      <p className="disp" style={{ margin: 0, color: "#fff", fontSize: 34, fontWeight: 600, animation: "sp-fade .8s ease-out both" }}>Visafeast</p>
      <button type="button" onClick={close} style={{ position: "absolute", top: 16, insetInlineEnd: 16, color: "#fff", background: "transparent", border: "1px solid rgba(255,255,255,.4)", borderRadius: 999, padding: "10px 18px", minHeight: 44, cursor: "pointer" }}>{skipLabel}</button>
    </div>
  );
}
