// Aiman, the website assistant. This file answers from the site's own content with NO paid API: it fixes typos, understands
// Roman Urdu and Urdu keywords, and finds the right facts. Only questions it cannot answer may go to GPT (see app/api/chat).
import type { Country, Faq } from "./types";
import { getGuide } from "./guides";

export type Loc = "en" | "ur";
export type Topic = "fee" | "documents" | "time" | "funds" | "stay" | "biometrics" | "apply" | "refusal" | "steps";
export interface KbDoc { title: string; body: string; link: string; countrySlug?: string }
export interface BotAnswer { kind: "smalltalk" | "facts" | "kb" | "clarify" | "none"; answer: string; link?: string; country?: string; suggest?: string[]; context?: KbDoc[] }

const BASE = { visit: "visit-visa", study: "study-visa", immigration: "immigration", work: "work-permit" } as const;
export const countryPath = (c: Pick<Country, "kind" | "slug">) => `/${BASE[c.kind]}/${c.slug}`;

export const normalize = (s: string) => s.toLowerCase().replace(/[’']/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
export const words = (s: string) => normalize(s).split(" ").filter(Boolean);

/** Damerau-Levenshtein distance, stopping early once it passes `max`. */
export function distance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let best = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      best = Math.min(best, d[i][j]);
    }
    if (best > max) return max + 1;
  }
  return d[a.length][b.length];
}
/** How wrong a word may be: short words must match closely, or "fee" would match "free". */
const allowance = (len: number) => (len <= 3 ? 0 : len <= 5 ? 1 : 2);
export const near = (typed: string, target: string) => {
  if (typed === target) return true;
  const allow = allowance(Math.min(typed.length, target.length));
  if (!allow) return false;
  return distance(typed, target, allow) <= allow;
};

const COUNTRY_WORDS: Record<string, string[]> = {
  GB: ["uk", "britain", "british", "england", "london", "scotland", "angland", "bartania", "برطانیہ", "انگلینڈ", "لندن", "یوکے"],
  CA: ["canada", "canadian", "toronto", "kaneda", "کینیڈا"],
  US: ["usa", "us", "america", "american", "امریکہ"],
  AU: ["australia", "australian", "sydney", "melbourne", "آسٹریلیا"],
  NZ: ["nz", "zealand", "auckland", "نیوزی"],
  EU: ["schengen", "europe", "european", "spain", "shengen", "یورپ", "شینگن"],
  AZ: ["azerbaijan", "baku", "آذربائیجان", "باکو"],
  TH: ["thailand", "bangkok", "thai", "تھائی", "تھائی لینڈ"],
  SG: ["singapore", "singapur", "سنگاپور"],
  DE: ["germany", "german", "berlin", "jarmany", "جرمنی"],
  IT: ["italy", "italian", "rome", "اٹلی"],
  GR: ["greece", "greek", "athens", "یونان"],
  MY: ["malaysia", "malaysian", "kuala", "lumpur", "malaysya", "ملائیشیا", "ملائشیا"],
  LK: ["lanka", "srilanka", "colombo", "سری", "لنکا"],
  NL: ["netherlands", "netherland", "dutch", "holland", "amsterdam", "نیدرلینڈ", "ہالینڈ"],
  FR: ["france", "french", "paris", "فرانس"],
  PT: ["portugal", "portuguese", "lisbon", "پرتگال"],
  AE: ["uae", "dubai", "emirates", "abudhabi", "sharjah", "دبئی", "امارات"],
  IE: ["ireland", "irish", "dublin", "آئرلینڈ"],
  SA: ["saudi", "ksa", "riyadh", "jeddah", "سعودی", "سعودیہ", "ریاض"],
  KR: ["korea", "korean", "seoul", "کوریا"],
  JP: ["japan", "japanese", "tokyo", "jappan", "جاپان"],
};
const TOPIC_WORDS: Record<Topic, string[]> = {
  fee: ["fee", "fees", "cost", "costs", "price", "charges", "charge", "kitni", "kitna", "kitne", "paisa", "paise", "rupees", "kharcha", "qeemat", "kharch", "فیس", "قیمت", "خرچہ", "کتنی", "کتنا"],
  documents: ["document", "documents", "docs", "papers", "paperwork", "checklist", "dastavez", "dastawez", "kagzat", "kaghzat", "requirements", "required", "دستاویزات", "دستاویز", "کاغذات"],
  time: ["time", "long", "days", "weeks", "processing", "din", "waqt", "fast", "quick", "decision", "وقت", "دن", "فیصلہ"],
  funds: ["bank", "balance", "statement", "funds", "money", "savings", "blocked", "maintenance", "بینک", "بیلنس", "رقم"],
  stay: ["stay", "qayam", "rehna", "months", "validity", "قیام"],
  biometrics: ["biometric", "biometrics", "fingerprint", "fingerprints", "بایومیٹرکس"],
  apply: ["when", "early", "earliest", "kab", "deadline", "window", "کب"],
  refusal: ["refusal", "refused", "refuse", "reject", "rejected", "rejection", "inkar", "mustarad", "denied", "انکار", "مسترد"],
  steps: ["apply", "process", "steps", "procedure", "kaise", "kese", "start", "طریقہ", "کیسے"],
};
const STUDY = ["study", "student", "students", "university", "college", "parhai", "padhai", "taleem", "education", "تعلیم", "اسٹوڈنٹ", "پڑھائی"];
const IMMIGRATION = ["immigration", "immigrate", "settle", "permanent", "pr", "skilled", "express", "امیگریشن"];
// Work permits, jobs abroad and job-seeker visas (Roman Urdu and Urdu words included).
const WORK = ["work", "working", "job", "jobs", "permit", "permits", "employment", "employer", "worker", "workers", "naukri", "nokri", "naukari", "kaam", "salary", "sponsor", "sponsorship", "lmia", "chancenkarte", "opportunity", "seeker", "h1b", "talent", "blue", "eps", "ssw", "aewv", "نوکری", "ملازمت", "ورک", "پرمٹ", "کام", "جاب"];
const STOP = new Set("the a an is are am was be do does did i you we to for of in on at and or my me can how what which who why it this that with from have has will would should please tell about give need want get karein karen kare karna karo krna karni kya hai hain ka ki ke ko se ye yeh mujhe mera meri hum aap ap main mein bhi aur nahi nahin par per liye visa visas کیا ہے ہیں کا کی کے کو سے میں مجھے ویزا".split(" "));

