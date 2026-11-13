// Pure helpers for the client portal, so the rules can be unit-tested.
import { createHash, randomBytes } from "node:crypto";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Human-friendly code: no 0/O/1/I so it survives being read aloud or retyped. */
export function newCode(len = 10): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return [...randomBytes(len)].map((b) => abc[b % abc.length]).join("");
}
export const normCode = (c: string) => c.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
export const hashCode = (c: string) => createHash("sha256").update(normCode(c)).digest("hex");

export function uploadProblem(mime: string, size: number): string | null {
  if (!ALLOWED_MIME[mime]) return "Please choose a PDF, JPG, PNG or WebP file.";
  if (!Number.isFinite(size) || size <= 0) return "This file looks empty.";
  if (size > MAX_UPLOAD_BYTES) return "This file is bigger than 10 MB.";
  return null;
}

/** The file's first bytes must match the type it claims (a renamed web page or program is refused). */
export function looksLike(mime: string, b: Uint8Array): boolean {
  const at = (i: number, s: string) => s.split("").every((c, k) => b[i + k] === c.charCodeAt(0));
  switch (mime) {
    case "application/pdf": return at(0, "%PDF");
    case "image/jpeg": return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/png": return b[0] === 0x89 && at(1, "PNG");
    case "image/webp": return at(0, "RIFF") && at(8, "WEBP");
    default: return false;
  }
}

/** Strips paths and odd characters. The name is only ever a download label, never a storage path. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const clean = base.replace(/[^\p{L}\p{N}._ -]/gu, "").replace(/\.{2,}/g, ".").trim().slice(-120);
  return clean || "file";
}

/** A storage path belongs to this person and this document only if it has exactly their prefix. */
export const pathFor = (personId: string, docId: string, uuid: string, mime: string) => `${personId}/${docId}/${uuid}.${ALLOWED_MIME[mime]}`;
export const pathIsTheirs = (path: string, personId: string, docId: string) => {
  const parts = path.split("/");
  return parts.length === 3 && parts[0] === personId && parts[1] === docId && !parts[2].includes("..") && /^[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/.test(parts[2]);
};

export type DocStatus = "missing" | "uploaded" | "approved" | "rejected";
/** A client may replace a file until the consultant has approved it. */
export const clientMayUpload = (s: DocStatus) => s !== "approved";
