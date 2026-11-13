"use client";
import { memo, useEffect, useRef, useState } from "react";

/**
 * Aiman's hero video: plays ONCE (Aiman and the client sit down), then rests on the last frame. It never loops and never restarts,
 * because this component takes no props and is memoised, so a re-render, a language switch or a chat reset cannot touch it.
 * On a slow or data-saving connection (or with reduced motion) only the poster is shown and the video is never downloaded.
 */
export const AimanVideo = memo(function AimanVideo() {
  const [mode, setMode] = useState<"wait" | "video" | "poster">("wait");
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const c = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = Boolean(c?.saveData) || /(^|-)(slow-2g|2g|3g)$/.test(c?.effectiveType ?? "");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(slow || calm ? "poster" : "video");
  }, []);
  return (
    <div className="portrait" style={{ backgroundImage: "url(/aiman/aiman-poster.jpg)", backgroundSize: "cover", backgroundPosition: "18% 60%" }}>
      {mode === "video" && (
        <video ref={ref} autoPlay muted playsInline preload="auto" poster="/aiman/aiman-poster.jpg" aria-label="Aiman, Visafeast advisor"
          onEnded={(e) => { const v = e.currentTarget; v.pause(); try { v.currentTime = Math.max(0, v.duration - 0.05); } catch { /* stays on the last frame */ } }}>
          <source src="/aiman/aiman-sitting.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
});