const GREET = ["hi", "hello", "hey", "salam", "salaam", "assalam", "aoa", "assalamualaikum", "سلام", "السلام"];
const THANKS = ["thanks", "thank", "shukriya", "shukria", "jazakallah", "شکریہ"];
const HUMAN = ["human", "person", "agent", "consultant", "representative", "whatsapp", "call", "phone", "contact", "number", "email", "address", "office", "رابطہ", "کنسلٹنٹ", "واٹس"];
const CHANCE = ["chance", "chances", "guarantee", "guaranteed", "eligible", "eligibility", "qualify", "approve", "approved", "milega", "lagega", "گارنٹی", "اہل"];
const TRACK = ["track", "status", "login", "signin", "portal", "upload", "ٹریک", "لاگ"];
const DECODE = ["letter", "decoder", "decode"];

const T = (loc: Loc, en: string, ur: string) => (loc === "ur" ? ur : en);
const hasNear = (toks: string[], list: string[]) => toks.some((w) => list.some((l) => near(w, l)));

export function detectCountryCode(toks: string[]): string | null {
  for (const w of toks) if (w.length >= 2) for (const [code, list] of Object.entries(COUNTRY_WORDS)) if (list.some((l) => near(w, l))) return code;
  return null;
}
export function detectTopic(toks: string[]): Topic | null {
  const content = toks.filter((w) => !STOP.has(w));
  // a word typed exactly right beats a word that only looks similar ("kaise" = how, one letter from "paise" = money)
  for (const t of Object.keys(TOPIC_WORDS) as Topic[]) if (content.some((w) => TOPIC_WORDS[t].includes(w))) return t;
  for (const t of Object.keys(TOPIC_WORDS) as Topic[]) if (hasNear(content, TOPIC_WORDS[t])) return t;
  return null;
}
const detectKind = (toks: string[]): Country["kind"] | null =>
  hasNear(toks.filter((w) => !WORK.includes(w)), STUDY) ? "study"
    // "how does it work" is not about work permits: "work" right after it/does/this/process does not count
    : toks.some((w, i) => (WORK.includes(w) && !(w === "work" && ["it", "does", "this", "process", "will"].includes(toks[i - 1] ?? ""))) || (w.length > 5 && (near(w, "permit") || near(w, "employment")))) ? "work"
      : toks.some((w) => IMMIGRATION.includes(w) || near(w, "immigration")) ? "immigration" : null;

