"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { HeroVideo } from "@/lib/types";
import { track } from "@/lib/track-client";

/**
 * Owner's YouTube videos (brief §6.7). 1–3 -> static row; 4+ -> embla slider (loop, arrows, dots, swipe).
 * Thumbnails are server-friendly <Image>s; real iframes mount only after load + in-view, and only for slides in view.
 * saveData / reduced-motion: no autoplay — a click loads that one video.
 */
export function VideoStrip({ videos, eyebrow, channelUrl, allLabel }: { videos: HeroVideo[]; eyebrow: string; channelUrl: string | null; allLabel: string }) {
  const slider = videos.length > 3;
  const [emblaRef, embla] = useEmblaCarousel({ loop: slider, align: "start", slidesToScroll: 1, containScroll: slider ? false : "trimSnaps", watchDrag: slider });
  const [inView, setInView] = useState<Set<number>>(new Set());
  const [canPlay, setCanPlay] = useState(false);
  const [clicked, setClicked] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const save = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduce || save || !root.current) return;
    let loaded = document.readyState === "complete", seen = false;
    const ok = () => { if (loaded && seen) setCanPlay(true); };
    const onLoad = () => { loaded = true; ok(); };
    if (!loaded) window.addEventListener("load", onLoad);
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; ok(); }, { threshold: 0.25 });
    io.observe(root.current); ok();
    return () => { io.disconnect(); window.removeEventListener("load", onLoad); };
  }, []);

  const update = useCallback(() => {
    if (!embla) return;
    setInView(new Set(embla.slidesInView()));
    setSel(embla.selectedScrollSnap());
  }, [embla]);
  useEffect(() => { if (!embla) return; update(); embla.on("select", update).on("slidesInView", update).on("reInit", update); }, [embla, update]);

  if (!videos.length) return null;
  const play = (id: string) => { setClicked((s) => new Set(s).add(id)); track("video_click", { video_id: id }); };

  return (
    <section ref={root} aria-label={eyebrow} className="sky" style={{ paddingBlock: 40 }}>
      <div className="wrap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <p className="eyebrow" style={{ color: "var(--amber)", margin: 0 }}>{eyebrow}</p>
          {channelUrl && <a href={channelUrl} rel="noopener" style={{ color: "var(--amber)", fontWeight: 600 }}>{allLabel}</a>}
        </div>
        <div style={{ position: "relative" }}>
          <div ref={emblaRef} style={{ overflow: slider ? "hidden" : "auto" }} tabIndex={slider ? 0 : undefined} aria-roledescription={slider ? "carousel" : undefined}>
            <div style={{ display: "flex", gap: 18 }}>
              {videos.map((v, i) => {
                const mounted = (canPlay && (!slider || inView.has(i))) || clicked.has(v.video_id);
                const auto = canPlay && !clicked.has(v.video_id);
                return (
                  <div key={v.id} className="vslide" style={{ minWidth: 0 }}>
                    <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#000", borderRadius: 16, overflow: "hidden", display: "flex", justifyContent: "center" }}>
                      {mounted ? (
                        <iframe title={v.title || "Visafeast video"} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
                          src={`https://www.youtube-nocookie.com/embed/${v.video_id}?autoplay=1&mute=${auto ? 1 : 0}&playsinline=1&loop=1&playlist=${v.video_id}&rel=0&modestbranding=1&controls=1`}
                          style={{ border: 0, height: "100%", aspectRatio: v.is_short ? "9 / 16" : "16 / 9", width: v.is_short ? "auto" : "100%" }}
                          onLoad={() => track("video_view", { video_id: v.video_id })} />
                      ) : (
                        <button type="button" onClick={() => play(v.video_id)} aria-label={`Play: ${v.title ?? "video"}`} style={{ all: "unset", cursor: "pointer", position: "absolute", inset: 0, display: "flex", justifyContent: "center" }}>
                          <Image src={`https://i.ytimg.com/vi/${v.video_id}/hqdefault.jpg`} alt="" fill sizes="(max-width: 960px) 88vw, 33vw" style={{ objectFit: v.is_short ? "contain" : "cover" }} />
                          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--amber)", color: "#0A1A33", display: "flex", alignItems: "center", justifyContent: "center" }}><Play fill="currentColor" /></span>
                          </span>
                        </button>
                      )}
                    </div>
                    {v.title && <p style={{ color: "#fff", margin: "10px 0 0", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.title}</p>}
                    {v.caption && <p style={{ color: "var(--on-navy-2)", margin: "2px 0 0", fontSize: 14 }}>{v.caption}</p>}
                  </div>
                );
              })}
            </div>
          </div>
          {slider && (
            <>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 18 }}>
                <button type="button" aria-label="Previous videos" onClick={() => embla?.scrollPrev()} className="btn btn-ghost" style={{ minWidth: 48, padding: 0 }}><ChevronLeft /></button>
                <div role="tablist" aria-label="Slides" style={{ display: "flex", gap: 8 }}>
                  {embla?.scrollSnapList().map((_, i) => <button key={i} role="tab" aria-selected={sel === i} aria-label={`Slide ${i + 1}`} onClick={() => embla.scrollTo(i)} style={{ width: 11, height: 11, borderRadius: "50%", border: 0, cursor: "pointer", background: sel === i ? "var(--amber)" : "rgba(255,255,255,.35)", padding: 0 }} />)}
                </div>
                <button type="button" aria-label="Next videos" onClick={() => embla?.scrollNext()} className="btn btn-ghost" style={{ minWidth: 48, padding: 0 }}><ChevronRight /></button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
