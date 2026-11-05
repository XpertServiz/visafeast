"use client";
import { useEffect, useRef, useState } from "react";

/** The booking calendar is heavy, so it loads only when the visitor gets close to it. */
export function CalFrame({ src, title, className }: { src: string; title: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!box.current || !("IntersectionObserver" in window)) { setShow(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(box.current);
    return () => io.disconnect();
  }, []);
  return show ? <iframe title={title} src={src} className={className} /> : <div ref={box} className={className} />;
}
