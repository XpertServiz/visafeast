import { crossSite } from "@/lib/server/guard";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { serviceClient } from "@/lib/supabase";
import { docOwner, finishUpload, getClient } from "@/lib/server/portal";

const schema = z.object({ doc_id: z.string().uuid(), path: z.string().max(200), file_name: z.string().max(300) });

export async function POST(req: NextRequest) {
  if (crossSite(req)) return NextResponse.json({ ok: false, error: "Request not allowed." }, { status: 403 });
  const me = await getClient(); const db = serviceClient();
  if (!me || !db) return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ ok: false, error: "Upload details are not valid." }, { status: 422 });
  const found = await docOwner(db, p.data.doc_id);
  if (!found || found.ownerId !== me.person.id) return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
  const err = await finishUpload(db, { ownerId: me.person.id, doc: found.doc, path: p.data.path, fileName: p.data.file_name, by: "client" });
  if (err) return NextResponse.json({ ok: false, error: err }, { status: 422 });
  return NextResponse.json({ ok: true });
}
