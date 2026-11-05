"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const clean = (p: string) => (p === "/en" ? "/" : p.startsWith("/en/") ? p.slice(3) : p);

/**
 * Plain jump links (like /#book) leave history entries the Next.js router ignores, so the Back button could change the
 * address but keep the old page on screen. If Back lands on a different page from the one showing, this loads it.
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
  return null;
}