/** Facts older than 90 days are treated as unknown, exactly like the country pages. */
const fresh = (c: Country, now: Date) => Boolean(c.facts_last_checked) && (now.getTime() - new Date(c.facts_last_checked!).getTime()) / 86400000 <= 90;

/** Immigration and Work permit pages list routes instead of one fee: answer with each route and its first key figure. */
function routesAnswer(c: Country, loc: Loc): string {
  const g = getGuide(c.slug);
  const routes = (g?.options ?? []).slice(0, 6).map((o) => `• ${o.name}${o.status ? ` (${o.status})` : ""}${o.facts?.[0] ? ` — ${o.facts[0][0]}: ${o.facts[0][1]}` : ""}`);
  const head = c.kind === "work" ? T(loc, "Main work routes", "کام کے اہم راستے") : T(loc, "Main programmes", "اہم پروگرام");
  const checked = g ? T(loc, `Checked on ${g.checked} from the official pages.`, `${g.checked} کو سرکاری صفحات سے چیک کیا گیا۔`) : null;
  return [c.h1, c.intro, routes.length ? `${head}:\n${routes.join("\n")}` : null, checked].filter(Boolean).join("\n");
}

function factsAnswer(c: Country, topic: Topic | null, loc: Loc, now: Date): string {
  if ((c.kind === "work" || c.kind === "immigration") && topic !== "steps") return routesAnswer(c, loc);
  const live = fresh(c, now);
  const verify = T(loc, "Being verified — WhatsApp us for today's figure.", "تصدیق جاری ہے — آج کی معلومات کے لیے واٹس ایپ کریں۔");
  const val = (v: string | null) => (live && v ? v : null);
  const stamp = live ? T(loc, `\n\nLast checked ${c.facts_last_checked} from the official source.`, `\n\nآخری بار ${c.facts_last_checked} کو سرکاری ذریعے سے چیک کیا گیا۔`) : "";
  const list = (items: { title: string }[]) => items.slice(0, 8).map((d) => `• ${d.title}`).join("\n");
  const head = c.h1;
  switch (topic) {
    case "fee": {
      const fee = val(c.embassy_fee_text);
      if (!fee) return `${head}\n${verify}`;
      const extra = val(c.vfs_fee_text);
      return `${head}\n${T(loc, "Official fee", "سرکاری فیس")}: ${fee}${extra ? `\n${extra}` : ""}${stamp}`;
    }
    case "time": { const v = val(c.processing_time_text); return `${head}\n${T(loc, "Decision time", "فیصلے کا وقت")}: ${v ?? verify}${v ? stamp : ""}`; }
    case "stay": { const v = val(c.max_stay_text); return `${head}\n${T(loc, "Stay", "قیام")}: ${v ?? verify}${v ? stamp : ""}`; }
    case "apply": { const v = val(c.apply_window_text); return `${head}\n${T(loc, "When to apply", "کب درخواست دیں")}: ${v ?? verify}${v ? stamp : ""}`; }
    case "biometrics": { const v = val(c.biometrics_text); return `${head}\n${T(loc, "Biometrics", "بایومیٹرکس")}: ${v ?? verify}${v ? stamp : ""}`; }
    case "funds": return `${head}\n${c.funds_md ?? verify}`;
    case "documents": return c.documents.length ? `${T(loc, "Main documents", "اہم دستاویزات")} — ${head}:\n${list(c.documents)}` : `${head}\n${verify}`;
    case "refusal": return c.refusal_reasons.length ? `${T(loc, "Common refusal reasons", "انکار کی عام وجوہات")} — ${head}:\n${list(c.refusal_reasons)}` : `${head}\n${verify}`;
    case "steps": return c.steps.length ? `${T(loc, "How it works", "طریقہ کار")} — ${head}:\n${c.steps.slice(0, 6).map((s, i) => `${i + 1}. ${s.title}`).join("\n")}` : `${head}\n${verify}`;
    default: {
      const fee = val(c.embassy_fee_text), time = val(c.processing_time_text);
      return [head, c.intro, fee && `${T(loc, "Official fee", "سرکاری فیس")}: ${fee}`, time && `${T(loc, "Decision time", "فیصلے کا وقت")}: ${time}`].filter(Boolean).join("\n");
    }
  }
}

