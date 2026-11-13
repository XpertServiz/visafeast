// English-only text for the admin panel and the email to the owner (the brief: admin emails and the admin panel are always English).
import { LABEL, type FundsConfig } from "@/config/aiman";
import { COPY } from "./copy";
import { assessAll, childrenNum, membersNum, needFor, type Answers, type Reason } from "./assess";

export const fmt = (s: string, v?: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => (v && k in v ? String(v[k]) : m));
export const reasonEn = (x: Reason, fixed = false) => fmt(COPY[fixed ? x.f : x.r][0], x.v);

const PURPOSE = { visit: "Visit / Tourism", study: "Study", work: "Work abroad", immigration: "Immigration (PR)" } as const;
const EDU = { low: "Matric / Inter", bach: "Bachelor's", mast: "Master's or above" } as const;
const TRAVEL = { none: "No travel history", regional: "Regional trips (Dubai/Malaysia/Thailand)", west: "Western travel history" } as const;

export interface LeadMeta { secs?: number; phone?: string; city?: string }
export interface LeadText {
  qualified: boolean; status: "qualified" | "not_qualified"; subject: string; p1: string; p2: string; program: string; programs: string[];
  rows: [string, string][]; perPerson: number; need: number; target: string; purposeLabel: string; gaps: string[];
}

export function leadText(a: Answers, funds: FundsConfig, meta: LeadMeta = {}): LeadText {
  const r = assessAll(a, funds), n = membersNum(a), c = childrenNum(a), bal = a.balNum ?? 0, name = a.name ?? "";
  const purposeKey = a.purposeKey ?? "visit", purposeLabel = PURPOSE[purposeKey];
  const target = a.country === "any" || !a.country ? "open to suggestions" : LABEL[a.country as keyof typeof LABEL]?.[0] ?? a.country;
  const need = r.best[0]?.need ?? 0, perPerson = Math.round((bal / n) * 10) / 10;
  const phone = meta.phone || "-", city = meta.city || "-", secs = meta.secs ?? 0;
  const gaps = [...new Set(r.best.flatMap((x) => x.hard.map((h) => reasonEn(h).split(":")[0].split(" ").slice(0, 3).join(" "))))];
  const programs = (r.qualified ? r.qual : r.best).map((x) => x.program);
  const income = a.job === "salaried" ? `Salaried, salary ${a.salmode === "bank" ? "paid into bank" : "paid in cash"}`
    : a.job === "business" ? `Business owner, ${a.bizreg === "reg" ? "registered" : "not registered"}`
      : a.job === "freelancer" ? `Freelancer, income ${a.frmode === "bank" ? "via bank" : "cash/wallet"}`
        : { student: "Student", none: "Not working" }[a.job ?? "none"] ?? "-";
  const family = n === 1 ? "applying alone" : `applying with family: ${n} people (${n - c} adult${n - c > 1 ? "s" : ""}, ${c} child${c === 1 ? "" : "ren"}${a.youngest ? "; youngest " + { u2: "under 2", kid: "2–11", teen: "12–17" }[a.youngest] : ""})`;
  const subject = r.qualified
    ? `✅ QUALIFIED LEAD — ${name} | ${purposeLabel} · ${target} | ${n} ${n > 1 ? "people" : "person"} | PKR ${bal} lacs`
    : `⚠️ NOT YET QUALIFIED — ${name} | ${purposeLabel} · ${target} | Needs: ${gaps.join(", ") || "file strengthening"}`;
  const p1 = `${name} (${a.age} yrs, ${EDU[a.edu ?? "low"]}, ${income}) completed the Aiman assessment in ${secs} seconds. Interested in ${purposeLabel} — ${target}; ${family}. ${TRAVEL[a.travel ?? "none"]}; ${a.refusal === "refused" ? "previous refusal on record" : "no previous refusal"}. City: ${city}. WhatsApp: ${phone}.`;
  const money = `Closing balance PKR ${bal} lacs (${perPerson} lacs per person) against an indicative requirement of ~${need} lacs; statement pattern: ${a.deposits === "steady" ? "steady" : "recent large deposits"}${a.sponsor ? "; sponsor available: " + a.sponsor : ""}.`;
  const p2 = r.qualified
    ? `Qualifies for: ${programs.join("; ")}. ${money} Strengthen: ${[...new Set(r.qual.flatMap((x) => x.soft.map((s) => reasonEn(s, true))))].slice(0, 3).join(" ") || "file is in good shape"} Recommended action: call within 24 hours.`
    : `Not eligible yet for ${programs.join("; ")}. Gaps: ${r.best.flatMap((x) => x.hard.map((h) => reasonEn(h))).join(" ")} ${money} Suggested plan: ${r.best.flatMap((x) => x.hard.map((h) => reasonEn(h, true))).join(" ")} Handle with a warm, plan-first call — client has been told the case is fixable.${r.others.length ? " Note: profile does qualify for " + r.others.map((x) => x.program).join("; ") + "." : ""}`;
  const rows: [string, string][] = [
    ["Name", name], ["WhatsApp", phone], ["City", city], ["Age / Education", `${a.age} · ${EDU[a.edu ?? "low"]}`], ["Occupation", income], ["Goal", `${purposeLabel} · ${target}`], ["Family", family],
    ["Balance", `PKR ${bal} lacs (${perPerson}/person)`], ["Required (indicative)", `~PKR ${need} lacs`], ["Statement pattern", a.deposits === "steady" ? "Steady" : "Recent large deposits"],
    ["Travel / refusal", `${TRAVEL[a.travel ?? "none"]} · ${a.refusal === "refused" ? "Refused before" : "Never refused"}`],
  ];
  return { qualified: r.qualified, status: r.qualified ? "qualified" : "not_qualified", subject, p1, p2, program: programs[0] ?? "", programs, rows, perPerson, need, target, purposeLabel, gaps };
}

const h = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** The email: coloured header, two short paragraphs, a facts table and a call-to-action bar. Table layout and inline colours so Gmail (also dark mode) shows it properly. */
export function leadEmailHtml(t: LeadText): string {
  const col = t.qualified ? "#1f9d63" : "#d98a14", bg = t.qualified ? "#e9f8f0" : "#fff4e0", tag = t.qualified ? "QUALIFIED LEAD" : "NOT YET QUALIFIED";
  const rows = t.rows.map(([k, v]) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eceff4;color:#667085;width:38%;vertical-align:top;font:13px Arial,sans-serif">${h(k)}</td><td style="padding:6px 10px;border-bottom:1px solid #eceff4;color:#1d2433;vertical-align:top;font:13px Arial,sans-serif">${h(v)}</td></tr>`).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden"><tr><td style="background:${col};color:#ffffff;padding:14px 16px;font:bold 14px Arial,sans-serif;letter-spacing:.06em">${tag} <span style="font-weight:normal;opacity:.9;letter-spacing:0;float:right">Visafeast · Talk with Aiman</span></td></tr>
<tr><td style="background:${bg};padding:16px;color:#1d2433;font:14px/1.6 Arial,sans-serif"><p style="margin:0 0 10px;color:#1d2433">${h(t.p1)}</p><p style="margin:0 0 12px;color:#1d2433">${h(t.p2)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;margin:6px 0 14px">${rows}</table>
<div style="background:${col};color:#ffffff;text-align:center;border-radius:8px;padding:12px;font:bold 14px Arial,sans-serif">${t.qualified ? "Call / WhatsApp within 24 hours" : "Send improvement plan within 48 hours"}</div></td></tr></table>`;
}
export { needFor };
