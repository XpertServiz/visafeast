"use client";
import { useEffect, useState } from "react";
import { currencyForCountry, localeMeta, type Locale } from "@/config/locales";
import { convert, formatApprox, parseMoney } from "@/lib/currency";

type Rates = Record<string, number>;
let ratesOnce: Promise<Rates> | null = null;
const loadRates = () => (ratesOnce ??= fetch("/api/fx").then((r) => r.json()).then((j: { rates?: Rates }) => j.rates ?? {}).catch(() => ({})));

const visitorCurrency = () => {
  try { return currencyForCountry(document.cookie.match(/(?:^|; )vf_cc=([A-Z]{2})/)?.[1]); } catch { return null; }
};

/** After an official fee: "≈ €62" in the visitor's own currency, today's rate. Stays empty if the rate or currency is unknown. */
export function LocalPrice({ text, locale }: { text: string | null | undefined; locale: Locale }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const money = parseMoney(text), to = visitorCurrency();
    if (!money || !to) return;
    let alive = true;
    void loadRates().then((rates) => {
      const v = convert(money, to, rates);
      if (alive && v) setLabel(`≈ ${formatApprox(v, to, localeMeta(locale).intl)}`);
    });
    return () => { alive = false; };
  }, [text, locale]);
  if (!label) return null;
  return <span dir="ltr" className="local-price" style={{ display: "inline-block", marginInlineStart: 6, fontWeight: 400, fontSize: "0.88em", color: "var(--muted)" }}>{label}</span>;
}
