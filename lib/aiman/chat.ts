// The chat engine of "Talk with Aiman", ported from the approved prototype. It runs entirely in the browser (no server call per question).
// The React page only draws what this class holds and calls its methods.
import { OPTIONS, type CountryId, type FundsConfig, type Purpose } from "@/config/aiman";
import { cleanPhone } from "./phone";
import { COPY, type CopyId } from "./copy";
import { assessAll, childrenNum, membersNum, needSponsorQ, PURPOSE_KEY, type Answers } from "./assess";
import { fmt } from "./lead";

type Vars = Record<string, string | number>;
export interface Bubble { n: number; who: "ai" | "me"; en: string; loc?: string; edit?: number }
export interface Chip { en: string; loc?: string; ur?: string; v: string; yn?: "yes" | "no" }
interface ChipDef { k?: CopyId; t?: string; v: string; yn?: "yes" | "no"; country?: CountryId }
interface Q {
  id: keyof Answers; q: CopyId; multi?: boolean; vars?: (a: Answers) => Vars; when?: (a: Answers, f: FundsConfig) => boolean; text?: boolean;
  chips?: ChipDef[] | ((a: Answers) => ChipDef[]); parse?: (raw: string) => unknown | null; bad?: CopyId;
  valid?: (v: string, a: Answers) => { id: CopyId; vars?: Vars } | null; chipValue?: (v: string) => unknown; onSet?: (a: Answers, v: unknown) => void;
}

const num = (raw: string, lo: number, hi: number) => { const n = parseInt(raw.replace(/\D/g, ""), 10); return n >= lo && n <= hi ? n : null; };
const C = (k: CopyId, v: string, yn?: "yes" | "no"): ChipDef => ({ k, v, yn });
const digits = (list: string[]): ChipDef[] => list.map((t) => ({ t, v: t }));

