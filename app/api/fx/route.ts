import { NextResponse } from "next/server";

const SOURCES = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json",
  "https://latest.currency-api.pages.dev/v1/currencies/usd.min.json",
];

/** Exchange rates from a free public source, fetched at most once a day. If it is unavailable, the page simply shows no conversion. */
export async function GET() {
  for (const url of SOURCES) {
    try {
      const r = await fetch(url, { next: { revalidate: 86400 } });
      if (!r.ok) continue;
      const j = (await r.json()) as { date?: string; usd?: Record<string, number> };
      if (!j.usd) continue;
      const rates = Object.fromEntries(Object.entries(j.usd).filter(([k]) => /^[a-z]{3}$/.test(k)).map(([k, v]) => [k.toUpperCase(), v]));
      return NextResponse.json({ date: j.date ?? null, rates }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" } });
    } catch { /* try the next source */ }
  }
  return NextResponse.json({ date: null, rates: {} }, { headers: { "Cache-Control": "public, s-maxage=600" } });
}
