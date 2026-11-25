import { BANNED_WORDS, NOT_OFFICIAL_HOSTS, OFFER_RULES, REVIEW_DUE_DAYS, RISK_HIGH_AT, RISK_MEDIUM_AT, TYPES, VERDICTS, type RcType, type Risk, type Verdict } from "@/config/reality-check";

export interface RcRow { claim: string; rule: string; verdict: Verdict }
export interface RcSource { title: string; url: string }
export interface RealityCheck {
  id: string; slug: string; title: string; claim: string; country: string | null; type: RcType; verdict: Verdict;
  summary: string; what_true: string; what_misleading: string; what_missing: string;
  rows: RcRow[]; checklist: string[]; sources: RcSource[]; verified_on: string; ur_summary: string | null;
  status: "draft" | "published"; published_at: string | null; updated_at: string;
}
export type RcInput = Omit<RealityCheck, "id" | "published_at" | "updated_at">;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Banned words (and any "do not name" names) found in the text. */
export function bannedIn(text: string, doNotName: string[] = []): string[] {
  const found: string[] = [];
  for (const w of BANNED_WORDS) {
    const re = w === "100%" ? /100\s?%/i : new RegExp(`(?<![\\p{L}\\p{N}])${esc(w)}(?![\\p{L}\\p{N}])`, "iu");
    if (re.test(text)) found.push(w);
  }
  for (const n of doNotName.map((x) => x.trim()).filter((x) => x.length >= 2)) if (new RegExp(esc(n), "i").test(text)) found.push(`the name "${n}"`);
  return found;
}
export function allText(c: Pick<RcInput, "title" | "claim" | "country" | "summary" | "what_true" | "what_misleading" | "what_missing" | "rows" | "checklist" | "sources" | "ur_summary">): string {
  return [c.title, c.claim, c.country, c.summary, c.what_true, c.what_misleading, c.what_missing, c.ur_summary, ...c.rows.flatMap((r) => [r.claim, r.rule]), ...c.checklist, ...c.sources.map((s) => s.title)].filter(Boolean).join("\n");
}
export function sourceUrlOk(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase().replace(/^www\./, "");
    return h.includes(".") && !NOT_OFFICIAL_HOSTS.some((b) => h === b || h.endsWith(`.${b}`));
  } catch { return false; }
}
/** Everything that must be true before a post goes live. Empty list = OK to publish. */
export function publishErrors(c: RcInput, doNotName: string[] = []): string[] {
  const e: string[] = [];
  if (!c.title.trim()) e.push("Add a title.");
  if (!c.claim.trim()) e.push("Add the claim.");
  if (!VERDICTS.includes(c.verdict)) e.push("Choose a verdict.");
  if (!c.summary.trim()) e.push("Add a short summary.");
  if (c.sources.length < 1) e.push("Add at least one official source link.");
  const bad = c.sources.filter((s) => !sourceUrlOk(s.url));
  if (bad.length) e.push(`These links are not valid official sources (use an https link to an immigration authority or university page, not social media): ${bad.map((s) => s.url).join(", ")}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.verified_on)) e.push("Add the last-verified date.");
  const hits = bannedIn(allText(c), doNotName);
  if (hits.length) e.push(`Remove these words before publishing: ${[...new Set(hits)].join(", ")}.`);
  return e;
}
export const reviewDue = (verifiedOn: string, now = Date.now()) => now - new Date(`${verifiedOn}T00:00:00Z`).getTime() > REVIEW_DUE_DAYS * 86400_000;
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
export const isType = (v: unknown): v is RcType => TYPES.includes(v as RcType);
export const isVerdict = (v: unknown): v is Verdict => VERDICTS.includes(v as Verdict);

/** Risk for the "Check an offer" tool. */
export function offerRisk(ticked: string[]): { score: number; risk: Risk } {
  const score = OFFER_RULES.filter((r) => ticked.includes(r.id)).reduce((n, r) => n + r.weight, 0);
  return { score, risk: score >= RISK_HIGH_AT ? "high" : score >= RISK_MEDIUM_AT ? "medium" : "low" };
}
