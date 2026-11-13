// The file statuses the admin picks from a drop-down and the client sees under "Track my file".
// The same list is stored in the database (case_stage_templates, migration 0009) for every service type; the admin can add more in Client files.
// Keep this list and the migration in step: tests/case-stages.test.ts checks it.

export interface CaseStage { stage: string; en: string; ur: string }

export const CASE_STAGES: CaseStage[] = [
  { stage: "file_received", en: "File received", ur: "فائل موصول ہو گئی" },
  { stage: "docs_scrutinizing", en: "Documents being scrutinised", ur: "دستاویزات کی جانچ پڑتال جاری" },
  { stage: "docs_missing", en: "Documents missing", ur: "دستاویزات کم ہیں" },
  { stage: "reminder_sent", en: "Missing documents reminder sent", ur: "کم دستاویزات کی یاد دہانی بھیج دی گئی" },
  { stage: "missing_received", en: "Missing documents received", ur: "کم دستاویزات موصول ہو گئیں" },
  { stage: "case_preparation", en: "Case preparation", ur: "کیس کی تیاری" },
  { stage: "case_submission", en: "Case submission", ur: "کیس جمع کرانے کا عمل" },
  { stage: "case_submitted", en: "Case submitted", ur: "کیس جمع ہو گیا" },
  { stage: "awaiting_embassy", en: "Awaiting embassy answer", ur: "ایمبیسی کے جواب کا انتظار" },
  { stage: "approved", en: "Case approved", ur: "کیس منظور ہو گیا" },
  { stage: "refused", en: "Case refused", ur: "کیس مسترد ہو گیا" },
  { stage: "withdrawn", en: "Case withdrawn", ur: "کیس واپس لے لیا گیا" },
];

export const SERVICE_TYPES = ["visit", "study", "work", "immigration"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

/** Final results. Choosing one closes the case and records the decision. */
export const OUTCOMES = ["approved", "refused", "withdrawn"] as const;
export const isOutcome = (stage: string): stage is (typeof OUTCOMES)[number] => (OUTCOMES as readonly string[]).includes(stage);

/** Side steps: shown to the client in their timeline only while the file is on that step. */
export const BRANCH_STAGES = new Set(["docs_missing", "reminder_sent", "missing_received", "refused", "withdrawn"]);

/** A status name the admin types becomes its key: lower case, letters and numbers, underscores. */
export const stageKey = (label: string) => label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
