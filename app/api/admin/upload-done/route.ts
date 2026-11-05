import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { serviceClient } from "@/lib/supabase";
import { docOwner, finishUpload } from "@/lib/server/portal";

const schema = z.object({ doc_id: z.string().uuid(), path: z.string().max(200), file_name: z.string().max(300) });

export async function POST(req: NextRequest) {
  const a = await getAdmin(); const db = serviceClient();
  if (!a || !db || !can.people(a.role)) return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ ok: false, error: "Upload details are not valid." }, { status: 422 });
  const found = await docOwner(db, p.data.doc_id);
  if (!found) return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
  const err = await finishUpload(db, { ownerId: found.ownerId, doc: found.doc, path: p.data.path, fileName: p.data.file_name, by: "staff" });
  if (err) return NextResponse.json({ ok: false, error: err }, { status: 422 });
  await db.from("activity_log").insert({ actor: a.id, action: "doc_upload", target_table: "case_documents", target_id: found.doc.id });
  return NextResponse.json({ ok: true });
}