const QUESTIONS: Q[] = [
  { id: "name", q: "q_name", text: true, bad: "q_name_bad", parse: (r) => { const v = r.trim(); return v.length >= 2 && v.length <= 40 && !/^\d+$/.test(v) ? v.charAt(0).toUpperCase() + v.slice(1) : null; } },
  { id: "phone", q: "q_phone", text: true, bad: "q_phone_bad", parse: (r) => cleanPhone(r) },
  { id: "email", q: "q_email", text: true, bad: "q_email_bad", chips: [C("c_skip", "skip")], chipValue: (v) => (v === "skip" ? "" : v), parse: (r) => { const t = r.trim().toLowerCase(); return /^[^\s@]{1,64}@[^\s@]{1,200}\.[^\s@]{2,}$/.test(t) ? t : /^(skip|no|none|nahi|نہیں)$/.test(t) ? "" : null; } },
  { id: "age", q: "q_age", vars: (a) => ({ name: a.name ?? "" }), chips: [C("c_a1", "18–25"), C("c_a2", "26–35"), C("c_a3", "36–44"), C("c_a4", "45+")] },
  { id: "edu", q: "q_edu", chips: [C("c_edu_low", "low"), C("c_edu_bach", "bach"), C("c_edu_mast", "mast")] },
  { id: "job", q: "q_job", chips: [C("c_job_salaried", "salaried"), C("c_job_business", "business"), C("c_job_freelancer", "freelancer"), C("c_job_student", "student"), C("c_job_none", "none")] },
  { id: "salmode", q: "q_sal", when: (a) => a.job === "salaried", chips: [C("c_sal_bank", "bank"), C("c_sal_cash", "cash")] },
  { id: "bizreg", q: "q_biz", when: (a) => a.job === "business", chips: [C("c_biz_reg", "reg", "yes"), C("c_biz_unreg", "unreg", "no")] },
  { id: "frmode", q: "q_fr", when: (a) => a.job === "freelancer", chips: [C("c_fr_bank", "bank"), C("c_fr_cash", "cash")] },
  { id: "travel", q: "q_travel", chips: [C("c_tr_none", "none"), C("c_tr_regional", "regional"), C("c_tr_west", "west")] },
  { id: "refusal", q: "q_refusal", chips: [C("c_ref_never", "never", "no"), C("c_ref_refused", "refused", "yes")] },
  { id: "purpose", q: "q_purpose", chips: [C("c_pu_visit", "visit"), C("c_pu_study", "study"), C("c_pu_work", "work"), C("c_pu_pr", "pr")], onSet: (a, v) => { a.purposeKey = PURPOSE_KEY[String(v)]; } },
  { id: "family", q: "q_family", chips: [C("c_fam_alone", "alone"), C("c_fam_family", "family")] },
  { id: "members", q: "q_members", when: (a) => a.family === "family", chips: [...digits(["2", "3", "4", "5", "6", "7", "8"]), C("c_9plus", "9+")] },
  { id: "membersExact", q: "q_members_x", text: true, when: (a) => a.members === "9+", bad: "q_members_x_bad", parse: (r) => num(r, 9, 40) },
  {
    id: "children", q: "q_children", when: (a) => a.family === "family", chips: [...digits(["0", "1", "2", "3", "4", "5"]), C("c_6plus", "6+")],
    valid: (v, a) => ((v === "6+" ? 6 : Number(v)) >= membersNum(a) ? { id: "q_children_bad", vars: { n: membersNum(a) } } : null),
  },
  { id: "childrenExact", q: "q_children_x", text: true, when: (a) => a.children === "6+", bad: "q_children_x_bad", parse: (r) => { const n = num(r, 6, 40); return n !== null && n < 100 ? n : null; } },
  { id: "youngest", q: "q_young", when: (a) => childrenNum(a) > 0, chips: [C("c_y_u2", "u2"), C("c_y_kid", "kid"), C("c_y_teen", "teen")] },
  { id: "english", q: "q_english", when: (a) => ["study", "immigration", "work"].includes(a.purposeKey ?? ""), chips: [C("c_en_ok", "ok"), C("c_en_low", "low"), C("c_en_none", "none")] },
  { id: "exp", q: "q_exp", when: (a) => ["work", "immigration"].includes(a.purposeKey ?? ""), chips: [C("c_exp_lt2", "lt2"), C("c_exp_2to5", "2to5"), C("c_exp_5plus", "5plus")] },
  { id: "offer", q: "q_offer", when: (a) => a.purposeKey === "work", chips: [C("c_off_yes", "yes", "yes"), C("c_off_no", "no", "no")] },
  {
    id: "balNum", q: "q_bal", text: true, bad: "q_bal_bad", chips: [C("c_b1", "2.5"), C("c_b2", "5"), C("c_b3", "10"), C("c_b4", "15"), C("c_b5", "25"), C("c_b6", "40")], chipValue: (v) => parseFloat(v),
    parse: (r) => { const t = r.toLowerCase().replace(/,/g, ""); const m = t.match(/(\d+(\.\d+)?)/); if (!m) return null; let n = parseFloat(m[1]); if (/crore|cr|کروڑ|كرور/.test(t)) n *= 100; else if (/million|m\b/.test(t)) n *= 10; return n >= 0 && n <= 100000 ? n : null; },
  },
  { id: "deposits", q: "q_dep", chips: [C("c_dep_steady", "steady"), C("c_dep_big", "big", "yes")] },
  { id: "countries", q: "q_country", multi: true, chips: (a) => [...OPTIONS[a.purposeKey ?? "visit"].map((c): ChipDef => ({ k: `l_${c}` as CopyId, v: c, country: c })), C("c_any", "any")] },
  { id: "sponsor", q: "q_sponsor", when: null as unknown as Q["when"], chips: [C("c_sp_yes", "yes", "yes"), C("c_sp_no", "no", "no")] },
];

const YES = /^(yes|y|yeah|yep|haan|han|ji|jee|g|جی|ہاں|نعم|ايوه|أجل)(\s|$)/i, NO = /^(no|n|nope|nahi|nahin|na|نہیں|نا|لا)(\s|$)/i;
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}+ ]/gu, " ").replace(/\s+/g, " ").trim();
const FAQ: [RegExp, CopyId][] = [
  [/fee|fees|cost|price|charges|kitn[ae]|paisa|paise|رقم|فیس|خرچ|رسوم|تكلفة|سعر/, "faq_fee"],
  [/guarantee|100 ?%|pakka|گارنٹی|یقین|ضمان/, "faq_guarantee"],
  [/how long|time|days|kab|waqt|کتنا وقت|کب|دن|مدة|وقت|كم يستغرق/, "faq_time"],
  [/whatsapp|call|phone|number|contact|رابطہ|نمبر|کال|واتساب|واتس|اتصال|رقم الهاتف/, "faq_contact"],
  [/real|human|robot|bot|ai\b|insaan|انسان|اصلی|حقيقي|بشر|روبوت/, "faq_real"],
  [/^(hi|hello|hey|salam|assalam|aoa|سلام|السلام|مرحبا|اهلا|أهلا)/, "faq_hello"],
  [/safe|private|secure|data|محفوظ|پرائیویسی|خصوصية|امان|أمان/, "faq_privacy"],
];

