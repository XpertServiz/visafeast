import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/server/guard";
import { serviceClient } from "@/lib/supabase";
import { docOwner, getClient, signUpload } from "@/lib/server/portal";
import { clientMayUpload, type DocStatus } from "@/lib/portal";

const schema = z.object({ doc_id: z.string().uuid().optional(), title: z.string().trim().min(2).max(120).optional(), mime: z.string().max(60), size: z.number().int().positive() });

export async function POST(req: NextRequest) {
  const me = await getClient(); const db = serviceClient();
  if (!me || !db) return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success || (!p.data.doc_id && !p.data.title)) return NextResponse.json({ ok: false, error: "Please choose a document and a file." }, { status: 422 });
  if (!(await rateLimit(`pup:${me.person.id}`, 40, 3600_000))) return NextResponse.json({ ok: false, error: "Too many uploads. Please wait a little." }, { status: 429 });

  let docId = p.data.doc_id;
  if (docId) {
    const found = await docOwner(db, docId);
    if (!found || found.ownerId !== me.person.id) return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
    if (!clientMayUpload(found.doc.status as DocStatus)) return NextResponse.json({ ok: false, error: "Your consultant has already approved this document." }, { status: 409 });
  } else {
    const { data: doc, error } = await db.from("case_documents").insert({ person_id: me.person.id, title: p.data.title, required: false }).select("id").single();
    if (error || !doc) return NextResponse.json({ ok: false, error: "Could not add this document." }, { status: 500 });
    docId = doc.id as string;
  }
  const r = await signUpload(db, me.person.id, docId, p.data.mime, p.data.size);
  if ("error" in r) return NextResponse.json({ ok: false, error: r.error }, { status: 422 });
  return NextResponse.json({ ok: true, doc_id: docId, path: r.path, token: r.token });
}
