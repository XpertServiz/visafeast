// Zero-cost refusal decoder: keyword rules -> pre-written explanations (brief §8.4). Editable later in Admin → FAQs ("Decoder answers").
export interface Point { heading: string; meaning: string; fix: string }

interface Rule { id: string; keywords: RegExp; en: Point; ur: Point }
const RULES: Rule[] = [
  { id: "funds", keywords: /(funds|financ|bank|source of (money|income)|sufficient (money|means)|maintain|savings|deposit)/i,
    en: { heading: "Funds or source of money", meaning: "The officer was not satisfied that you have enough money for the trip, or that the money's source is clear.", fix: "Show 6 months of statements with a steady balance, explain any large deposits with documents, and match funds to your income." },
    ur: { heading: "رقم یا رقم کا ذریعہ", meaning: "افسر مطمئن نہیں ہوا کہ سفر کے لیے کافی رقم ہے یا رقم کا ذریعہ واضح ہے۔", fix: "6 ماہ کی اسٹیٹمنٹ، بڑی رقوم کی دستاویزی وضاحت، اور آمدن کے مطابق رقم دکھائیں۔" } },
  { id: "ties", keywords: /(\bties\b|return (to )?(your )?(home|country|pakistan)|leave (the )?(uk|country|canada|schengen)|intention to (return|depart)|not satisfied that you (will|intend))/i,
    en: { heading: "Ties to Pakistan", meaning: "The officer was not convinced you will return home after your visit.", fix: "Show job or business, family, property and other reasons that connect you to Pakistan, plus a clear return plan." },
    ur: { heading: "پاکستان سے تعلق", meaning: "افسر کو یقین نہیں آیا کہ آپ سفر کے بعد واپس آئیں گے۔", fix: "ملازمت یا کاروبار، خاندان، جائیداد اور دیگر تعلقات اور واپسی کا واضح منصوبہ دکھائیں۔" } },
  { id: "purpose", keywords: /(purpose|itinerary|travel plan|reason for (your )?(visit|travel|trip)|genuine visitor|bona fide)/i,
    en: { heading: "Purpose of the trip", meaning: "The officer was not clear about why you are travelling or whether it is a genuine visit.", fix: "Give a clear day-by-day travel plan and a short cover letter explaining who, where, why and for how long." },
    ur: { heading: "سفر کا مقصد", meaning: "افسر پر سفر کا مقصد یا اس کی حقیقت واضح نہیں ہوئی۔", fix: "روزانہ کا واضح سفری منصوبہ اور مختصر کور لیٹر دیں جس میں کون، کہاں، کیوں اور کتنے دن لکھے ہوں۔" } },
  { id: "credibility", keywords: /(credib|inconsisten|discrepan|false|fraud|misrepresent|deception|genuineness|doubt|not (genuine|authentic)|forged)/i,
    en: { heading: "Credibility or inconsistent information", meaning: "Some details did not match across your documents, or the officer doubted the information.", fix: "Check every date, job title and amount for consistency. If the letter mentions deception, a ban or false documents, speak to a consultant or lawyer before doing anything." },
    ur: { heading: "اعتبار یا غیر مطابق معلومات", meaning: "دستاویزات میں کچھ تفصیلات مختلف تھیں یا افسر کو معلومات پر شک ہوا۔", fix: "ہر تاریخ، عہدہ اور رقم کو چیک کریں۔ اگر خط میں دھوکے، پابندی یا جعلی دستاویز کا ذکر ہو تو کچھ کرنے سے پہلے کنسلٹنٹ یا وکیل سے بات کریں۔" } },
  { id: "history", keywords: /(previous|prior|history|earlier (refus|application)|overstay|immigration history|travel history)/i,
    en: { heading: "Previous travel or immigration history", meaning: "Your past travel or earlier applications influenced the decision.", fix: "Be honest about earlier refusals, explain what has changed, and show clean, consistent travel history where you have it." },
    ur: { heading: "سابقہ سفر یا امیگریشن ہسٹری", meaning: "آپ کے پچھلے سفر یا پرانی درخواستوں نے فیصلے پر اثر ڈالا۔", fix: "پچھلے انکار کے بارے میں ایمانداری سے بتائیں، کیا بدلا ہے وہ واضح کریں، اور صاف سفری ہسٹری دکھائیں۔" } },
  { id: "documents", keywords: /(insufficient (document|evidence)|(did not|failed to) (provide|submit) (the )?(required |requested |supporting )?(document|evidence|information)|missing document|supporting document)/i,
    en: { heading: "Missing or insufficient documents", meaning: "The documents you sent did not prove what the application needed to show.", fix: "Use the official document list, add what was missing, and explain each document in the cover letter." },
    ur: { heading: "دستاویزات کی کمی", meaning: "آپ کی دستاویزات وہ بات ثابت نہیں کر سکیں جو درخواست کو درکار تھی۔", fix: "سرکاری دستاویزی فہرست استعمال کریں، کمی پوری کریں، اور کور لیٹر میں ہر دستاویز کی وضاحت کریں۔" } },
];

const SENSITIVE = /(ban|deception|false (document|information)|forged|appeal|deport|re-?entry)/i;

/** Client + server scrub of obvious identifiers (GWF/application numbers, passports, emails, phones). */
export function scrub(text: string): string {
  return text
    .replace(/\b(GWF|IMM|VAF|CAS|TRN|UCI)[-\s]?\d[\w-]{5,}\b/gi, "[reference removed]")
    .replace(/\b[A-Z]{2}\d{7}\b/g, "[passport removed]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email removed]")
    .replace(/(\+?\d[\d\s().-]{8,}\d)/g, "[number removed]")
    .replace(/\b\d{5}-\d{7}-\d\b/g, "[ID removed]");
}

export function decodeByRules(text: string, lang: "en" | "ur") {
  const hits = RULES.filter((r) => r.keywords.test(text));
  const points = (hits.length ? hits : []).map((r) => ({ ...r[lang], id: r.id }));
  const sensitive = SENSITIVE.test(text);
  const honest = lang === "ur"
    ? sensitive ? "آپ کے خط میں حساس نکات ہیں۔ دوبارہ درخواست دینے سے پہلے براہ کرم کنسلٹنٹ یا وکیل سے بات کریں۔" : points.length ? "پہلے ہر نکتہ ٹھیک کریں، پھر دوبارہ درخواست دیں۔ ایک ہی فائل دوبارہ جمع کرنے سے فیس ضائع ہوتی ہے۔" : "ہم خط میں واضح وجوہات شناخت نہیں کر سکے۔ مفت فائل ریویو میں کنسلٹنٹ آپ کا خط دیکھ سکتا ہے۔"
    : sensitive ? "Your letter mentions sensitive points. Please speak to a consultant or lawyer before you do anything or re-apply." : points.length ? "Fix each point first, then re-apply. Sending the same file again wastes the fee and adds another refusal to your history." : "We could not identify clear reasons from this text. A consultant can read your letter in a free file review.";
  return { points, honest_view: honest, language: lang === "ur" ? "Urdu" : "English", mode: "rules" as const };
}