export interface ChatHooks { onStart?: () => void; onResult?: (a: Answers) => void; onChange: () => void }

export class Chat {
  ans: Answers = {};
  items: Bubble[] = [];
  chips: Chip[] = [];
  /** Set while the country question is open: the full list to tick one or more from. */
  multi: Chip[] | null = null;
  typing = false;
  finished = false;
  started = false;
  secs = 0;
  progress = 0;
  lang: "en" | "loc" = "en";
  private qi = -1;
  private hist: { qi: number; count: number }[] = [];
  private qMark = 0;
  private n = 0;
  private gen = 0;
  private t0: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private dict: Record<string, string>, private funds: FundsConfig, private hooks: ChatHooks) { this.reset(); }

  /** English text, and the same in the visitor's language when we have it. */
  tx(id: CopyId, vars?: Vars): { en: string; loc?: string } {
    const row = COPY[id], v = vars ? { ...vars } : undefined;
    if (v && typeof v.people === "string") { v.people = this.t(v.people === "people" ? "w_people" : "w_person"); }
    const en = fmt(row[0], vars), l = this.dict[id];
    return { en, loc: l ? fmt(l, v) : undefined };
  }
  private t = (id: CopyId) => this.dict[id] ?? COPY[id][0];
  private emit() { this.hooks.onChange(); }
  private say(en: string, loc: string | undefined, who: "ai" | "me", edit?: number) { this.items = [...this.items, { n: ++this.n, who, en, loc, edit }]; }
  private sayId(id: CopyId, vars?: Vars) { const x = this.tx(id, vars); this.say(x.en, x.loc, "ai"); }

  private applicable() { return QUESTIONS.filter((q) => this.qOn(q)); }
  private qOn(q: Q) { return q.id === "sponsor" ? needSponsorQ(this.ans, this.funds) : q.when ? q.when(this.ans, this.funds) : true; }
  private current(): Q | undefined { return QUESTIONS[this.qi]; }
  private updateProgress() { const app = this.applicable(); this.progress = Math.round((app.filter((q) => this.ans[q.id] !== undefined).length / app.length) * 100); }
  private startTimer() {
    if (this.t0) return;
    this.t0 = Date.now(); this.hooks.onStart?.();
    this.timer = setInterval(() => { if (!this.finished) { this.secs = Math.floor((Date.now() - this.t0!) / 1000); this.emit(); } }, 1000);
  }
  elapsed() { return this.t0 ? Math.round((Date.now() - this.t0) / 1000) : 0; }
  destroy() { if (this.timer) clearInterval(this.timer); this.gen++; }

  private chipsFor(q: Q): Chip[] {
    const list = typeof q.chips === "function" ? q.chips(this.ans) : q.chips ?? [];
    return list.map((c) => {
      if (!c.k) return { en: c.t ?? c.v, v: c.v, yn: c.yn };
      const x = this.tx(c.k);
      return { en: x.en, loc: x.loc, ur: COPY[c.k][1], v: c.v, yn: c.yn };
    });
  }
  private showChips() { const q = this.current(); const on = !this.finished && q && this.qi >= 0; this.multi = on && q.multi ? this.chipsFor(q) : null; this.chips = on && !q.multi ? this.chipsFor(q) : []; }

  private ask() {
    const q = this.current()!;
    this.qMark = this.items.length; this.chips = []; this.multi = null; this.typing = true; const g = this.gen; this.emit();
    setTimeout(() => { if (g !== this.gen) return; this.typing = false; const x = this.tx(q.q, q.vars?.(this.ans)); this.say(x.en, x.loc, "ai"); this.showChips(); this.emit(); }, 450);
  }
  private advance() {
    this.qi++; while (this.qi < QUESTIONS.length && !this.qOn(QUESTIONS[this.qi])) this.qi++;
    this.updateProgress();
    if (this.qi >= QUESTIONS.length) return this.finish();
    this.ask();
  }
  private record(q: Q, value: unknown, en: string, loc?: string) {
    this.hist.push({ qi: this.qi, count: this.qMark });
    (this.ans as Record<string, unknown>)[q.id] = value; q.onSet?.(this.ans, value);
    this.say(en, loc, "me", this.hist.length - 1); this.chips = []; this.multi = null;
  }

  start() { this.startTimer(); const x = this.tx("m_start"); this.say(x.en, x.loc, "me"); this.chips = []; this.started = true; this.advance(); }
  pick(c: Chip) {
    this.startTimer();
    const q = this.current(); if (!q) return;
    const bad = q.valid?.(c.v, this.ans);
    if (bad) { this.say(c.en, c.loc, "me"); this.chips = []; this.emit(); const g = this.gen; setTimeout(() => { if (g !== this.gen) return; const x = this.tx(bad.id, bad.vars); this.say(x.en, x.loc, "ai"); this.showChips(); this.emit(); }, 350); return; }
    this.record(q, q.chipValue ? q.chipValue(c.v) : c.v, c.en, c.loc); this.advance();
  }

  /** The ticked countries (an empty list or "any" = Aiman suggests). */
  pickMulti(values: string[]) {
    const q = this.current(); if (!q?.multi || !values.length) return;
    this.startTimer();
    const all = this.chipsFor(q), any = values.includes("any");
    const picked = any ? [] : all.filter((c) => values.includes(c.v));
    if (!any && !picked.length) return;
    const src = any ? all.filter((c) => c.v === "any") : picked;
    const sep = ", ", en = src.map((c) => c.en).join(sep);
    const loc = src.every((c) => c.loc) ? src.map((c) => c.loc).join(sep) : undefined;
    this.record(q, any ? [] : picked.map((c) => c.v), en, loc); this.advance();
  }
  private matchMulti(q: Q, raw: string): string[] | null {
    const all = this.chipsFor(q), t = norm(raw);
    if (/(not sure|any|suggest|you decide|pata nahi|کوئی بھی)/.test(t)) return ["any"];
    const hits = new Set<string>();
    for (const part of raw.split(/[,،;/+&]|and|or|اور|و/i)) {
      const p = norm(part); if (p.length < 2) continue;
      for (const c of all) if (c.v !== "any" && [c.en, c.loc, c.ur].some((s) => { const n = s ? norm(s) : ""; return n && (n === p || (p.length >= 3 && (n.includes(p) || p.includes(n)))); })) hits.add(c.v);
    }
    return hits.size ? [...hits] : null;
  }

  private match(q: Q, raw: string): Chip | null {
    const chips = this.chipsFor(q), t = norm(raw); if (!t || !chips.length) return null;
    if (YES.test(raw.trim())) { const c = chips.find((x) => x.yn === "yes"); if (c) return c; }
    if (NO.test(raw.trim())) { const c = chips.find((x) => x.yn === "no"); if (c) return c; }
    for (const c of chips) if ([c.en, c.loc, c.ur].some((s) => s && norm(s) === t)) return c;
    if (/^\d+(\.\d+)?$/.test(t)) {
      const n = parseFloat(t);
      for (const c of chips) {
        const l = c.en; let m: RegExpMatchArray | null;
        if ((m = l.match(/(\d+)\s*[–-]\s*(\d+)/))) { if (n >= +m[1] && n <= +m[2]) return c; }
        else if ((m = l.match(/^(\d+)\s*(\+|or more)/))) { if (n >= +m[1]) return c; }
        else if ((m = l.match(/^under\s+(\d+)/i))) { if (n < +m[1]) return c; }
        else if (l === t) return c;
      }
    }
    for (const c of chips) for (const s of [c.en, c.loc, c.ur]) { const a = s ? norm(s) : ""; if (a && t.length >= 2 && (a.includes(t) || t.includes(a)) && (s !== c.en || t.length >= 3)) return c; }
    return null;
  }
  private faq(raw: string) { const l = raw.toLowerCase(); return FAQ.find(([re]) => re.test(l))?.[1]; }

  /** A typed message: an answer, a question about Visafeast, or something Aiman did not understand. */
  type(raw0: string) {
    const raw = raw0.trim().slice(0, 300); if (!raw) return;
    this.startTimer();
    const mine = () => this.say(raw, raw, "me");
    const later = (fn: () => void) => { const g = this.gen; setTimeout(() => { if (g !== this.gen) return; fn(); this.emit(); }, 350); };
    if (/^(back|undo|change|wapas|واپس|رجوع)$/i.test(raw) && !this.finished) { mine(); later(() => this.undo()); this.emit(); return; }
    if (this.finished) { mine(); const f = this.faq(raw); later(() => this.sayId(f ?? "m_confirm_wa")); this.emit(); return; }
    if (!this.started) {
      mine(); const go = YES.test(raw) || /ready|start|shuru|شروع|تیار|ابدأ|جاهز|لنبدأ/i.test(raw);
      if (go) { this.chips = []; this.start(); } else later(() => this.sayId("m_start_hint"));
      this.emit(); return;
    }
    const q = this.current()!;
    if (q.text) {
      const r = q.parse!(raw), f = r === null ? this.faq(raw) : undefined;
      if (f) { mine(); later(() => { this.sayId(f); const x = this.tx(q.q, q.vars?.(this.ans)); this.say(x.en, x.loc, "ai"); }); this.emit(); return; }
      if (r === null) { mine(); later(() => { this.sayId(q.bad!); this.showChips(); }); this.emit(); return; }
      this.record(q, r, raw, raw); this.advance(); return;
    }
    if (q.multi) { const m = this.matchMulti(q, raw); if (m) { this.pickMulti(m); return; } }
    const c = q.multi ? null : this.match(q, raw);
    if (c) { this.pick(c); return; }
    mine(); const f = this.faq(raw);
    later(() => { if (f) { this.sayId(f); this.sayId("m_back"); } else this.sayId("m_nomatch"); this.showChips(); });
    this.emit();
  }

  /** Tap an earlier answer: it and everything after it are removed and that question is asked again. */
  rewindTo(idx: number) {
    if (idx < 0 || idx >= this.hist.length) return;
    const h = this.hist[idx]; this.hist.length = idx; this.gen++; this.typing = false;
    this.items = this.items.slice(0, h.count);
    for (let i = h.qi; i < QUESTIONS.length; i++) delete (this.ans as Record<string, unknown>)[QUESTIONS[i].id];
    if (h.qi <= QUESTIONS.findIndex((x) => x.id === "purpose")) delete this.ans.purposeKey;
    this.finished = false; this.qi = h.qi - 1; this.advance();
  }
  undo() { this.rewindTo(this.hist.length - 1); }
  canUndo() { return this.hist.length > 0 && !this.finished; }

  private finish() {
    this.finished = true; this.chips = []; this.multi = null; this.progress = 100;
    const r = assessAll(this.ans, this.funds), name = this.ans.name ?? "";
    this.sayId(r.qualified ? "m_qualified" : "m_notyet", { name, s: r.qual.length > 1 ? "s" : "" });
    this.hooks.onResult?.(this.ans); this.emit();
  }

  /** Back to the first question, with a clean slate (timer, progress and result included). */
  reset() {
    this.gen++; if (this.timer) clearInterval(this.timer); this.timer = null; this.t0 = null;
    this.ans = {}; this.hist = []; this.qi = -1; this.qMark = 0; this.finished = false; this.started = false; this.typing = false; this.secs = 0; this.progress = 0;
    this.multi = null; this.items = []; this.sayId("m_hello");
    const x = this.tx("m_start"); this.chips = [{ en: x.en, loc: x.loc, ur: COPY.m_start[1], v: "__start" }];
    this.emit();
  }
  /** The first button ("Let's start") is not a question's answer. */
  press(c: Chip) { if (c.v === "__start") this.start(); else this.pick(c); }
  /** After the lead form is sent. */
  thank() { this.sayId("m_thanks"); this.emit(); }
  setLang(l: "en" | "loc") { this.lang = l; this.emit(); }
  assessment() { return assessAll(this.ans, this.funds); }
  purpose(): Purpose { return this.ans.purposeKey ?? "visit"; }
}
