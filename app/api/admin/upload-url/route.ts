import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { serviceClient } from "@/lib/supabase";
import { docOwner, signUpload } from "@/lib/server/portal";

const schema = z.object({ doc_id: z.string().uuid().optional(), title: z.string().trim().min(2).max(120).optional(), person_id: z.string().uuid().optional(), mime: z.string().max(60), size: z.number().int().positive() });

/** A consultant adds a file for the client, for example one that arrived on WhatsApp. */
export async function POST(req: NextRequest) {
  const a = await getAdmin(); const db = serviceClient();
  if (!a || !db || !can.people(a.role)) return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ ok: false, error: "Please choose a file." }, { status: 422 });
  let docId = p.data.doc_id, ownerId = p.data.person_id;
  if (docId) {
    const found = await docOwner(db, docId);
    if (!found) return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
    ownerId = found.ownerId;
  } else {
    if (!ownerId || !p.data.title) return NextResponse.json({ ok: false, error: "Name the document first." }, { status: 422 });
    const { data: doc, error } = await db.from("case_documents").insert({ person_id: ownerId, title: p.data.title, required: false }).select("id").single();
    if (error || !doc) return NextResponse.json({ ok: false, error: "Could not add this document." }, { status: 500 });
    docId = doc.id as string;
  }
  const r = await signUpload(db, ownerId!, docId, p.data.mime, p.data.size);
  if ("error" in r) return NextResponse.json({ ok: false, error: r.error }, { status: 422 });
  return NextResponse.json({ ok: true, doc_id: docId, path: r.path, token: r.token });
}
