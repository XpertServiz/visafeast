import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { Chat } from "../lib/aiman/chat";
import { COPY } from "../lib/aiman/copy";
import { assessAll, cleanAnswers, needFor, type Answers } from "../lib/aiman/assess";
import { leadEmailHtml, leadText } from "../lib/aiman/lead";
import { cleanPhone } from "../lib/aiman/phone";
import { aimanLangFor, COUNTRY_MAIN_LANG } from "../config/locales";
import { DEFAULT_FUNDS, mergeFunds } from "../config/aiman";
import ar from "../lib/aiman/gen/ar.json";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const mk = (dict: Record<string, string> = {}) => new Chat(dict, DEFAULT_FUNDS, { onChange: () => {} });
/** Taps a chip by its English text, then lets Aiman's typing indicator finish. */
const tap = (c: Chat, en: string) => { const chip = c.chips.find((x) => x.en === en); if (!chip) throw new Error(`no chip "${en}" among ${c.chips.map((x) => x.en).join(" | ")}`); c.press(chip); vi.advanceTimersByTime(500); };
const say = (c: Chat, text: string) => { c.type(text); vi.advanceTimersByTime(500); };
const last = (c: Chat) => c.items[c.items.length - 1].en;
const start = (c: Chat, name = "Ali") => { tap(c, "Let's start →"); say(c, name); say(c, "03001234567"); say(c, "ali@example.com"); };
const pickCountries = (c: Chat, ids: string[]) => { c.pickMulti(ids); vi.advanceTimersByTime(500); };

/** Visit / UK, a family of 5 with 3 children, 80 lacs, steady, salaried by bank. */
function familyVisit(c: Chat) {
  start(c); tap(c, "26–35"); tap(c, "Bachelor's"); tap(c, "Salaried job"); tap(c, "Bank account"); tap(c, "UK / Schengen / USA / Canada / Australia");
  tap(c, "Never refused"); tap(c, "Visit / Tourism"); tap(c, "With family"); tap(c, "5"); tap(c, "3"); tap(c, "2–11 years");
  say(c, "80"); tap(c, "Steady, built up slowly"); pickCountries(c, ["uk"]);
}

