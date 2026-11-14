// The eligibility engine of "Talk with Aiman" (ported from the approved prototype). Pure functions: the browser uses them to show the result,
// and the server runs the SAME code on the saved answers to decide the lead's status, so the browser's word is never trusted.
import { OPTIONS, programName, STRICT, DEFAULT_FUNDS, isCountry, type CountryId, type FundsConfig, type Purpose } from "@/config/aiman";
import { cleanPhone } from "./phone";
import type { CopyId } from "./copy";

export interface Answers {
  name?: string; age?: string; edu?: "low" | "bach" | "mast"; job?: "salaried" | "business" | "freelancer" | "student" | "none";
  salmode?: "bank" | "cash"; bizreg?: "reg" | "unreg"; frmode?: "bank" | "cash"; travel?: "none" | "regional" | "west"; refusal?: "never" | "refused";
  purpose?: "visit" | "study" | "work" | "pr"; purposeKey?: Purpose; family?: "alone" | "family";
  members?: string; membersExact?: number; children?: string; childrenExact?: number; youngest?: "u2" | "kid" | "teen";
  english?: "ok" | "low" | "none"; exp?: "lt2" | "2to5" | "5plus"; offer?: "yes" | "no"; balNum?: number;
  deposits?: "steady" | "big"; countries?: string[]; sponsor?: "yes" | "no"; phone?: string; email?: string; ready?: "yes" | "no"; wantsChecklist?: boolean;
}
export const PURPOSE_KEY: Record<string, Purpose> = { visit: "visit", study: "study", work: "work", pr: "immigration" };

/** A reason shown to the client: ids into the copy file for the problem (`r`) and the fix (`f`), plus the numbers to fill in. */
export interface Reason { r: CopyId; f: CopyId; v?: Record<string, string | number> }
export interface Evaluation { c: CountryId; p: Purpose; program: string; hard: Reason[]; soft: Reason[]; need: number; ok: boolean }
export interface Assessment { all: Evaluation[]; focus: Evaluation[]; qual: Evaluation[]; others: Evaluation[]; best: Evaluation[]; qualified: boolean }

export const membersNum = (a: Answers) => (a.family === "alone" ? 1 : a.members === "9+" ? a.membersExact || 9 : Number(a.members || 2));
export const childrenNum = (a: Answers) => (a.family === "alone" ? 0 : a.children === "6+" ? a.childrenExact || 6 : Number(a.children || 0));

/** Funds expected (lacs of PKR) for this country and purpose, for this family. */
export function needFor(c: CountryId, p: Purpose, a: Answers, f: FundsConfig = DEFAULT_FUNDS): number {
  const n = membersNum(a);
  if (p === "visit") return (f.visit[c] ?? 15) * n;
  if (p === "study") return (f.study[c] ?? 30) + (n - 1) * f.studyPerDependant;
  if (p === "work") return f.workPerPerson * n;
  return f.prPerPerson * n;
}

/** True when the balance is below what every candidate country expects, so Aiman asks about a sponsor. */
export function needSponsorQ(a: Answers, f: FundsConfig = DEFAULT_FUNDS): boolean {
  if (!a.purposeKey || a.balNum === undefined || !a.countries) return false;
  const ids = a.countries.length ? (a.countries as CountryId[]) : OPTIONS[a.purposeKey];
  return ids.every((c) => (a.balNum || 0) < needFor(c, a.purposeKey!, a, f));
}

export function evaluate(c: CountryId, p: Purpose, a: Answers, f: FundsConfig = DEFAULT_FUNDS): Evaluation {
  const hard: Reason[] = [], soft: Reason[] = [], n = membersNum(a), bal = a.balNum || 0, need = needFor(c, p, a, f);
  if (bal < need) {
    if (a.sponsor === "yes") soft.push({ r: "r_funds_sp", f: "f_funds_sp", v: { bal, need } });
    else hard.push({ r: "r_funds", f: "f_funds", v: { bal, need, n, people: n > 1 ? "people" : "person" } });
  }
  if (a.deposits === "big") {
    if (STRICT.includes(c)) hard.push({ r: "r_dep_hard", f: "f_dep_hard" });
    else soft.push({ r: "r_dep_soft", f: "f_dep_soft" });
  }
  if (a.refusal === "refused") soft.push({ r: "r_refusal", f: "f_refusal" });
  if (p === "visit" && STRICT.includes(c) && a.travel === "none") soft.push({ r: "r_notravel", f: "f_notravel" });
  if (a.salmode === "cash") soft.push({ r: "r_cashsal", f: "f_cashsal" });
  if (a.bizreg === "unreg") soft.push({ r: "r_unreg", f: "f_unreg" });
  if (a.frmode === "cash") soft.push({ r: "r_frcash", f: "f_frcash" });
  if (p === "study") {
    if (a.edu === "low") soft.push({ r: "r_study_low", f: "f_study_low" });
    if (a.age === "36–44" || a.age === "45+") soft.push({ r: "r_study_age", f: "f_study_age" });
    if (a.english !== "ok") soft.push({ r: "r_study_eng", f: "f_study_eng" });
  }
  if (p === "work") {
    if (a.offer !== "yes" && c !== "germany") hard.push({ r: "r_work_offer", f: "f_work_offer" });
    if (a.edu === "low" && ["uk", "germany", "australia"].includes(c)) hard.push({ r: "r_work_edu", f: "f_work_edu" });
    if (a.exp === "lt2") soft.push({ r: "r_work_exp", f: "f_work_exp" });
  }
  if (p === "immigration") {
    if (a.age === "45+") hard.push({ r: "r_pr_age", f: "f_pr_age" });
    if (a.edu === "low") hard.push({ r: "r_pr_edu", f: "f_pr_edu" });
    if (a.english !== "ok") hard.push({ r: "r_pr_eng", f: "f_pr_eng" });
    if (a.exp === "lt2") soft.push({ r: "r_pr_exp", f: "f_pr_exp" });
  }
  return { c, p, program: programName(p, c), hard, soft, need, ok: hard.length === 0 };
}

