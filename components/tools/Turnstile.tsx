"use client";
import { useEffect, useRef } from "react";

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void } } }

/** Cloudflare Turnstile widget. Renders nothing when no site key is set (local dev). */
export function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  useEffect(() => {
    if (!key || !ref.current) return;
    let id: string | undefined;
    const mount = () => { if (window.turnstile && ref.current && !id) id = window.turnstile.render(ref.current, { sitekey: key, callback: onToken, theme: "auto" }); };
    if (window.turnstile) mount();
    else {
      let s = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
      if (!s) { s = document.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; s.async = true; s.dataset.turnstile = "1"; document.head.appendChild(s); }
      s.addEventListener("load", mount);
    }
    return () => { if (id && window.turnstile) window.turnstile.remove(id); };
  }, [key, onToken]);
  if (!key) return null;
  return <div ref={ref} style={{ minHeight: 65 }} />;
}
