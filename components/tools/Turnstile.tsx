"use client";
import { useEffect, useMemo, useRef } from "react";

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void; reset: (id: string) => void } } }

const KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const WAIT_MS = 15000;

export interface BotCheck { token: string; widget?: string; take: () => Promise<string> }

/**
 * One per form. `take()` waits until the check has finished, so someone quick or on a slow connection is not refused,
 * then asks for a fresh token, because each token works only once.
 */
export function useBotCheck(): BotCheck {
  return useMemo(() => {
    const bot: BotCheck = {
      token: "",
      async take() {
        if (!KEY) return "";
        const start = Date.now();
        while (!bot.token && Date.now() - start < WAIT_MS) await new Promise((r) => setTimeout(r, 150));
        const t = bot.token;
        bot.token = "";
        if (bot.widget) window.turnstile?.reset(bot.widget);
        return t;
      },
    };
    return bot;
  }, []);
}

/** Cloudflare Turnstile. Loads only when its form comes near, and stays invisible unless a visitor must prove they are human. Renders nothing when no site key is set (local dev). */
export function Turnstile({ bot }: { bot: BotCheck }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!KEY || !ref.current) return;
    const mount = () => { if (window.turnstile && ref.current && !bot.widget) bot.widget = window.turnstile.render(ref.current, { sitekey: KEY, callback: (t: string) => { bot.token = t; }, theme: "auto", appearance: "interaction-only" }); };
    const load = () => {
      if (window.turnstile) return mount();
      let s = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
      if (!s) { s = document.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; s.async = true; s.dataset.turnstile = "1"; document.head.appendChild(s); }
      s.addEventListener("load", mount);
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); load(); } }, { rootMargin: "800px" });
    io.observe(ref.current);
    return () => { io.disconnect(); if (bot.widget && window.turnstile) { window.turnstile.remove(bot.widget); bot.widget = undefined; bot.token = ""; } };
  }, [bot]);
  if (!KEY) return null;
  return <div ref={ref} />;
}
