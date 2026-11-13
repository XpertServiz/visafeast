"use client";
import { useEffect, useRef, useState } from "react";
import type { HeroVideo } from "@/lib/types";
import { track } from "@/lib/track-client";

/** The same videos as the landing page (one admin list), as a grid. A YouTube video shows its picture first and loads the player only after a tap. */
export function VideoGrid({ videos, playLabel }: { videos: HeroVideo[]; playLabel: string }) {
  const [on, setOn] = useState<string | null>(null);
  const [near, setNear] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { // pictures load only when the section comes near, so the chat stays fast
    if (!box.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "400px" });
    io.observe(box.current); return () => io.disconnect();
  }, []);
  if (!videos.length) return null;
  return (
    <div className="vgrid" ref={box}>
      {videos.map((v) => (
        <div key={v.id} style={{ minWidth: 0 }}>
          <div style={{ position: "relative", aspectRatio: v.is_short ? "9 / 16" : "16 / 9", borderRadius: 14, overflow: "hidden", background: "var(--navy-2)", border: "1px solid var(--line)" }}>
            {on === v.video_id ? (
              <iframe title={v.title || "Visafeast video"} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen style={{ border: 0, position: "absolute", inset: 0, width: "100%", height: "100%" }}
                src={`https://www.youtube-nocookie.com/embed/${v.video_id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`} />
            ) : (
              <button type="button" aria-label={`${playLabel}: ${v.title ?? "Visafeast"}`} onClick={() => { setOn(v.video_id); track("video_click", { video_id: v.video_id, page: "talk-with-aiman" }); }}
                style={{ all: "unset", cursor: "pointer", position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                {near && <img src={`https://i.ytimg.com/vi/${v.video_id}/hqdefault.jpg`} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                <svg width="56" height="56" viewBox="0 0 24 24" aria-hidden style={{ position: "relative", filter: "drop-shadow(0 6px 14px rgba(0,0,0,.45))" }}><circle cx="12" cy="12" r="11" fill="#F5B942" /><path d="M10 7.8l6.2 4.2-6.2 4.2z" fill="#0B1F3A" /></svg>
              </button>
            )}
          </div>
          {v.title && <p style={{ margin: "8px 2px 0", fontSize: 13, fontWeight: 600, overflowWrap: "anywhere" }}>{v.title}</p>}
        </div>
      ))}
    </div>
  );
}
