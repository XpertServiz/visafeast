"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const clean = (p: string) => (p === "/en" ? "/" : p.startsWith("/en/") ? p.slice(3) : p);

/**
 * Two small safety nets for plain jump links such as /#book:
 * 1. Plain jump links leave history entries the Next.js router ignores, so the Back button could change the address but keep the
 *    old page on screen. If Back lands on a different page from the one showing, this loads it.
 * 2. Very rarely a browser opens /#reviews but never scrolls (the page is still at the top). If that happens in the first
 *    second, this moves to the section. It does nothing once the visitor has scrolled.
 */
export function BackFix() {
  const pathname = usePathname();
  const showing = useRef(pathname);
  useEffect(() => { showing.current = pathname; }, [pathname]);
  useEffect(() => {
    const onPop = (e: PopStateEvent) => { if (!e.state && clean(location.pathname) !== clean(showing.current)) location.reload(); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (!location.hash) return;
    const fix = () => {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el && window.scrollY < 80 && el.getBoundingClientRect().top > 200) el.scrollIntoView();
    };
    const timers = [100, 500, 1200].map((ms) => window.setTimeout(fix, ms));
    return () => timers.forEach(window.clearTimeout);
  }, [pathname]);
  return null;
}