describe("the chat flow", () => {
  it("a family of 5 with 3 children reaches a result and asks the youngest child's age", () => {
    const c = mk(); familyVisit(c);
    expect(c.finished).toBe(true);
    expect(c.ans.members).toBe("5"); expect(c.ans.children).toBe("3"); expect(c.ans.youngest).toBe("kid");
    expect(assessAll(c.ans).qualified).toBe(true); // 5 people x 15 lacs = 75 <= 80
  });
  it("'9 or more' asks for the exact number, and refuses a number that is too small", () => {
    const c = mk(); start(c); tap(c, "26–35"); tap(c, "Bachelor's"); tap(c, "Not working"); tap(c, "No travel yet"); tap(c, "Never refused"); tap(c, "Visit / Tourism"); tap(c, "With family");
    tap(c, "9 or more");
    expect(last(c)).toMatch(/exact number of family members/);
    say(c, "5"); expect(last(c)).toMatch(/from 9 to 40/);
    say(c, "11"); expect(c.ans.membersExact).toBe(11);
    expect(last(c)).toMatch(/under 18/);
  });
  it("children cannot be as many as the family", () => {
    const c = mk(); start(c); tap(c, "26–35"); tap(c, "Bachelor's"); tap(c, "Not working"); tap(c, "No travel yet"); tap(c, "Never refused"); tap(c, "Visit / Tourism"); tap(c, "With family"); tap(c, "3");
    tap(c, "4" ); // not a chip for "3 members" question? children chips: 0-5, 6 or more
    expect(last(c)).toMatch(/more children than total members \(3\)/);
  });
  it("typed answers: yes / haan / a number / a keyword; a fee question keeps the place; nonsense gets the options again", () => {
    const c = mk(); start(c); tap(c, "26–35"); tap(c, "Bachelor's"); tap(c, "Own business");
    say(c, "haan"); expect(c.ans.bizreg).toBe("reg");
    say(c, "dubai"); expect(c.ans.travel).toBe("regional");
    say(c, "no"); expect(c.ans.refusal).toBe("never");
    say(c, "How much are your fees?"); expect(c.items.slice(-3).map((b) => b.en).join(" ")).toMatch(/free[\s\S]*Back to your question/);
    expect(c.ans.purpose).toBeUndefined(); // still on the purpose question
    say(c, "qwerty zxcv"); expect(last(c)).toMatch(/didn't quite get that/);
    expect(c.chips.length).toBeGreaterThan(0);
    say(c, "study"); expect(c.ans.purpose).toBe("study");
    tap(c, "Just me");
    say(c, "yes"); // English test: "yes" is not a clear option there, so it must not pick one by accident
  });
  it("number-in-range: typing 3 on a count question picks '3'; 12 picks the 10–15 lacs range", () => {
    const c = mk(); familyVisit(c); expect(c.ans.balNum).toBe(80);
    const d = mk(); start(d); tap(d, "26–35"); tap(d, "Bachelor's"); tap(d, "Not working"); tap(d, "No travel yet"); tap(d, "Never refused"); tap(d, "Visit / Tourism"); tap(d, "With family");
    say(d, "3"); expect(d.ans.members).toBe("3");
  });
  it("amounts: '2.5 crore' means 250 lacs", () => {
    const c = mk(); start(c); tap(c, "26–35"); tap(c, "Bachelor's"); tap(c, "Not working"); tap(c, "No travel yet"); tap(c, "Never refused"); tap(c, "Visit / Tourism"); tap(c, "Just me");
    say(c, "2.5 crore"); expect(c.ans.balNum).toBe(250);
  });
  it("tapping an earlier answer after the result recalculates everything; reset clears everything", () => {
    const c = mk(); familyVisit(c); expect(c.finished).toBe(true);
    const idx = c.items.find((b) => b.who === "me" && b.en === "5")!.edit!;
    c.rewindTo(idx); vi.advanceTimersByTime(500);
    expect(c.finished).toBe(false); expect(c.ans.members).toBeUndefined(); expect(c.ans.balNum).toBeUndefined(); expect(c.ans.name).toBe("Ali");
    tap(c, "2"); tap(c, "0"); say(c, "10"); tap(c, "Steady, built up slowly");
    expect(c.ans.balNum).toBe(10);
    pickCountries(c, ["uk"]);
    // 2 people x 15 = 30 lacs needed, 10 given: after the country, the sponsor question must appear
    expect(last(c)).toMatch(/below what is usually expected/);
    c.reset(); expect(c.ans).toEqual({}); expect(c.finished).toBe(false); expect(c.progress).toBe(0); expect(c.items).toHaveLength(1);
  });
  it("the timer starts at the first tap and the progress bar moves", () => {
    const c = mk(); tap(c, "Let's start →"); say(c, "Sara"); vi.advanceTimersByTime(5000); expect(c.secs).toBeGreaterThanOrEqual(4); expect(c.progress).toBeGreaterThan(0);
  });
  it("shows the visitor's language under the English when a dictionary is given", () => {
    const c = mk({ q_name: "اردو سوال" }); expect(c.items[0].loc).toBeUndefined(); // hello bubble first
    tap(c, "Let's start →"); expect(c.items.find((b) => b.en === COPY.q_name[0])?.loc).toBe("اردو سوال");
  });
});

describe("eligibility rules (config-driven)", () => {
  const base: Answers = { name: "Ali", age: "26–35", edu: "bach", job: "salaried", salmode: "bank", travel: "west", refusal: "never", purpose: "visit", purposeKey: "visit", family: "alone", balNum: 20, deposits: "steady", countries: ["uk"] };
  it("funds figures come from the config and the admin's saved values override them", () => {
    expect(needFor("uk", "visit", { ...base, family: "family", members: "5" })).toBe(75);
    expect(needFor("turkey", "visit", base)).toBe(5);
    expect(needFor("uk", "study", { ...base, family: "family", members: "3" })).toBe(30 + 2 * 10);
    const f = mergeFunds({ visit: { uk: 20 }, workPerPerson: 8, studyPerDependant: "oops" });
    expect(needFor("uk", "visit", base, f)).toBe(20); expect(f.visit.canada).toBe(15); expect(f.workPerPerson).toBe(8); expect(f.studyPerDependant).toBe(10);
  });
  it("short funds without a sponsor is a gap; with a sponsor it is only a note", () => {
    const low = { ...base, balNum: 5 };
    expect(assessAll(low).qualified).toBe(false);
    expect(assessAll({ ...low, sponsor: "yes" }).qualified).toBe(true);
  });
  it("big recent deposits are a gap for strict countries only", () => {
    expect(assessAll({ ...base, deposits: "big" }).qualified).toBe(false);
    expect(assessAll({ ...base, deposits: "big", countries: ["turkey"], balNum: 10 }).qualified).toBe(true);
  });
  it("work without an offer fails (except Germany); PR at 45+ fails", () => {
    const work = { ...base, purpose: "work" as const, purposeKey: "work" as const, english: "ok" as const, exp: "5plus" as const, offer: "no" as const, balNum: 30 };
    expect(assessAll({ ...work, countries: ["uk"] }).qualified).toBe(false);
    expect(assessAll({ ...work, countries: ["germany"] }).qualified).toBe(true);
    const pr = { ...work, purpose: "pr" as const, purposeKey: "immigration" as const, balNum: 60, countries: ["canada"] };
    expect(assessAll(pr).qualified).toBe(true);
    expect(assessAll({ ...pr, age: "45+" }).qualified).toBe(false);
  });
  it("if the chosen country fails but others pass, the others are listed", () => {
    const r = assessAll({ ...base, balNum: 12, countries: ["uk"], deposits: "steady", sponsor: undefined });
    expect(r.qualified).toBe(false); expect(r.others.map((x) => x.c)).toEqual(expect.arrayContaining(["turkey", "dubai", "malaysia"]));
  });
});

describe("leads: the server recomputes everything and rejects made-up answers", () => {
  const good = { name: "Ali", age: "26–35", edu: "bach", job: "salaried", salmode: "bank", travel: "west", refusal: "never", purpose: "visit", family: "alone", balNum: 20, deposits: "steady", countries: ["uk"] };
  it("accepts a valid set and fills purposeKey itself", () => { expect(cleanAnswers(good)?.purposeKey).toBe("visit"); });
  it("rejects invented values, missing fields and impossible families", () => {
    expect(cleanAnswers({ ...good, edu: "phd" })).toBeNull();
    expect(cleanAnswers({ ...good, countries: ["mars"] })).toBeNull();
    expect(cleanAnswers({ ...good, balNum: -1 })).toBeNull();
    expect(cleanAnswers({ ...good, name: "A" })).toBeNull();
    expect(cleanAnswers({ ...good, family: "family", members: "3", children: "5" })).toBeNull();
    expect(cleanAnswers({ ...good, status: "qualified", purposeKey: "work" })?.purposeKey).toBe("visit"); // client-sent status / key are ignored
    expect(cleanAnswers("x")).toBeNull();
  });
  it("the status is decided from the answers, not from anything the browser claims", () => {
    const a = cleanAnswers({ ...good, balNum: 3 })!; const t = leadText(a, DEFAULT_FUNDS);
    expect(t.status).toBe("not_qualified"); expect(t.subject).toMatch(/^⚠️ NOT YET QUALIFIED — Ali \| Visit \/ Tourism · UK \| Needs: /);
    const q = leadText(cleanAnswers(good)!, DEFAULT_FUNDS, { secs: 90, phone: "+923001234567", city: "Karachi" });
    expect(q.status).toBe("qualified"); expect(q.subject).toBe("✅ QUALIFIED LEAD — Ali | Visit / Tourism · UK | 1 person | PKR 20 lacs");
    expect(q.p1).toContain("Karachi"); expect(q.p2).toContain("Recommended action: call within 24 hours");
  });
  it("the two emails use the right colours and call to action", () => {
    const q = leadEmailHtml(leadText(cleanAnswers(good)!, DEFAULT_FUNDS)), n = leadEmailHtml(leadText(cleanAnswers({ ...good, balNum: 3 })!, DEFAULT_FUNDS));
    expect(q).toContain("#1f9d63"); expect(q).toContain("Call / WhatsApp within 24 hours");
    expect(n).toContain("#d98a14"); expect(n).toContain("Send improvement plan within 48 hours");
  });
  it("emails escape what a visitor typed", () => {
    const html = leadEmailHtml(leadText(cleanAnswers({ ...good, name: "<script>x</script>" })!, DEFAULT_FUNDS));
    expect(html).not.toContain("<script>"); expect(html).toContain("&lt;script&gt;");
  });
  it("WhatsApp numbers: Pakistani, Saudi and international are accepted, rubbish is not", () => {
    expect(cleanPhone("0300 1234567")).toBe("+923001234567"); expect(cleanPhone("+923001234567")).toBe("+923001234567");
    expect(cleanPhone("0501234567")).toBe("+966501234567"); expect(cleanPhone("+4915112345678")).toBe("+4915112345678");
    expect(cleanPhone("12345")).toBeNull(); expect(cleanPhone("abc")).toBeNull();
  });
});

describe("languages", () => {
  it("Pakistan gets Urdu, Saudi Arabia Arabic, Germany German, the UK English only", () => {
    expect(aimanLangFor("PK")).toBe("ur"); expect(aimanLangFor("SA")).toBe("ar"); expect(aimanLangFor("DE")).toBe("de"); expect(aimanLangFor("GB")).toBeNull(); expect(aimanLangFor(null)).toBeNull();
    expect(Object.keys(COUNTRY_MAIN_LANG).length).toBeGreaterThan(80);
  });
  it("the Urdu and Arabic words are exactly those of the approved prototype", () => {
    expect(COPY.q_edu[1]).toBe("آپ کی اعلیٰ ترین تعلیم کیا ہے؟");
    expect((ar as Record<string, string>).q_edu).toBe("ما هو أعلى مؤهل تعليمي لديك؟");
    expect(COPY.m_hello[1]).toContain("میں ایمن ہوں");
  });
  const files = readdirSync("lib/aiman/gen").filter((f) => f.endsWith(".json") && f !== "ar.json");
  it("all 13 other languages exist", () => { expect(files.map((f) => f.replace(".json", "")).sort()).toEqual(["bn", "de", "es", "fa", "fr", "hi", "id", "it", "ms", "nl", "pt", "ru", "tr"]); });
  it.each(files)("%s covers the copy, keeps every {placeholder}, and never names a real person", (f) => {
    const d = JSON.parse(readFileSync(`lib/aiman/gen/${f}`, "utf8")) as Record<string, string>;
    expect(Object.keys(d).length).toBeGreaterThanOrEqual(165);
    for (const [id, t] of Object.entries(d)) {
      expect(COPY[id], `${f}: unknown id ${id}`).toBeTruthy();
      const want = (COPY[id][0].match(/\{\w+\}/g) ?? []).filter((x) => x !== "{s}").sort().join(), got = (t.match(/\{\w+\}/g) ?? []).sort().join();
      expect(got, `${f}: ${id}`).toBe(want);
    }
  });
});

describe("contact details, many countries, every purpose", () => {
  it("asks name, then WhatsApp number, then email, and refuses bad ones", () => {
    const c = mk(); tap(c, "Let's start →"); say(c, "Ali");
    expect(last(c)).toMatch(/WhatsApp number/); say(c, "12"); expect(last(c)).toMatch(/doesn't look right/);
    say(c, "0300 1234567"); expect(c.ans.phone).toBe("+923001234567"); expect(last(c)).toMatch(/email/);
    say(c, "not-an-email"); expect(last(c)).toMatch(/doesn't look right/);
    say(c, "Ali@Example.com"); expect(c.ans.email).toBe("ali@example.com"); expect(last(c)).toMatch(/age group/);
  });
  it("email can be skipped", () => {
    const c = mk(); tap(c, "Let's start →"); say(c, "Ali"); say(c, "03001234567"); tap(c, "Skip"); expect(c.ans.email).toBe(""); expect(last(c)).toMatch(/age group/);
  });
  it("the country list offers all landing-page countries, and one or many can be ticked", () => {
    const c = mk(); familyVisit(c);
    const d = mk(); start(d); tap(d, "26–35"); tap(d, "Bachelor's"); tap(d, "Not working"); tap(d, "No travel yet"); tap(d, "Never refused"); tap(d, "Settle abroad (PR / Immigration)");
    tap(d, "Just me"); tap(d, "Yes, score 6+ (or equal)"); tap(d, "5+ years"); say(d, "60"); tap(d, "Steady, built up slowly");
    const names = d.multi!.map((x) => x.en);
    for (const n of ["France", "New Zealand", "Portugal", "Ireland", "Netherlands", "Germany", "Saudi Arabia", "Japan", "Not sure — Aiman, you suggest"]) expect(names, n).toContain(n);
    expect(names.length).toBeGreaterThanOrEqual(24);
    pickCountries(d, ["france", "ireland", "newzealand"]);
    expect([...d.ans.countries!].sort()).toEqual(["france", "ireland", "newzealand"]); expect(d.finished).toBe(true);
    const r = d.assessment(); expect(r.focus.map((x) => x.c).sort()).toEqual(["france", "ireland", "newzealand"]);
    expect(r.qual[0].program).toMatch(/France|Ireland|New Zealand/);
  });
  it("typed country names work, several at once", () => {
    const d = mk(); start(d); tap(d, "26–35"); tap(d, "Bachelor's"); tap(d, "Not working"); tap(d, "No travel yet"); tap(d, "Never refused"); tap(d, "Visit / Tourism"); tap(d, "Just me"); say(d, "40"); tap(d, "Steady, built up slowly");
    say(d, "france, portugal and canada"); expect(d.ans.countries).toEqual(expect.arrayContaining(["france", "portugal", "canada"]));
  });
  it("'not sure' means Aiman looks at every country", () => {
    const d = mk(); start(d); tap(d, "26–35"); tap(d, "Bachelor's"); tap(d, "Not working"); tap(d, "No travel yet"); tap(d, "Never refused"); tap(d, "Visit / Tourism"); tap(d, "Just me"); say(d, "40"); tap(d, "Steady, built up slowly");
    pickCountries(d, ["any"]); expect(d.ans.countries).toEqual([]); expect(d.assessment().focus.length).toBeGreaterThanOrEqual(23);
  });
  it("all four purposes give a program name for every country", () => {
    for (const p of ["visit", "study", "work", "immigration"] as const) {
      const r = assessAll({ ...{ name: "A", age: "26–35" as const, edu: "bach" as const, travel: "west" as const, refusal: "never" as const, family: "alone" as const, balNum: 100, deposits: "steady" as const, english: "ok" as const, exp: "5plus" as const, offer: "yes" as const }, purposeKey: p, countries: [] });
      expect(r.all.length).toBeGreaterThanOrEqual(23); expect(r.all.every((x) => x.program.length > 5)).toBe(true);
    }
  });
  it("the server keeps phone and email from the answers and rejects invented countries", () => {
    const good = { name: "Ali", age: "26–35", edu: "bach", job: "salaried", salmode: "bank", travel: "west", refusal: "never", purpose: "visit", family: "alone", balNum: 20, deposits: "steady", phone: "03001234567", email: "A@B.com", countries: ["france", "ireland"] };
    const a = cleanAnswers(good)!; expect(a.phone).toBe("+923001234567"); expect(a.email).toBe("a@b.com"); expect(a.countries).toEqual(["france", "ireland"]);
    expect(cleanAnswers({ ...good, countries: ["france", "mars"] })).toBeNull();
    expect(leadText(a, DEFAULT_FUNDS).subject).toContain("France, Ireland");
  });
});

describe("after the result: ready to submit? checklist?", () => {
  it("asks 'ready to submit your case?', then 'do you want the checklist?', and hands over the checklist on yes", () => {
    const c = mk(); familyVisit(c); vi.advanceTimersByTime(600);
    expect(last(c)).toBe("Are you ready to submit your case?"); expect(c.chips.map((x) => x.en)).toEqual(["Yes, I'm ready", "Not yet"]);
    tap(c, "Yes, I'm ready"); vi.advanceTimersByTime(600);
    expect(c.items.map((b) => b.en).join(" ")).toMatch(/consultant will contact you on WhatsApp to start your file/);
    expect(last(c)).toBe("Do you want the checklist of documents?"); expect(c.docs).toBe(false);
    tap(c, "Yes, I'm ready"); // the same "yes" button
    expect(c.docs).toBe(true); expect(c.after).toBe("end"); expect(last(c)).toMatch(/consultant will send you the checklist on WhatsApp/); expect(c.ans.ready).toBe("yes"); expect(c.ans.wantsChecklist).toBe(true);
  });
  it("'not yet' and 'no, thanks' are fine; typing yes/no works too; editing an answer clears it", () => {
    const c = mk(); familyVisit(c); vi.advanceTimersByTime(600);
    say(c, "not yet"); vi.advanceTimersByTime(600); expect(last(c)).toBe("Do you want the checklist of documents?");
    say(c, "no"); expect(c.docs).toBe(false); expect(c.ans.wantsChecklist).toBe(false); expect(c.after).toBe("end");
    const idx = c.items.find((b) => b.who === "me" && b.en === "5")!.edit!; c.rewindTo(idx); vi.advanceTimersByTime(500);
    expect(c.after).toBeNull(); expect(c.finished).toBe(false);
  });
});
