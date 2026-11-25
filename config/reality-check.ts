/** Visa Reality Check: wording rules, verdict labels and the "Check an offer" risk table. No AI, no server calls. */
export const REALITY_PATH = "/reality-check";
export const REVIEW_DUE_DAYS = 90;

export const VERDICTS = ["true", "partly_true", "misleading", "cannot_verify"] as const;
export type Verdict = (typeof VERDICTS)[number];
export const VERDICT_LABEL: Record<Verdict, string> = { true: "True", partly_true: "Partly true", misleading: "Misleading", cannot_verify: "Cannot verify" };
export const TYPES = ["study", "visit", "work", "immigration"] as const;
export type RcType = (typeof TYPES)[number];
export const TYPE_LABEL: Record<RcType, string> = { study: "Study", visit: "Visit", work: "Work permit", immigration: "Immigration" };

export const FOOTER_NOTE = "Visafeast provides visa guidance only. We are not a recruitment agency and do not offer or sell jobs. Rules change; confirm with the official source before you pay or apply.";

/** Words that block publishing (whole words, any case). "100%" is matched as written. */
export const BANNED_WORDS = ["guaranteed", "guarantee", "guarantees", "100%", "approved", "scam", "scams", "fraud", "fake"];

/** Links that are never an official source. */
export const NOT_OFFICIAL_HOSTS = ["facebook.com", "fb.com", "fb.me", "instagram.com", "tiktok.com", "youtube.com", "youtu.be", "wa.me", "whatsapp.com", "t.me", "twitter.com", "x.com", "linkedin.com", "bit.ly"];

/** "Check an offer": each ticked statement adds its weight. */
export const OFFER_RULES: { id: string; text: string; weight: number }[] = [
  { id: "pay-first", text: "Asks for money before any admission or job offer", weight: 3 },
  { id: "personal-account", text: "Payment goes to a personal account", weight: 3 },
  { id: "no-interview-sure", text: "No interview and a sure result", weight: 3 },
  { id: "pressure", text: "Pressure to pay today", weight: 2 },
  { id: "whatsapp-only", text: "Only WhatsApp contact, no office or phone you can check", weight: 2 },
  { id: "no-licence", text: "No official website or licence number", weight: 2 },
  { id: "no-written", text: "Will not give a written agreement or receipt", weight: 2 },
  { id: "no-official-link", text: "Cannot show the official government or university page for the offer", weight: 2 },
  { id: "too-good", text: "The offer sounds much better than the official rules", weight: 1 },
];
export const RISK_MEDIUM_AT = 3;
export const RISK_HIGH_AT = 6;
export type Risk = "low" | "medium" | "high";
export const RISK_TEXT: Record<Risk, { label: string; why: string; next: string[] }> = {
  low: { label: "Low risk", why: "Nothing you ticked is a common warning sign. That does not prove the offer is right, so still check it.", next: ["Open the official immigration or university page and compare every point.", "Ask for a written agreement before you pay."] },
  medium: { label: "Medium risk", why: "Some warning signs are present. Slow down and check before you pay anything.", next: ["Compare the offer with the official rules, point by point.", "Ask for the licence number and check it with the official body.", "Ask for a written agreement and a receipt.", "Never pay a personal account."] },
  high: { label: "High risk", why: "Several warning signs are present. Do not pay until the offer is checked against the official rules.", next: ["Do not pay today. A real process allows time to check.", "Find the rules on the official immigration or university website.", "Ask for a written agreement. Never pay a personal account.", "Send us the offer and we will compare it with the official rules."] },
};
