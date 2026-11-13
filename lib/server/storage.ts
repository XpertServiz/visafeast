import "server-only";
import { serviceClient } from "../supabase";
import { BUCKET } from "./portal";
import { KEEP_DAYS, capBytes, isDue, mb, usedPercent, warnToday, WARN_DAYS } from "../storage-policy";
import { esc, notifyOwner } from "./notify";
import { siteConfig } from "@/config/site";

type Db = NonNullable<ReturnType<typeof serviceClient>>;

/** Bytes of client files now stored (sum of the recorded sizes). */
export async function storageUsed(db: Db): Promise<number> {
  const { data } = await db.from("case_documents").select("size_bytes").not("file_path", "is", null).limit(20000);
  return (data ?? []).reduce((s, r) => s + Number(r.size_bytes ?? 0), 0);
}

interface Row { id: string; title: string; file_path: string; file_name: string | null; uploaded_at: string; person: { full_name: string | null } | null; case: { ref: string; person: { full_name: string | null } | null } | null }
const who = (r: Row) => r.person?.full_name ?? r.case?.person?.full_name ?? "a client";
const line = (r: Row) => `<li>${esc(who(r))}${r.case ? ` (${esc(r.case.ref)})` : ""}: ${esc(r.title)}${r.file_name ? ` · ${esc(r.file_name)}` : ""}</li>`;

/**
 * The daily clean-up: removes every client file 60 days after upload (the row stays, marked as removed by having no file),
 * warns the owner a week before, and warns when storage passes 80% of the cap. Never throws.
 */
export async function storageMaintenance(db: Db, now = new Date()): Promise<{ removed: number; warned: number; usedBytes: number; percent: number }> {
  const { data } = await db.from("case_documents")
    .select("id,title,file_path,file_name,uploaded_at,person:people(full_name),case:cases(ref,person:people(full_name))")
    .not("file_path", "is", null).not("uploaded_at", "is", null).limit(2000);
  const rows = (data ?? []) as unknown as Row[];

  const due = rows.filter((r) => isDue(r.uploaded_at, now));
  let removed = 0;
  for (let i = 0; i < due.length; i += 100) {
    const part = due.slice(i, i + 100);
    const { error } = await db.storage.from(BUCKET).remove(part.map((r) => r.file_path));
    if (error) continue;
    await db.from("case_documents").update({ file_path: null, mime: null, size_bytes: null }).in("id", part.map((r) => r.id));
    removed += part.length;
  }
  if (removed) await notifyOwner(`${removed} client file(s) removed to save space`, `<p>Client files are removed ${KEEP_DAYS} days after upload to keep storage free. Removed today:</p><ul>${due.slice(0, 50).map(line).join("")}</ul><p>The client list and history stay in <a href="${esc(siteConfig.url)}/admin/cases">Client files</a>; only the files are gone.</p>`);

  const soon = rows.filter((r) => warnToday(r.uploaded_at, now));
  if (soon.length) await notifyOwner(`Download these client files: removed in ${WARN_DAYS} days`, `<p>These files will be removed automatically in ${WARN_DAYS} days. Please download what you need from <a href="${esc(siteConfig.url)}/admin/cases/documents">Documents by file</a>.</p><ul>${soon.slice(0, 50).map(line).join("")}</ul>`);

  const usedBytes = await storageUsed(db);
  const percent = usedPercent(usedBytes);
  if (percent >= 80) await notifyOwner(`Storage is ${percent}% full`, `<p>Client files use ${mb(usedBytes)} of the ${mb(capBytes())} limit. Uploads pause at 100%. Download and clear files in <a href="${esc(siteConfig.url)}/admin/cases/documents">Documents by file</a>.</p>`);
  return { removed, warned: soon.length, usedBytes, percent };
}
