// English-only text for the admin panel and the email to the owner (the brief: admin emails and the admin panel are always English).
import { LABEL, isCountry, type FundsConfig } from "@/config/aiman";
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
  rows: [string, string][]; perPerson: number; need: number; target: string; purposeLabel: string; gaps: string[]; name: string; phone: string | null; city: string | null;
}

export function leadText(a: Answers, funds: FundsConfig, meta: LeadMeta = {}): LeadText {
  const r = assessAll(a, funds), n = membersNum(a), c = childrenNum(a), bal = a.balNum ?? 0, name = a.name ?? "";
  const purposeKey = a.purposeKey ?? "visit", purposeLabel = PURPOSE[purposeKey];
  const chosen = (a.countries ?? []).filter(isCountry);
  const target = chosen.length ? chosen.map((c) => LABEL[c][0]).join(", ") : "open to suggestions";
  const need = r.best[0]?.need ?? 0, perPerson = Math.round((bal / n) * 10) / 10;
  const phone = meta.phone || a.phone || "-", city = meta.city || "-", secs = meta.secs ?? 0;
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
    ["Name", name], ["WhatsApp", phone], ["Email", a.email ?? "-"], ["City", city], ["Age / Education", `${a.age} · ${EDU[a.edu ?? "low"]}`], ["Occupation", income], ["Goal", `${purposeLabel} · ${target}`], ["Family", family],
    ["Balance", `PKR ${bal} lacs (${perPerson}/person)`], ["Required (indicative)", `~PKR ${need} lacs`], ["Statement pattern", a.deposits === "steady" ? "Steady" : "Recent large deposits"],
    ["Travel / refusal", `${TRAVEL[a.travel ?? "none"]} · ${a.refusal === "refused" ? "Refused before" : "Never refused"}`],
  ];
  return { qualified: r.qualified, status: r.qualified ? "qualified" : "not_qualified", subject, p1, p2, program: programs[0] ?? "", programs, rows, perPerson, need, target, purposeLabel, gaps, name, phone: meta.phone ?? a.phone ?? null, city: meta.city ?? null };
}

const h = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/**
 * The email to the owner. Kept deliberately simple: the coloured verdict, who the person is and what they want at a glance,
 * one big WhatsApp button that opens a chat with the client, and the consultant's notes at the end.
 * Table layout and inline colours only, so Gmail (light and dark mode) shows it properly.
 */
export function leadEmailHtml(t: LeadText): string {
  const col = t.qualified ? "#1f9d63" : "#d98a14", bg = t.qualified ? "#e9f8f0" : "#fff4e0";
  const tag = t.qualified ? "✅ QUALIFIED LEAD" : "⚠️ NOT YET QUALIFIED";
  const act = t.qualified ? "Call / WhatsApp within 24 hours" : "Send improvement plan within 48 hours";
  const font = "Arial,Helvetica,sans-serif";
  const digits = (t.phone ?? "").replace(/\D/g, "");
  const first = (t.name.split(" ")[0] || t.name).slice(0, 25);
  const wa = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(`Assalam o Alaikum ${t.name}, this is Visafeast. You just completed Aiman's assessment for ${t.purposeLabel} — ${t.target}. Let's talk about the next steps.`)}` : null;
  const rows = t.rows.map(([k, v]) => `<tr><td style="padding:7px 10px;border-bottom:1px solid #eceff4;color:#667085;width:38%;vertical-align:top;font:13px ${font}">${h(k)}</td><td style="padding:7px 10px;border-bottom:1px solid #eceff4;color:#1d2433;vertical-align:top;font:13px ${font}"><b style="font-weight:600">${h(v)}</b></td></tr>`).join("");
  const button = wa
    ? `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:14px auto 4px"><tr><td style="background:${col};border-radius:10px"><a href="${h(wa)}" style="display:inline-block;padding:14px 30px;font:bold 16px ${font};color:#ffffff;text-decoration:none">💬 WhatsApp ${h(first)} now</a></td></tr></table>
<p style="margin:6px 0 0;text-align:center;font:12.5px ${font};color:#667085">${act} · tap the button to open WhatsApp with a ready message</p>`
    : `<div style="background:${col};color:#ffffff;text-align:center;border-radius:8px;padding:12px;font:bold 14px ${font}">${act}</div><p style="margin:6px 0 0;text-align:center;font:12.5px ${font};color:#667085">No WhatsApp number yet — they saw their result but did not send the form.</p>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden">
<tr><td style="background:${col};color:#ffffff;padding:14px 16px;font:bold 15px ${font};letter-spacing:.04em">${tag} <span style="font-weight:normal;opacity:.9;letter-spacing:0;float:right;font-size:12px">Talk with Aiman</span></td></tr>
<tr><td style="background:${bg};padding:18px 16px;color:#1d2433">
<p style="margin:0 0 2px;font:bold 20px ${font};color:#1d2433">${h(t.name)}</p>
<p style="margin:0 0 12px;font:14px ${font};color:#475467">${h(t.purposeLabel)} · ${h(t.target)}${t.city ? ` · ${h(t.city)}` : ""}${t.qualified ? ` · <b style="color:${col}">${h(t.program)}</b>` : ` · needs: ${h(t.gaps.join(", ") || "file strengthening")}`}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;margin:0 0 6px">${rows}</table>
${button}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px"><tr><td style="border-top:1px solid #e3d9c2;padding-top:12px">
<p style="margin:0 0 4px;font:bold 12px ${font};color:#667085;letter-spacing:.08em">CASE NOTES FOR THE CONSULTANT</p>
<p style="margin:0 0 8px;font:13px/1.6 ${font};color:#475467">${h(t.p1)}</p>
<p style="margin:0;font:13px/1.6 ${font};color:#475467">${h(t.p2)}</p>
</td></tr></table>
</td></tr></table>`;
}
export { needFor };
