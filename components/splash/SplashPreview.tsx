"use client";
import { useEffect, useState } from "react";
import { SplashArt } from "./Splash";

/** "Play preview" in Admin -> Appearance: the same intro the public site shows, for the chosen style and duration. */
export function SplashPreview({ style, duration, skipLabel }: { style: string; duration: number; skipLabel: string }) {
  const [show, setShow] = useState(true);
  const ms = Math.min(Math.max(duration || 2200, 800), 3000);
  useEffect(() => { const t = setTimeout(() => setShow(false), ms); return () => clearTimeout(t); }, [ms]);
  if (!show || style === "off") return null;
  return (
    <div id="vf-splash" className="sky" dir="ltr" style={{ display: "flex" }}>
      <SplashArt style={style} ms={ms} />
      <button type="button" onClick={() => setShow(false)} style={{ position: "absolute", top: 16, insetInlineEnd: 16, color: "#fff", background: "transparent", border: "1px solid rgba(255,255,255,.4)", borderRadius: 999, padding: "10px 18px", minHeight: 44, cursor: "pointer" }}>{skipLabel}</button>
    </div>
  );
}
