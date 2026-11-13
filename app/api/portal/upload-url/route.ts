import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/server/guard";
import { serviceClient } from "@/lib/supabase";
import { docOwner, ensureCase, getClient, signUpload } from "@/lib/server/portal";
import { storageUsed } from "@/lib/server/storage";
import { mb, uploadAllowed } from "@/lib/storage-policy";
import { esc, notifyOwner } from "@/lib/server/notify";
import { siteConfig } from "@/config/site";
import { clientMayUpload, type DocStatus } from "@/lib/portal";

const schema = z.object({ doc_id: z.string().uuid().optional(), title: z.string().trim().min(2).max(120).optional(), service: z.enum(["visit", "study", "work", "immigration"]).optional(), mime: z.string().max(60), size: z.number().int().positive() });

export async function POST(req: NextRequest) {
  const me = await getClient(); const db = serviceClient();
  if (!me || !db) return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success || (!p.data.doc_id && !p.data.title)) return NextResponse.json({ ok: false, error: "Please choose a document and a file." }, { status: 422 });
  if (!(await rateLimit(`pup:${me.person.id}`, 40, 3600_000))) return NextResponse.json({ ok: false, error: "Too many uploads. Please wait a little." }, { status: 429 });

  // free-storage cap: pause uploads before the free plan is full, and tell the owner (at most once a day)
  const used = await storageUsed(db);
  if (!uploadAllowed(used, p.data.size)) {
    if (await rateLimit(`storage-full:${new Date().toISOString().slice(0, 10)}`, 1, 86400_000)) void notifyOwner("Uploads paused: storage is full", `<p>Client files use ${esc(mb(used))}. Uploads are paused until space is freed. Download and clear files in <a href="${esc(siteConfig.url)}/admin/cases/documents">Documents by file</a>.</p>`);
    return NextResponse.json({ ok: false, error: "Uploads are paused for a short while. Please send your documents on WhatsApp or try again tomorrow." }, { status: 503 });
  }
  let docId = p.data.doc_id;
  let clientId: string | undefined;
  if (docId) {
    const found = await docOwner(db, docId);
    if (!found || found.ownerId !== me.person.id) return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
    if (!clientMayUpload(found.doc.status as DocStatus)) return NextResponse.json({ ok: false, error: "Your consultant has already approved this document." }, { status: 409 });
  } else {
    // the first upload opens the client's file and gives them their Client ID
    const file = await ensureCase(db, me.person.id, p.data.service ?? "visit");
    if (!file) return NextResponse.json({ ok: false, error: "Could not open your file. Please try again." }, { status: 500 });
    const { data: doc, error } = await db.from("case_documents").insert({ person_id: me.person.id, case_id: file.id, title: p.data.title, required: false }).select("id").single();
    if (error || !doc) return NextResponse.json({ ok: false, error: "Could not add this document." }, { status: 500 });
    docId = doc.id as string;
    clientId = file.ref;
    if (file.created) void notifyOwner(`New client file ${file.ref}: ${me.person.full_name}`, `<p><b>${esc(me.person.full_name)}</b> uploaded a first document, so file <b>${esc(file.ref)}</b> (${esc(p.data.service ?? "visit")}) was opened. <a href="${esc(siteConfig.url)}/admin/cases/${esc(file.ref)}">Open the file</a>.</p>`);
  }
  const r = await signUpload(db, me.person.id, docId, p.data.mime, p.data.size);
  if ("error" in r) return NextResponse.json({ ok: false, error: r.error }, { status: 422 });
  return NextResponse.json({ ok: true, doc_id: docId, path: r.path, token: r.token, client_id: clientId });
}
