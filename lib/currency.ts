// Shows an official fee in the visitor's own money, clearly marked as approximate. The official amount itself is never changed.
const SYMBOLS: [string, string][] = [["US$", "USD"], ["CA$", "CAD"], ["C$", "CAD"], ["A$", "AUD"], ["AU$", "AUD"], ["NZ$", "NZD"], ["S$", "SGD"], ["£", "GBP"], ["€", "EUR"], ["$", "USD"]];
const CODES = "PKR|USD|GBP|EUR|CAD|AUD|NZD|SGD|THB|AZN|AED|SAR|CHF|TRY|CNY|INR|JPY";

export interface Money { amount: number; currency: string }

/** Finds the first amount in a fee text: "CAD 100 per person", "from NZD 441", "£135", "S$30". Null when there is none. */
export function parseMoney(text: string | null | undefined): Money | null {
  if (!text) return null;
  const num = (s: string) => Number(s.replace(/,/g, ""));
  const byCode = text.match(new RegExp(`\\b(${CODES})\\s?(\\d[\\d,]*(?:\\.\\d+)?)`));
  let bySym: Money | null = null, symAt = Infinity;
  for (const [sym, currency] of SYMBOLS) {
    const at = text.indexOf(sym);
    if (at < 0 || at >= symAt) continue;
    const m = text.slice(at + sym.length).match(/^\s?(\d[\d,]*(?:\.\d+)?)/);
    if (m) { bySym = { amount: num(m[1]), currency }; symAt = at; }
  }
  if (byCode && (byCode.index ?? 0) < symAt) return { amount: num(byCode[2]), currency: byCode[1] };
  return bySym;
}

/** rates = units of each currency per 1 USD. Null if either currency is unknown, or the fee is already in the visitor's money. */
export function convert(m: Money, to: string, rates: Record<string, number>): number | null {
  if (m.currency === to) return null;
  const from = rates[m.currency], target = rates[to];
  if (!from || !target || !(m.amount > 0)) return null;
  return (m.amount / from) * target;
}

/** Rounded on purpose: this is a guide, and a falsely exact figure would look official. */
export function roundApprox(v: number): number {
  if (v >= 100000) return Math.round(v / 1000) * 1000;
  if (v >= 10000) return Math.round(v / 100) * 100;
  if (v >= 1000) return Math.round(v / 10) * 10;
  return Math.round(v);
}

export function formatApprox(v: number, currency: string, intlLocale: string): string {
  try { return new Intl.NumberFormat(intlLocale, { style: "currency", currency, maximumFractionDigits: 0 }).format(roundApprox(v)); }
  catch { return `${currency} ${roundApprox(v)}`; }
}
