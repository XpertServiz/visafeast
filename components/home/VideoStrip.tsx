"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { HeroVideo } from "@/lib/types";
import { track } from "@/lib/track-client";

const PlayMark = () => (
  <svg style={{ position: "absolute" }} width="52" height="52" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#F2A93B" /><path d="M10 8l6 4-6 4z" fill="#0A1A33" /></svg>
);

/**
 * Owner's YouTube videos (brief §6.7), laid out as in the approved prototype: three cards on desktop, one on a phone, arrows and a count.
 * Until the owner adds videos, empty "coming soon" cards hold the layout. Real iframes mount only after load + in-view;
 * saveData / reduced-motion: no autoplay, a click loads that one video.
 */
export function VideoStrip({ videos, eyebrow, title, soon, label, muted, of }: { videos: HeroVideo[]; eyebrow: string; title: string; soon: string; label: string; muted: string; of: string }) {
  const empty = videos.length === 0;
  const items: HeroVideo[] = empty ? Array.from({ length: 5 }, (_, i) => ({ id: `soon-${i}`, video_id: "", title: null, caption: null, is_short: false, sort_order: i })) : videos;
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", slidesToScroll: 1, containScroll: "trimSnaps" });
  const [inView, setInView] = useState<Set<number>>(new Set());
  const [canPlay, setCanPlay] = useState(false);
  const [clicked, setClicked] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState(0);
  const [perView, setPerView] = useState(3);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 960px)");
    const sync = () => setPerView(narrow.matches ? 1 : 3);
    sync(); narrow.addEventListener("change", sync);
    return () => narrow.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const save = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
    if (empty || reduce || save || !root.current) return;
    let loaded = document.readyState === "complete", seen = false;
    const ok = () => { if (loaded && seen) setCanPlay(true); };
    const onLoad = () => { loaded = true; ok(); };
    if (!loaded) window.addEventListener("load", onLoad);
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; ok(); }, { threshold: 0.25 });
    io.observe(root.current); ok();
    return () => { io.disconnect(); window.removeEventListener("load", onLoad); };
  }, [empty]);

  const update = useCallback(() => {
    if (!embla) return;
    setInView(new Set(embla.slidesInView()));
    setSel(embla.selectedScrollSnap());
  }, [embla]);
  useEffect(() => { if (!embla) return; update(); embla.on("select", update).on("slidesInView", update).on("reInit", update); }, [embla, update]);

  const play = (id: string) => { setClicked((s) => new Set(s).add(id)); track("video_click", { video_id: id }); };
  const next = () => { if (embla?.canScrollNext()) embla.scrollNext(); else embla?.scrollTo(0); };
  const arrow = { width: 48, height: 48, borderRadius: "50%", cursor: "pointer", fontSize: 20 } as const;

  return (
    <section ref={root} id="videos" className="sec" style={{ paddingBlock: "64px 24px" }}>
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
        <div style={{ display: "flex", gap: 18 }}>
          {items.map((v, i) => {
            const mounted = !empty && ((canPlay && inView.has(i)) || clicked.has(v.video_id));
            const auto = canPlay && !clicked.has(v.video_id);
            const tag = `${v.is_short ? "SHORT" : `${label} ${i + 1}`} · ${muted}`;
            return (
              <div key={v.id} className="vslide" style={{ minWidth: 0, background: "var(--navy)", borderRadius: 16, padding: 10, color: "#fff" }}>
                <div style={{ position: "relative", aspectRatio: "16 / 9", borderRadius: 10, background: "var(--navy-2)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {empty ? <PlayMark /> : mounted ? (
                    <iframe title={v.title || "Visafeast video"} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
                      src={`https://www.youtube-nocookie.com/embed/${v.video_id}?autoplay=1&mute=${auto ? 1 : 0}&playsinline=1&loop=1&playlist=${v.video_id}&rel=0&modestbranding=1&controls=1`}
                      style={{ border: 0, height: "100%", aspectRatio: v.is_short ? "9 / 16" : "16 / 9", width: v.is_short ? "auto" : "100%" }}
                      onLoad={() => track("video_view", { video_id: v.video_id })} />
                  ) : (
                    <button type="button" onClick={() => play(v.video_id)} aria-label={`Play: ${v.title ?? "video"}`} style={{ all: "unset", cursor: "pointer", position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Image src={`https://i.ytimg.com/vi/${v.video_id}/hqdefault.jpg`} alt="" fill sizes="(max-width: 960px) 100vw, 33vw" style={{ objectFit: v.is_short ? "contain" : "cover" }} />
                      <PlayMark />
                    </button>
                  )}
                  {!mounted && <span className="mono" style={{ position: "absolute", left: 10, top: 10, fontSize: 10.5, color: "var(--amber)", textTransform: "uppercase" }}>{tag}</span>}
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