const suggestFor = (c: Country, loc: Loc) => [T(loc, `${c.country_name} fee?`, `${c.country_name} فیس؟`), T(loc, "Which documents?", "کون سی دستاویزات؟"), T(loc, "How long does it take?", "کتنا وقت لگتا ہے؟")];

export function buildKb(faqs: Faq[], countries: Country[], loc: Loc): KbDoc[] {
  const p = loc === "ur" ? "/ur" : "";
  return [
    ...faqs.map((f) => ({ title: f.question, body: f.answer_md, link: `${p}${f.country_slug ? `/visit-visa/${f.country_slug}` : "/#faq"}`, countrySlug: f.country_slug ?? undefined })),
    ...countries.map((c) => {
      // Immigration and Work permit pages: their content is the guide (routes, key figures, notes), not the shared steps.
      const g = c.kind === "work" || c.kind === "immigration" ? getGuide(c.slug) : undefined;
      const guideText = g ? [g.overview, ...(g.options ?? []).map((o) => `${o.name}. ${o.status ?? ""} ${o.summary} ${(o.facts ?? []).map(([k, v]) => `${k}: ${v}`).join(". ")}`), g.funds, ...(g.extra ?? []).map((e) => `${e.heading} ${e.md}`)] : [];
      return { title: c.h1, countrySlug: c.slug, link: `${p}${countryPath(c)}`, body: [c.intro, c.funds_md, ...c.who_for_md, ...c.documents.map((d) => `${d.title} ${d.detail ?? ""}`), ...(g ? [] : c.steps.map((s) => `${s.title} ${s.detail ?? ""}`)), ...c.refusal_reasons.map((r) => `${r.title} ${r.detail ?? ""}`), ...c.extra_sections.map((e) => `${e.heading} ${e.md}`), ...guideText].filter(Boolean).join(" ") };
    }),
    { title: "Visafeast services", link: `${p}/about`, body: "Visafeast is a private visit, study and immigration visa consultancy based in Karachi, serving all of Pakistan online. We prepare your file. Decisions are made only by the embassy. We never guarantee a visa." },
    { title: "Work permits and work visas abroad", link: `${p}/work-permit`, body: "Work visa, work permit, job seeker visa and jobs abroad from Pakistan: UK Skilled Worker and Health and Care Worker, Canada work permit and LMIA, Germany Opportunity Card (Chancenkarte) and EU Blue Card, New Zealand Accredited Employer Work Visa, Ireland Critical Skills and General Employment Permit, Netherlands highly skilled migrant, Portugal, UAE employment and Green visa, Japan Specified Skilled Worker, USA H-1B, Australia 482 and 186, France Talent card, South Korea EPS E-9, Saudi Arabia employer steps. Most work visas need a real job offer from a real employer. Never pay anyone for a job offer." },
    { title: "Free eligibility check", link: `${p}/tools/eligibility`, body: "A free quick check of your visa profile: answer a few questions and see your strengths and what to improve." },
    { title: "Refusal letter decoder", link: `${p}/tools/refusal-decoder`, body: "Paste your visa refusal letter and get it explained in plain language with what to fix before you apply again. Free." },
    { title: "Fee estimator", link: `${p}/tools/fee-estimator`, body: "Estimate the total cost of your visa application: official fees and service fee." },
    { title: "Document checklists", link: `${p}/tools/checklists`, body: "Free document checklists for each country, as a PDF." },
    { title: "Book a free call", link: `${p}/book`, body: "Book a free 15-minute call with a consultant, or send an enquiry." },
    { title: "Client login", link: `${p}/portal`, body: "Clients can sign in to upload documents, see their file status and chat with their consultant." },
    { title: "Track your file", link: `${p}/track`, body: "Track your visa file with your reference number and the last 4 digits of your phone." },
  ];
}

