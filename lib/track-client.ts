"use client";
// Tiny first-party event helper. Uses sendBeacon so it never blocks the page. No raw IPs are ever sent or stored.
export function track(name: string, meta?: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ type: "event", name, path: location.pathname, meta });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
  } catch { /* ignore */ }
}