export function assessAll(a: Answers, f: FundsConfig = DEFAULT_FUNDS): Assessment {
  const p = a.purposeKey ?? "visit", ids = OPTIONS[p], chosen = (a.countries ?? []).filter(isCountry);
  const all = ids.map((id) => evaluate(id, p, a, f));
  const focus = chosen.length ? all.filter((x) => chosen.includes(x.c)) : all;
  const qual = focus.filter((x) => x.ok);
  const others = chosen.length ? all.filter((x) => x.ok && !chosen.includes(x.c)) : [];
  const best = qual.length ? qual : [...focus].sort((x, y) => x.hard.length - y.hard.length).slice(0, 1);
  return { all, focus, qual, others, best, qualified: qual.length > 0 };
}

/** What the server accepts as a valid set of answers: every field is checked, so a made-up value can never reach the database. */
export function cleanAnswers(raw: unknown): Answers | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const pick = <T extends string>(v: unknown, list: readonly T[]): T | undefined => (typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : undefined);
  const int = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi ? v : undefined);
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (name.length < 2 || name.length > 40) return null;
  const purpose = pick(r.purpose, ["visit", "study", "work", "pr"] as const);
  const bal = typeof r.balNum === "number" && Number.isFinite(r.balNum) && r.balNum >= 0 && r.balNum <= 100000 ? r.balNum : undefined;
  if (!purpose || bal === undefined) return null;
  const purposeKey = PURPOSE_KEY[purpose];
  // one or many countries (an empty list = "not sure"); an old single `country` value is still understood
  const rawList = Array.isArray(r.countries) ? r.countries : r.country && r.country !== "any" ? [r.country] : [];
  if (!rawList.every((c) => typeof c === "string" && isCountry(c)) || rawList.length > 25) return null;
  const countries = [...new Set(rawList as string[])];
  const phone = typeof r.phone === "string" && r.phone ? cleanPhone(r.phone) ?? undefined : undefined;
  const email = typeof r.email === "string" && /^[^\s@]{1,64}@[^\s@]{1,200}\.[^\s@]{2,}$/.test(r.email.trim()) ? r.email.trim().toLowerCase().slice(0, 200) : undefined;
  const a: Answers = {
    name, age: pick(r.age, ["18–25", "26–35", "36–44", "45+"] as const), edu: pick(r.edu, ["low", "bach", "mast"] as const), job: pick(r.job, ["salaried", "business", "freelancer", "student", "none"] as const),
    salmode: pick(r.salmode, ["bank", "cash"] as const), bizreg: pick(r.bizreg, ["reg", "unreg"] as const), frmode: pick(r.frmode, ["bank", "cash"] as const),
    travel: pick(r.travel, ["none", "regional", "west"] as const), refusal: pick(r.refusal, ["never", "refused"] as const), purpose, purposeKey,
    family: pick(r.family, ["alone", "family"] as const), members: pick(r.members, ["2", "3", "4", "5", "6", "7", "8", "9+"] as const), membersExact: int(r.membersExact, 9, 40),
    children: pick(r.children, ["0", "1", "2", "3", "4", "5", "6+"] as const), childrenExact: int(r.childrenExact, 6, 40), youngest: pick(r.youngest, ["u2", "kid", "teen"] as const),
    english: pick(r.english, ["ok", "low", "none"] as const), exp: pick(r.exp, ["lt2", "2to5", "5plus"] as const), offer: pick(r.offer, ["yes", "no"] as const),
    balNum: bal, deposits: pick(r.deposits, ["steady", "big"] as const), countries, phone, email, ready: pick(r.ready, ["yes", "no"] as const), wantsChecklist: typeof r.wantsChecklist === "boolean" ? r.wantsChecklist : undefined, sponsor: pick(r.sponsor, ["yes", "no"] as const),
  };
  if (!a.age || !a.edu || !a.job || !a.travel || !a.refusal || !a.family || !a.deposits) return null;
  if (a.family === "family" && (!a.members || (a.members === "9+" && !a.membersExact))) return null;
  if (a.family === "family" && childrenNum(a) >= membersNum(a)) return null;
  return a;
}
