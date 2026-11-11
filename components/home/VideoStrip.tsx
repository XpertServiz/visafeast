"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { HeroVideo } from "@/lib/types";
import { track } from "@/lib/track-client";

const PlayMark = ({ big }: { big?: boolean }) => (
  <svg className="vplay" width={big ? 76 : 60} height={big ? 76 : 60} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#F2A93B" /><circle cx="12" cy="12" r="11" fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="1" />
    <path d="M10 7.8l6.2 4.2-6.2 4.2z" fill="#0A1A33" />
  </svg>
);

/** YouTube's own picture for the video: the large one first, the standard one if the large one does not exist. */
function Thumb({ id, short, sizes }: { id: string; short: boolean; sizes: string }) {
  const [src, setSrc] = useState(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`);
  return <Image src={src} alt="" fill sizes={sizes} style={{ objectFit: short ? "contain" : "cover" }}
    onError={() => setSrc((s) => (s.includes("maxres") ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : s))} />;
}

/**
 * Owner's YouTube videos (brief §6.7): three cards on desktop, one on a phone, arrows and a count.
 * Owner's choice (2026-11-11): nothing plays by itself. Each card shows the YouTube thumbnail with a play button;
 * a tap loads that one player with sound. One video plays at a time; scrolling the slider away stops it.
 * With one or two videos the cards are larger and centred. Until the owner adds videos, "coming soon" cards hold the layout.
 */
export function VideoStrip({ videos, eyebrow, title, soon, label, play: playLabel, of }: { videos: HeroVideo[]; eyebrow: string; title: string; soon: string; label: string; play: string; of: string }) {
  const empty = videos.length === 0;
  const items: HeroVideo[] = useMemo(() => (empty ? Array.from({ length: 5 }, (_, i) => ({ id: `soon-${i}`, video_id: "", title: null, caption: null, is_short: false, sort_order: i })) : videos), [empty, videos]);
  const few = !empty && items.length < 3 ? items.length : 0;
  const [emblaRef, embla] = useEmblaCarousel({ align: few ? "center" : "start", slidesToScroll: 1, containScroll: "trimSnaps" });
  const [playing, setPlaying] = useState<string | null>(null);
  const [sel, setSel] = useState(0);
  const [perView, setPerView] = useState(3);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 960px)");
    const sync = () => setPerView(narrow.matches ? 1 : 3);
    sync(); narrow.addEventListener("change", sync);
    return () => narrow.removeEventListener("change", sync);
  }, []);

  const update = useCallback(() => {
    if (!embla) return;
    setSel(embla.selectedScrollSnap());
    // a playing video that slides out of view goes back to its thumbnail (stops sound and data use)
    const seen = new Set(embla.slidesInView());
    setPlaying((p) => (p && items.some((v, i) => v.video_id === p && seen.has(i)) ? p : null));
  }, [embla, items]);
  useEffect(() => {
    if (!embla) return;
    update();
    embla.on("select", update).on("slidesInView", update).on("reInit", update);
    return () => { embla.off("select", update).off("slidesInView", update).off("reInit", update); };
  }, [embla, update]);

  const start = (id: string) => { setPlaying(id); track("video_click", { video_id: id }); };
  const next = () => { if (embla?.canScrollNext()) embla.scrollNext(); else embla?.scrollTo(0); };
  const arrow = { width: 48, height: 48, borderRadius: "50%", cursor: "pointer", fontSize: 20 } as const;
  const sizes = few === 1 ? "(max-width: 960px) 100vw, 760px" : few === 2 ? "(max-width: 960px) 100vw, 50vw" : "(max-width: 960px) 100vw, 33vw";

  return (
    <section id="videos" className="sec" style={{ paddingBlock: "64px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <p className="eyebrow" style={{ margin: 0, color: "var(--amber-text)" }}>{eyebrow}</p>
          <h2 className="disp" style={{ margin: "8px 0 0", fontSize: 40, fontWeight: 600, letterSpacing: "-.01em" }}>{title}</h2>
        </div>
        {items.length > perView && (
          <div dir="ltr" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="mono" style={{ fontSize: 13, color: "var(--muted-2)", marginRight: 6 }}>{sel + 1}{perView > 1 ? `–${Math.min(sel + perView, items.length)}` : ""} {of} {items.length}</span>
            <button type="button" aria-label="Previous videos" onClick={() => embla?.scrollPrev()} style={{ ...arrow, border: "1.5px solid var(--navy)", background: "transparent", color: "var(--navy)" }}>←</button>
            <button type="button" aria-label="Next videos" onClick={next} style={{ ...arrow, border: 0, background: "var(--navy)", color: "#fff" }}>→</button>
          </div>
        )}
      </div>
      <div ref={emblaRef} style={{ overflow: "hidden", padding: 4 }} tabIndex={0} aria-roledescription="carousel" dir="ltr">
        <div style={{ display: "flex", gap: 18, justifyContent: few ? "center" : undefined }}>
          {items.map((v, i) => {
            const on = !empty && playing === v.video_id;
            const tag = v.is_short ? "SHORT" : `${label} ${i + 1}`;
            return (
              <div key={v.id} className={`vslide${few ? ` vslide-${few}` : ""}`} style={{ minWidth: 0, background: "var(--navy)", borderRadius: 16, padding: 10, color: "#fff" }}>
                <div style={{ position: "relative", aspectRatio: "16 / 9", borderRadius: 10, background: "var(--navy-2)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {empty ? <PlayMark /> : on ? (
                    <iframe title={v.title || "Visafeast video"} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
                      src={`https://www.youtube-nocookie.com/embed/${v.video_id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
                      style={{ border: 0, height: "100%", aspectRatio: v.is_short ? "9 / 16" : "16 / 9", width: v.is_short ? "auto" : "100%" }}
                      onLoad={() => track("video_view", { video_id: v.video_id })} />
                  ) : (
                    <button type="button" className="vthumb" onClick={() => start(v.video_id)} aria-label={`${playLabel}: ${v.title ?? "Visafeast"}`}
                      style={{ all: "unset", cursor: "pointer", position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Thumb id={v.video_id} short={v.is_short} sizes={sizes} />
                      <span aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,26,51,.35) 0%, rgba(10,26,51,0) 40%, rgba(10,26,51,.25) 100%)" }} />
                      <span style={{ position: "relative", display: "flex" }}><PlayMark big={few === 1} /></span>
                    </button>
                  )}
                  {!on && <span className="mono" style={{ position: "absolute", left: 10, top: 10, fontSize: 10.5, color: "var(--amber)", textTransform: "uppercase", background: "rgba(10,26,51,.7)", padding: "3px 7px", borderRadius: 6, pointerEvents: "none" }}>{tag}</span>}
                </div>
                <p style={{ margin: "12px 6px 4px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{empty ? soon : v.title}</p>
                <p className="mono" style={{ margin: "0 6px 6px", fontSize: 11.5, color: "var(--on-navy-2)" }}>{empty ? "YouTube" : v.caption || "YouTube"}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
