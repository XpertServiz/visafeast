// Eligibility checker scoring (brief §8.1). Max 13. >=10 STRONG, 6-9 MODERATE, <6 NEEDS WORK.
export interface Q { id: string; en: string; ur: string; opts: { en: string; ur: string; pts: number }[] }

export const QUESTIONS: Q[] = [
  { id: "dest", en: "Where do you want to go?", ur: "آپ کہاں جانا چاہتے ہیں؟", opts: [
    { en: "United Kingdom", ur: "یوکے", pts: 0 }, { en: "Canada or USA", ur: "کینیڈا یا امریکہ", pts: 0 }, { en: "Schengen / Europe", ur: "شینگن / یورپ", pts: 0 },
    { en: "Australia or New Zealand", ur: "آسٹریلیا یا نیوزی لینڈ", pts: 0 }, { en: "Asia (Thailand, Baku, Singapore)", ur: "ایشیا (تھائی لینڈ، باکو، سنگاپور)", pts: 0 }, { en: "Study abroad", ur: "بیرون ملک تعلیم", pts: 0 } ] },
  { id: "purpose", en: "What is the main purpose?", ur: "سفر کا بنیادی مقصد؟", opts: [
    { en: "Tourism", ur: "سیر و سیاحت", pts: 1 }, { en: "Visiting family", ur: "رشتہ داروں سے ملنا", pts: 1 }, { en: "Business", ur: "کاروبار", pts: 1 }, { en: "Study", ur: "تعلیم", pts: 1 } ] },
  { id: "travel", en: "Travel in the last 5 years?", ur: "پچھلے 5 سال میں سفر؟", opts: [
    { en: "UK / USA / Canada / Schengen / Australia", ur: "یوکے / امریکہ / کینیڈا / شینگن / آسٹریلیا", pts: 3 }, { en: "Gulf / Turkey / Malaysia or similar", ur: "خلیج / ترکی / ملائیشیا وغیرہ", pts: 2 }, { en: "None", ur: "کوئی نہیں", pts: 0 } ] },
  { id: "work", en: "What do you do?", ur: "آپ کیا کرتے ہیں؟", opts: [
    { en: "Salaried, with payslips", ur: "ملازم، تنخواہ کی سلپ کے ساتھ", pts: 3 }, { en: "Business owner, with tax returns", ur: "کاروباری، ٹیکس ریٹرن کے ساتھ", pts: 3 },
    { en: "Student / homemaker with a sponsor", ur: "طالب علم / گھریلو، اسپانسر کے ساتھ", pts: 1 }, { en: "Not working, no sponsor", ur: "ملازمت نہیں، اسپانسر نہیں", pts: 0 } ] },
  { id: "bank", en: "Your last 6 months of bank statements?", ur: "پچھلے 6 ماہ کی بینک اسٹیٹمنٹ؟", opts: [
    { en: "Regular income, steady balance", ur: "باقاعدہ آمدن، مستحکم بیلنس", pts: 3 }, { en: "Sponsor's account", ur: "اسپانسر کا اکاؤنٹ", pts: 1 }, { en: "Large recent deposit", ur: "حال ہی میں بڑی رقم جمع ہوئی", pts: 0 } ] },
  { id: "refusal", en: "Visa refused before?", ur: "پہلے ویزا انکار ہوا؟", opts: [
    { en: "Never", ur: "کبھی نہیں", pts: 3 }, { en: "Once", ur: "ایک بار", pts: 1 }, { en: "More than once", ur: "ایک سے زیادہ بار", pts: 0 } ] },
];

export const MAX_SCORE = 13;
export type Band = "strong" | "moderate" | "needs";
export const bandOf = (score: number): Band => (score >= 10 ? "strong" : score >= 6 ? "moderate" : "needs");

export function score(answers: number[]): number {
  return answers.reduce((sum, a, i) => sum + (QUESTIONS[i]?.opts[a]?.pts ?? 0), 0);
}
