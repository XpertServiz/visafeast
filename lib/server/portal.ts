import "server-only";
import { randomUUID } from "node:crypto";
import { authClient } from "./admin-auth";
import { serviceClient } from "../supabase";
import { looksLike, pathFor, pathIsTheirs, safeFileName, uploadProblem } from "../portal";
import { SERVICE_TYPES, type ServiceType } from "../case-stages";

export type Db = NonNullable<ReturnType<typeof serviceClient>>;
export const BUCKET = "case-documents";
export interface Person { id: string; full_name: string | null; whatsapp: string | null; email: string | null; language: string | null }
export interface PortalClient { userId: string; email: string | undefined; person: Person }

/** The signed-in client and their person record, always re-verified on the server. Null if not signed in or not a client. */
export async function getClient(): Promise<PortalClient | null> {
  const c = await authClient();
  const db = serviceClient();
  if (!c || !db) return null;
  const { data: { user } } = await c.auth.getUser();
  if (!user) return null;
  const { data: p } = await db.from("people").select("id,full_name,whatsapp,email,language,portal_status").eq("auth_user_id", user.id).is("deleted_at", null).maybeSingle();
  // a sign-up the admin has not approved yet (or turned down) cannot use the portal
  if (!p || p.portal_status === "pending" || p.portal_status === "rejected") return null;
  return { userId: user.id, email: user.email, person: p as Person };
}

/** What a signed-in login is waiting for, so the sign-in page can say "waiting for approval". */
export async function portalStatusFor(db: Db, userId: string): Promise<"approved" | "pending" | "rejected" | null> {
  const { data } = await db.from("people").select("portal_status").eq("auth_user_id", userId).is("deleted_at", null).maybeSingle();
  if (!data) return null;
  return (data.portal_status as "pending" | "rejected" | null) ?? "approved";
}

/**
 * The client's file. The first document a client uploads opens their file and gives them their Client ID (a case reference like VF-1042),
 * which they use under "Track my file". Later uploads go into the same file.
 */
export async function ensureCase(db: Db, personId: string, service: string): Promise<{ id: string; ref: string; created: boolean } | null> {
  const { data: have } = await db.from("cases").select("id,ref").eq("person_id", personId).is("deleted_at", null).order("created_at", { ascending: false }).limit(1);
  if (have?.[0]) return { id: have[0].id as string, ref: have[0].ref as string, created: false };
  const kind = SERVICE_TYPES.includes(service as ServiceType) ? service : "visit";
  const { data: ref } = await db.rpc("next_case_ref");
  if (!ref) return null;
  const { data: c, error } = await db.from("cases").insert({ ref, person_id: personId, service_type: kind, stage: "file_received" }).select("id,ref").single();
  if (error || !c) return null;
  await db.from("people").update({ is_client: true }).eq("id", personId);
  await db.from("timeline_events").insert({ person_id: personId, case_id: c.id, kind: "stage_change", body: `File ${c.ref} opened by the client's first upload` });
  return { id: c.id as string, ref: c.ref as string, created: true };
}

export interface DocRow { id: string; title: string; status: string; case_id: string | null; person_id: string | null; file_path: string | null; file_name: string | null; review_note: string | null }

/** Finds the person a document belongs to: directly, or through its case. Null when the document does not exist. */
export async function docOwner(db: Db, id: string): Promise<{ doc: DocRow; ownerId: string } | null> {
  const { data: doc } = await db.from("case_documents").select("id,title,status,case_id,person_id,file_path,file_name,review_note").eq("id", id).maybeSingle();
  if (!doc) return null;
  if (doc.person_id) return { doc: doc as DocRow, ownerId: doc.person_id };
  if (!doc.case_id) return null;
  const { data: c } = await db.from("cases").select("person_id").eq("id", doc.case_id).maybeSingle();
  return c ? { doc: doc as DocRow, ownerId: c.person_id } : null;
}

