// Keeps client documents inside Supabase's FREE storage (1 GB). Rules: a file is removed 60 days after it was uploaded
// (the admin downloads it before that), uploads pause when the stored total would pass the cap, and the owner is warned in good time.
// Pure functions so the rules can be unit-tested.

export const KEEP_DAYS = 60;
export const WARN_DAYS = 7;
/** Free plan is 1 GB; stop at 900 MB so there is always room. Change with STORAGE_CAP_MB in the environment. */
export const capBytes = (env: string | undefined = process.env.STORAGE_CAP_MB) => Math.max(50, Number(env) || 900) * 1024 * 1024;

const DAY = 86_400_000;
/** Whole days left before a file uploaded at `uploadedAt` is removed (0 or less: due now). */
export const daysLeft = (uploadedAt: string | Date, now = new Date()) => Math.ceil(KEEP_DAYS - (now.getTime() - new Date(uploadedAt).getTime()) / DAY);
export const isDue = (uploadedAt: string | Date, now = new Date()) => daysLeft(uploadedAt, now) <= 0;
/** True on the one day when a file has exactly a week left, so each file is announced once. */
export const warnToday = (uploadedAt: string | Date, now = new Date()) => daysLeft(uploadedAt, now) === WARN_DAYS;
export const uploadAllowed = (usedBytes: number, newBytes: number, cap = capBytes()) => usedBytes + newBytes <= cap;
export const usedPercent = (usedBytes: number, cap = capBytes()) => Math.min(100, Math.round((usedBytes / cap) * 100));
export const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes > 100 * 1024 * 1024 ? 0 : 1)} MB`;
/** A document whose file was removed by the clean-up (its row stays so the history is kept). */
export const wasRemoved = (d: { file_path: string | null; uploaded_at: string | null }) => !d.file_path && Boolean(d.uploaded_at);
