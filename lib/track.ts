// Client file tracker helpers (brief §9A.2). Pure functions so they can be unit-tested.
import { BRANCH_STAGES } from "./case-stages";
export const normRef = (v: string) => v.trim().toUpperCase().replace(/\s+/g, "");
export const validRef = (v: string) => /^VF-\d{3,7}$/.test(normRef(v));
export const digits = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");
export const last4Matches = (phone: string | null | undefined, typed: string) => {
  const d = digits(phone), t = digits(typed);
  return t.length === 4 && d.length >= 4 && d.endsWith(t);
};

/** Plain-language "what happens next" per stage — process descriptions only, never facts about fees or timings. */
const NEXT: Record<string, { en: string; ur: string }> = {
  file_received: { en: "We have received your file. We will start checking your documents.", ur: "ہمیں آپ کی فائل مل گئی ہے۔ ہم آپ کی دستاویزات کی جانچ شروع کریں گے۔" },
  docs_scrutinizing: { en: "We are checking your documents carefully.", ur: "ہم آپ کی دستاویزات کی احتیاط سے جانچ کر رہے ہیں۔" },
  docs_missing: { en: "Some documents are missing. Please upload them here, or ask your consultant which ones.", ur: "کچھ دستاویزات کم ہیں۔ براہ کرم انہیں یہاں اپ لوڈ کریں، یا اپنے کنسلٹنٹ سے پوچھیں کون سی۔" },
  reminder_sent: { en: "We sent you a reminder about the missing documents. Please upload them as soon as you can.", ur: "ہم نے آپ کو کم دستاویزات کی یاد دہانی بھیجی ہے۔ براہ کرم جلد از جلد انہیں اپ لوڈ کریں۔" },
  missing_received: { en: "We received the missing documents and are checking them.", ur: "ہمیں کم دستاویزات مل گئی ہیں اور ہم انہیں چیک کر رہے ہیں۔" },
  case_preparation: { en: "Your consultant is preparing your case.", ur: "آپ کا کنسلٹنٹ آپ کا کیس تیار کر رہا ہے۔" },
  case_submission: { en: "We are submitting your case.", ur: "ہم آپ کا کیس جمع کرا رہے ہیں۔" },
  case_submitted: { en: "Your case is submitted. We are waiting for the next step from the embassy or visa centre.", ur: "آپ کا کیس جمع ہو چکا ہے۔ ہم ایمبیسی یا ویزا سینٹر کے اگلے مرحلے کا انتظار کر رہے ہیں۔" },
  awaiting_embassy: { en: "We are waiting for the embassy's answer. We will tell you as soon as we hear.", ur: "ہم ایمبیسی کے جواب کا انتظار کر رہے ہیں۔ جیسے ہی پتہ چلے گا آپ کو بتائیں گے۔" },
  approved: { en: "Your case is approved. Your consultant will explain the next steps.", ur: "آپ کا کیس منظور ہو گیا ہے۔ آپ کا کنسلٹنٹ اگلے مراحل سمجھائے گا۔" },
  refused: { en: "Your case was refused. Your consultant will explain why and what you can do next.", ur: "آپ کا کیس مسترد ہو گیا ہے۔ آپ کا کنسلٹنٹ وجہ اور اگلے اقدامات سمجھائے گا۔" },
  withdrawn: { en: "This case was withdrawn.", ur: "یہ کیس واپس لے لیا گیا ہے۔" },
  new: { en: "We will contact you on WhatsApp to understand your plan.", ur: "ہم آپ کے منصوبے کو سمجھنے کے لیے واٹس ایپ پر رابطہ کریں گے۔" },
  docs_requested: { en: "Please send us the documents we asked for.", ur: "براہ کرم مانگی گئی دستاویزات ہمیں بھیجیں۔" },
  docs_received: { en: "We are checking your documents.", ur: "ہم آپ کی دستاویزات چیک کر رہے ہیں۔" },
  review: { en: "Your consultant is reviewing your file.", ur: "آپ کا کنسلٹنٹ آپ کی فائل کا جائزہ لے رہا ہے۔" },
  submitted: { en: "Your application is submitted. We are waiting for the next step from the embassy or visa centre.", ur: "آپ کی درخواست جمع ہو چکی ہے۔ ہم ایمبیسی یا ویزا سینٹر کے اگلے مرحلے کا انتظار کر رہے ہیں۔" },
  biometrics: { en: "Attend your biometrics appointment. Your consultant will confirm the details.", ur: "اپنی بایومیٹرکس اپائنٹمنٹ پر جائیں۔ آپ کا کنسلٹنٹ تفصیل بتائے گا۔" },
  decision: { en: "A decision has been made. Your consultant will explain it to you.", ur: "فیصلہ ہو چکا ہے۔ آپ کا کنسلٹنٹ آپ کو سمجھائے گا۔" },
  assessment: { en: "We are assessing your options.", ur: "ہم آپ کے آپشنز کا جائزہ لے رہے ہیں۔" },
  agreement: { en: "Please review and sign the agreement.", ur: "براہ کرم معاہدہ دیکھ کر دستخط کریں۔" },
  documents: { en: "Please send us the documents we asked for.", ur: "براہ کرم مانگی گئی دستاویزات ہمیں بھیجیں۔" },
  filed: { en: "Your file has been filed by our licensed partner.", ur: "آپ کی فائل ہمارے لائسنس یافتہ پارٹنر نے جمع کرا دی ہے۔" },
  in_process: { en: "Your case is in process. We will update you when something changes.", ur: "آپ کا کیس کارروائی میں ہے۔ کوئی تبدیلی ہوئی تو ہم آپ کو بتائیں گے۔" },
  closed: { en: "Your file is closed. Thank you for choosing Visafeast.", ur: "آپ کی فائل بند ہو چکی ہے۔ ویزا فیسٹ کا انتخاب کرنے کا شکریہ۔" },
};
export const nextStep = (stage: string, locale: "en" | "ur") => (NEXT[stage] ?? NEXT.new)[locale];

export interface TrackStage { stage: string; label: string; state: "done" | "current" | "todo" }
export function buildTimeline(templates: { stage: string; label_en: string; label_ur: string; sort: number }[], current: string, locale: "en" | "ur"): TrackStage[] {
  // side steps (missing documents, refused, withdrawn) show only while the file is on that step
  const sorted = [...templates].sort((a, b) => a.sort - b.sort).filter((t) => !BRANCH_STAGES.has(t.stage) || t.stage === current);
  const idx = sorted.findIndex((t) => t.stage === current);
  return sorted.map((t, i) => ({ stage: t.stage, label: (locale === "ur" ? t.label_ur : t.label_en) || t.label_en, state: idx < 0 ? "todo" : i < idx ? "done" : i === idx ? "current" : "todo" }));
}