/** Issues a one-file upload ticket. The browser sends the file straight to private storage, so size is not limited by the web server. */
export async function signUpload(db: Db, ownerId: string, docId: string, mime: string, size: number) {
  const problem = uploadProblem(mime, size);
  if (problem) return { error: problem } as const;
  const path = pathFor(ownerId, docId, randomUUID(), mime);
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: "Could not start the upload. Please try again." } as const;
  return { path, token: data.token } as const;
}

/** Records a finished upload after checking the file really is in storage, then removes any older file for this document. */
export async function finishUpload(db: Db, args: { ownerId: string; doc: DocRow; path: string; fileName: string; by: "client" | "staff" }): Promise<string | null> {
  const { ownerId, doc, path, fileName, by } = args;
  if (!pathIsTheirs(path, ownerId, doc.id)) return "This upload does not match your file.";
  const dir = path.slice(0, path.lastIndexOf("/")), name = path.slice(path.lastIndexOf("/") + 1);
  const { data: found } = await db.storage.from(BUCKET).list(dir, { search: name, limit: 1 });
  const obj = found?.find((f) => f.name === name);
  if (!obj) return "We could not find the uploaded file. Please try again.";
  const meta = (obj.metadata ?? {}) as { size?: number; mimetype?: string };
  const problem = uploadProblem(meta.mimetype ?? "", Number(meta.size ?? 0));
  if (problem) { await db.storage.from(BUCKET).remove([path]); return problem; }
  const { data: blob } = await db.storage.from(BUCKET).download(path);
  const head = blob ? new Uint8Array(await blob.slice(0, 16).arrayBuffer()) : new Uint8Array();
  if (!looksLike(meta.mimetype ?? "", head)) { await db.storage.from(BUCKET).remove([path]); return "This file does not look like a real PDF or picture. Please choose another file."; }
  const { error } = await db.from("case_documents").update({
    file_path: path, file_name: safeFileName(fileName), mime: meta.mimetype, size_bytes: meta.size, uploaded_by: by, uploaded_at: new Date().toISOString(),
    status: by === "staff" ? "approved" : "uploaded", received: by === "staff", review_note: null,
  }).eq("id", doc.id);
  if (error) return "Could not save the file. Please try again.";
  if (doc.file_path && doc.file_path !== path) await db.storage.from(BUCKET).remove([doc.file_path]);
  await db.from("timeline_events").insert({ person_id: ownerId, case_id: doc.case_id, kind: "document", body: `${by === "client" ? "Client uploaded" : "Consultant added"}: ${doc.title}` });
  return null;
}

/** A short-lived private link. Always downloads rather than opening inline, so an uploaded file can never run in our site. */
export async function signedDownload(db: Db, doc: DocRow): Promise<string | null> {
  if (!doc.file_path) return null;
  const { data } = await db.storage.from(BUCKET).createSignedUrl(doc.file_path, 300, { download: doc.file_name || true });
  return data?.signedUrl ?? null;
}

export interface Msg { id: number; sender: "client" | "staff"; body: string; created_at: string }
export async function readMessages(db: Db, personId: string, after = 0, limit = 100): Promise<Msg[]> {
  const { data } = await db.from("client_messages").select("id,sender,body,created_at").eq("person_id", personId).gt("id", after).order("id", { ascending: false }).limit(limit);
  return ((data ?? []) as Msg[]).reverse();
}

/** Files the client has uploaded since the last time they pressed "Send to consultant". */
export async function pendingFiles(db: Db, personId: string) {
  const [{ data: last }, { data: cs }] = await Promise.all([
    db.from("timeline_events").select("ts").eq("person_id", personId).eq("kind", "client_submit").order("ts", { ascending: false }).limit(1).maybeSingle(),
    db.from("cases").select("id").eq("person_id", personId),
  ]);
  const ids = (cs ?? []).map((c) => c.id as string);
  let q = db.from("case_documents").select("id,title,file_name").eq("uploaded_by", "client").not("file_path", "is", null).or(ids.length ? `person_id.eq.${personId},case_id.in.(${ids.join(",")})` : `person_id.eq.${personId}`);
  if (last?.ts) q = q.gt("uploaded_at", last.ts);
  const { data } = await q.limit(100);
  return (data ?? []) as { id: string; title: string; file_name: string | null }[];
}