/** Best-matching content with typo tolerance. Returns the share of the question's meaningful words that were found. */
export function searchKb(question: string, kb: KbDoc[]): { doc: KbDoc; score: number; coverage: number }[] {
  const q = [...new Set(words(question).filter((w) => !STOP.has(w) && w.length > 1))];
  if (!q.length) return [];
  const docs = kb.map((d) => ({ d, title: new Set(words(d.title)), toks: words(`${d.title} ${d.body}`) }));
  const vocab = new Set(docs.flatMap((x) => x.toks));
  // fix each typed word to the closest real word on the site
  const fixed = q.map((w) => { if (vocab.has(w) || w.length < 4) return w; let best = w, bd = 9; for (const v of vocab) { if (Math.abs(v.length - w.length) > 2 || v[0] !== w[0]) continue; const al = allowance(Math.min(v.length, w.length)); const dd = distance(w, v, al); if (dd <= al && dd < bd) { bd = dd; best = v; } } return best; });
  const n = docs.length, avg = docs.reduce((a, x) => a + x.toks.length, 0) / Math.max(1, n);
  const df = new Map(fixed.map((w) => [w, docs.filter((x) => x.toks.includes(w)).length]));
  return docs.map((x) => {
    let score = 0, found = 0;
    for (const w of fixed) {
      const tf = x.toks.filter((t) => t === w).length;
      if (!tf) continue;
      found++;
      const idf = Math.log(1 + (n - (df.get(w) ?? 0) + 0.5) / ((df.get(w) ?? 0) + 0.5));
      score += idf * ((tf * 2.2) / (tf + 1.2 * (0.25 + (0.75 * x.toks.length) / avg))) + (x.title.has(w) ? idf : 0);
    }
    return { doc: x.d, score, coverage: found / fixed.length };
  }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
}

/** The free answer path. `kind: "none"` means the site cannot answer confidently: only then may GPT be asked. */
export function answerFromSite(question: string, opts: { kb: KbDoc[]; countries: Country[]; locale: Loc; lastCountry?: string; whatsappLink?: string; now?: Date }): BotAnswer {
  const { kb, countries, locale: loc, lastCountry, now = new Date() } = opts;
  const p = loc === "ur" ? "/ur" : "";
  const toks = words(question);
  const content = toks.filter((w) => !STOP.has(w));
  const code = detectCountryCode(toks);
  const topic = detectTopic(toks);
  const kindWord = detectKind(toks);
  const countryTokens = new Set(Object.values(COUNTRY_WORDS).flat());
  const has = (list: string[]) => hasNear(content.filter((w) => !countryTokens.has(w)), list);

  if (!code && !topic && toks.length <= 4 && has(THANKS)) return { kind: "smalltalk", answer: T(loc, "You're welcome! Anything else about your visa?", "کوئی بات نہیں! ویزا کے بارے میں اور کچھ؟") };
  if (!code && !topic && toks.length <= 4 && toks.some((w) => GREET.some((g) => near(w, g)))) return { kind: "smalltalk", answer: T(loc, "Assalam-o-Alaikum! I'm Aiman. Ask me about fees, documents or timelines for any country.", "السلام علیکم! میں ایمن ہوں۔ کسی بھی ملک کی فیس، دستاویزات یا وقت کے بارے میں پوچھیں۔"), suggest: [T(loc, "UK visit visa fee", "یوکے ویزا فیس"), T(loc, "Canada documents", "کینیڈا دستاویزات"), T(loc, "Schengen time", "شینگن وقت")] };
  if (has(CHANCE)) return { kind: "kb", answer: T(loc, "Nobody can honestly guarantee a visa: only the embassy decides. Our free check shows your strengths and what to improve.", "کوئی بھی ویزا کی گارنٹی نہیں دے سکتا: فیصلہ صرف ایمبیسی کرتی ہے۔ ہمارا مفت چیک آپ کی مضبوطیاں اور بہتری کے نکات بتاتا ہے۔"), link: `${p}/tools/eligibility` };
  if (has(TRACK)) return { kind: "kb", answer: T(loc, "Clients can sign in to upload documents, see their file status and chat with their consultant.", "کلائنٹس سائن ان کر کے دستاویزات بھیج سکتے ہیں، فائل کی صورتحال دیکھ سکتے ہیں اور کنسلٹنٹ سے چیٹ کر سکتے ہیں۔"), link: `${p}/portal` };
  if (has(DECODE) && topic === "refusal") return { kind: "kb", answer: T(loc, "Paste your refusal letter in our free decoder: it explains each reason in plain language.", "اپنا انکار کا خط ہمارے مفت ڈیکوڈر میں ڈالیں: یہ ہر وجہ آسان زبان میں بتاتا ہے۔"), link: `${p}/tools/refusal-decoder` };
  if (!code && has(HUMAN)) return { kind: "kb", answer: T(loc, "Our consultant can help you directly. Use the green WhatsApp button below, or book a free 15-minute call.", "ہمارا کنسلٹنٹ براہ راست مدد کر سکتا ہے۔ نیچے سبز واٹس ایپ بٹن دبائیں، یا مفت 15 منٹ کی کال بک کریں۔"), link: `${p}/book` };

  // "Step by step" / "how do I apply" / "process": every case is different, so the bot invites an enquiry and a representative follows up.
  const wantsSteps = topic === "steps" || /step by step|stepwise|tareeqa|tariqa|tarika|process kya|مرحلہ وار|طریقہ کار/.test(normalize(question));
  const matches = (c: Country) => {
    const cc = (c.country_code ?? "").toUpperCase();
    if (code === "EU") return /schengen|europe/.test(c.slug);
    return cc === code;
  };
  // no visit page for a country (e.g. Japan) falls back to its work or immigration page; no work page falls back to immigration
  const pick = (list: Country[]) => list.find((c) => c.kind === (kindWord ?? "visit")) ?? (kindWord === "work" ? list.find((c) => c.kind === "immigration") : undefined) ?? list.find((c) => c.kind === "visit") ?? list[0];
  let target: Country | undefined = code ? pick(countries.filter(matches)) : undefined;
  // a follow-up like "and documents?" continues with the country being discussed
  if (!target && topic && lastCountry) target = countries.find((c) => c.slug === lastCountry);
  if (wantsSteps && (target || !code)) {
    const where = target ? T(loc, ` for ${target.country_name}`, ` ${target.country_name} کے لیے`) : "";
    return {
      kind: "kb", country: target?.slug,
      answer: T(loc,
        `Every case is different, so I can't give one step-by-step plan that fits everyone${where}. Please send us an enquiry and our representative will contact you with the exact steps for your case.`,
        `ہر کیس مختلف ہوتا ہے، اس لیے میں سب کے لیے ایک جیسا مرحلہ وار طریقہ نہیں بتا سکتا${where}۔ براہ کرم ہمیں انکوائری بھیجیں، ہمارا نمائندہ آپ کے کیس کے مطابق درست مراحل کے ساتھ آپ سے رابطہ کرے گا۔`),
      link: `${p}/book`,
      suggest: target ? suggestFor(target, loc) : undefined,
    };
  }
  if (target) return { kind: "facts", answer: factsAnswer(target, topic, loc, now), link: `${p}${countryPath(target)}`, country: target.slug, suggest: suggestFor(target, loc) };

  if (topic && topic !== "steps" && topic !== "refusal" && content.length <= 5) {
    return { kind: "clarify", answer: T(loc, "Which country are you asking about?", "آپ کس ملک کے بارے میں پوچھ رہے ہیں؟"), suggest: ["UK", "Canada", "USA", "Australia", "Schengen"] };
  }

  const hits = searchKb(question, kb);
  const top = hits[0];
  if (top && top.coverage >= 0.6 && top.score >= 2) {
    const body = top.doc.body.length > 420 ? `${top.doc.body.slice(0, top.doc.body.lastIndexOf(" ", 420))}…` : top.doc.body;
    return { kind: "kb", answer: body, link: top.doc.link, country: top.doc.countrySlug, context: hits.slice(0, 3).map((h) => h.doc) };
  }
  return { kind: "none", answer: T(loc, "I'm not sure about that one. Our consultant can answer it on WhatsApp.", "مجھے اس کا یقین نہیں۔ ہمارا کنسلٹنٹ واٹس ایپ پر جواب دے گا۔"), context: hits.slice(0, 4).map((h) => h.doc) };
}

export const cacheKey = (question: string, loc: string) => `${loc}:${words(question).filter((w) => !STOP.has(w)).sort().join(" ")}`;

// Words for visa topics and countries in the website's other languages. The free answers are built from English content,
// so a question in another language is matched by adding the English word it means (no AI needed).
const HINTS: [RegExp, string][] = [
  [/gebühr|gebuhr|kosten|preis|frais|coût|tarif|tasa|precio|coste|ücret|tariffa|costo|taxa|preço|opłat|费用|签证费|رسوم|تكلفة|फ़ीस|फीस|शुल्क/i, "fee"],
  [/dokument|documento|documenti|document|belge|文件|材料|مستند|दस्तावेज/i, "documents"],
  [/dauer|délai|plazo|süre|tempi|tempo|prazo|termijn|czas|时间|مدة|समय/i, "processing time"],
  [/kontostand|solde|saldo|bakiye|余额|流水|رصيد|बैलेंस/i, "bank balance"],
  [/studium|étud|estudi|eğitim|öğrenci|studio|estudo|studeren|studia|留学|دراسة|पढ़ाई|स्टडी/i, "study"],
  [/berater|conseiller|asesor|danışman|consulente|consultor|adviseur|doradc|顾问|مستشار|सलाहकार/i, "talk to a consultant"],
  [/großbritannien|grossbritannien|royaume-uni|reino unido|ingiltere|regno unito|wielk\w* bryt|英国|بريطانيا|المملكة المتحدة|यूके/i, "uk"],
  [/\bkanada|canadá|加拿大|كندا|कनाडा/i, "canada"],
  [/vereinigte staaten|états-unis|etats-unis|estados unidos|ee\. ?uu|\beua\b|\babd\b|stany zjedn|美国|أمريكا|الولايات المتحدة|अमेरिका/i, "usa"],
  [/australien|australie|avustralya|austrália|australië|澳大利亚|أستراليا|ऑस्ट्रेलिया/i, "australia"],
  [/neuseeland|nouvelle-zélande|nueva zelanda|nuova zelanda|nova zelândia|nieuw-zeeland|nowa zelandia|yeni zelanda|新西兰|نيوزيلندا|न्यूज़ीलैंड/i, "new zealand"],
  [/申根|شنغن|शेंगेन|\beuropa\b|avrupa|欧洲|أوروبا|यूरोप/i, "schengen"],
  [/deutschland|allemagne|alemania|almanya|germania|alemanha|duitsland|niem(cy|czech)|德国|ألمانيا|जर्मनी/i, "germany"],
  [/\btailand|thaïlande|tailandia|tailândia|tajland|泰国|تايلاند|थाईलैंड/i, "thailand"],
  [/\bsingapur|singapour|singapura|新加坡|سنغافورة|सिंगापुर/i, "singapore"],
  [/arbeit|beruf|travail|emploi|trabajo|empleo|çalışma|lavoro|trabalho|emprego|\bwerk\b|praca|pracy|工作|就业|عمل|وظيفة|काम|नौकरी/i, "work permit"],
  [/japan|japon|giappone|japão|japonia|日本|اليابان|जापान/i, "japan"],
  [/saudi|arabie saoudite|arabia saudita|arábia saudita|saudi-arabien|suudi|arabia saudyjska|沙特|السعودية|सऊदी/i, "saudi"],
  [/korea|corée|coree|corea|coreia|südkorea|güney kore|korea południowa|韩国|كوريا|कोरिया/i, "korea"],
  [/schritt|étape|etapes|étapes|paso a paso|pasos|adım|adim|passo a passo|passaggi|stappen|stap voor stap|krok po kroku|kroki|步骤|流程|خطوات|कदम|चरण/i, "step by step process"],
  [/irland|irlande|irlanda|ierland|爱尔兰|أيرلندا|आयरलैंड/i, "ireland"],
];
export const withEnglishHints = (q: string) => [q, ...HINTS.filter(([re]) => re.test(q)).map(([, word]) => word)].join(" ");
