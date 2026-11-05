// Spotting robots that behave like visitors. Search-engine bots are already refused by their user-agent (isbot); these are the ones that
// pretend to be a phone or a browser. No IP address is used: only what the browser says about itself, and the city the hosting edge reports.

/** Cities that are mostly cloud data centres (where scanners, link checkers and monitoring tools run from), not homes or offices. */
const HUBS = new Set(["ashburn", "boardman", "council bluffs", "the dalles", "san jose", "santa clara", "groningen", "eemshaven", "falkenstein", "nuremberg", "st. ghislain", "hamina", "secaucus", "clifton"]);

export interface Signals { lang?: string | null; os?: string | null; screen?: string | null; city?: string | null; webdriver?: boolean }

/**
 * Strong signs only (safe to refuse the visit outright):
 * - the browser is driven by automation (navigator.webdriver)
 * - no language, or a server-style one such as "en-US@posix", which no phone or laptop reports
 * - a phone that says it has a desktop-sized screen
 */
export function automated(s: Signals): string | null {
  if (s.webdriver) return "automation";
  if (s.lang !== undefined && s.lang !== null && (s.lang === "" || /@posix|^c$/i.test(s.lang))) return "server language";
  const w = Number(String(s.screen ?? "").split("x")[0]);
  if (s.os && /^(ios|android)$/i.test(s.os) && w >= 900) return "phone with a desktop screen";
  return null;
}

/** Weaker sign, used only when looking back at saved visits: a data-centre city, unless the visit clearly behaved like a person. */
export const inHub = (city: string | null | undefined) => HUBS.has((city ?? "").trim().toLowerCase());

interface Row extends Signals { session_id?: string | null; visitor_hash?: string | null; duration_ms?: number | null }

/** Which visits (by session) look automated, among saved page views. A person who read two pages and stayed is never flagged by city alone. */
export function automatedSessions(rows: Row[]): Set<string> {
  const by = new Map<string, Row[]>();
  for (const r of rows) { const k = r.session_id || r.visitor_hash || "?"; (by.get(k) ?? by.set(k, []).get(k)!).push(r); }
  const bad = new Set<string>();
  for (const [k, list] of by) {
    if (list.some((r) => automated(r)) || (list.some((r) => inHub(r.city)) && !(list.length >= 2 && list.some((r) => r.duration_ms)))) bad.add(k);
  }
  return bad;
}
export const sessionKey = (r: Row) => r.session_id || r.visitor_hash || "?";
