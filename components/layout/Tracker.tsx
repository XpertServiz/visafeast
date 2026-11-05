"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function sessionId(): string {
  try {
    let s = sessionStorage.getItem("vf_sid");
    if (!s) { s = crypto.randomUUID(); sessionStorage.setItem("vf_sid", s); }
    return s;
  } catch { return "anon"; }
}
const cookie = (n: string) => document.cookie.split("; ").find((c) => c.startsWith(n + "="))?.split("=")[1];

/** First-party analytics beacon (brief §12): page view per route change, 30 s presence heartbeat, time-on-page on hide. */
export function Tracker({ locale }: { locale: "en" | "ur" }) {
  const path = usePathname();
  const start = useRef(Date.now());
  const first = useRef(true);

  useEffect(() => {
    if (!path || path.startsWith("/admin")) return;
    start.current = Date.now();
    const sp = new URLSearchParams(location.search);
    const body = {
      type: "view", path, referrer: document.referrer || null, locale,
      utm: { source: sp.get("utm_source"), medium: sp.get("utm_medium"), campaign: sp.get("utm_campaign") },
      lang: navigator.language, screen: `${screen.width}x${screen.height}`, sid: sessionId(),
      returning: Boolean(cookie("vf_vid")), landing: first.current,
    };
    first.current = false;
    try { navigator.sendBeacon("/api/track", new Blob([JSON.stringify(body)], { type: "application/json" })); } catch { /* ignore */ }
  }, [path, locale]);

  useEffect(() => {
    const beat = () => {
      if (document.visibilityState !== "visible" || location.pathname.startsWith("/admin")) return;
      try { navigator.sendBeacon("/api/presence", new Blob([JSON.stringify({ sid: sessionId(), path: location.pathname, lang: navigator.language, locale, referrer: document.referrer || null })], { type: "application/json" })); } catch { /* ignore */ }
    };
    beat();
    const id = setInterval(beat, 30000);
    const hide = () => {
      if (document.visibilityState === "hidden") {
        try { navigator.sendBeacon("/api/track", new Blob([JSON.stringify({ type: "duration", path: location.pathname, sid: sessionId(), ms: Date.now() - start.current })], { type: "application/json" })); } catch { /* ignore */ }
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", hide); };
  }, [locale]);
  return null;
}
