"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Slide } from "@/lib/destination-photos";

export interface SlideshowLabels { region: string; prev: string; next: string; photo: string; of: string }

/**
 * Destination photos for a country page. Light on purpose: only the photo on show (and the next one) is downloaded,
 * it changes by itself only while it is on screen, and it stands still for people who prefer less motion or save data.
 * Dots, arrows, the keyboard and a swipe all work.
 */
export function Slideshow({ slides, labels }: { slides: Slide[]; labels: SlideshowLabels }) {
  const n = slides.length;
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(new Set([0]));
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [motion, setMotion] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);

  const go = useCallback((to: number) => {
    const k = ((to % n) + n) % n;
    setI(k);
    setSeen((s) => new Set(s).add(k).add((k + 1) % n));
  }, [n]);

  useEffect(() => {
    const save = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
    setMotion(!window.matchMedia("(prefers-reduced-motion: reduce)").matches && !save);
    if (!box.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(box.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!motion || !visible || paused || n < 2) return;
    const id = window.setInterval(() => go(i + 1), 2000);
    return () => window.clearInterval(id);
  }, [motion, visible, paused, i, n, go]);

  if (!n) return null;
  const btn = { position: "absolute", top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", border: 0, cursor: "pointer", background: "rgba(10,26,51,.72)", color: "var(--amber)", display: "grid", placeItems: "center", zIndex: 3 } as const;
  const cur = slides[i];

  return (
    <div
      ref={box} role="region" aria-roledescription="carousel" aria-label={labels.region} tabIndex={0} dir="ltr"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      onKeyDown={(e) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); }}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); }}
      className="slideshow" style={{ position: "relative", width: "100%", borderRadius: 18, overflow: "hidden", background: "var(--navy)" }}
    >
      {slides.map((s, k) => (
        <div key={s.src} role="group" aria-roledescription="slide" aria-label={`${labels.photo} ${k + 1} ${labels.of} ${n}`} aria-hidden={k !== i} style={{ position: "absolute", inset: 0, opacity: k === i ? 1 : 0, transition: "opacity .5s ease", pointerEvents: "none" }}>
          {seen.has(k) && <Image src={s.src} alt={k === i ? s.alt : ""} fill unoptimized priority={k === 0} sizes="(max-width: 960px) 100vw, 860px" style={{ objectFit: "cover" }} />}
        </div>
      ))}
      <div aria-hidden style={{ position: "absolute", inset: "auto 0 0 0", height: 72, background: "linear-gradient(transparent, rgba(10,26,51,.62))", zIndex: 1, pointerEvents: "none" }} />
      <p style={{ position: "absolute", left: 12, bottom: 10, margin: 0, fontSize: 12, color: "#fff", zIndex: 2, maxWidth: "70%", lineHeight: 1.3 }}>
        <span style={{ opacity: 0.95 }}>{cur.alt}</span>{" · "}
        <a href={cur.creditUrl} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "#fff", opacity: 0.8 }}>{cur.credit} / Pexels</a>
      </p>
      {n > 1 && (
        <>
          <button type="button" aria-label={labels.prev} onClick={() => go(i - 1)} style={{ ...btn, left: 10 }}><ChevronLeft aria-hidden /></button>
          <button type="button" aria-label={labels.next} onClick={() => go(i + 1)} style={{ ...btn, right: 10 }}><ChevronRight aria-hidden /></button>
          <div style={{ position: "absolute", right: 12, bottom: 8, display: "flex", gap: 2, zIndex: 3 }}>
            {slides.map((s, k) => (
              <button key={s.src} type="button" aria-label={`${labels.photo} ${k + 1} ${labels.of} ${n}`} aria-current={k === i} onClick={() => go(k)} style={{ width: 24, height: 24, border: 0, background: "transparent", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}>
                <span style={{ width: k === i ? 18 : 8, height: 8, borderRadius: 4, background: k === i ? "var(--amber)" : "rgba(255,255,255,.7)", transition: "width .25s" }} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
