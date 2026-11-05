import { NextResponse, type NextRequest } from "next/server";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { serviceClient } from "@/lib/supabase";
import { docOwner, signedDownload } from "@/lib/server/portal";

/** Staff download of a client document. Every download is logged, because these are passports and bank statements. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await getAdmin(); const db = serviceClient();
  if (!a || !db || !can.people(a.role)) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const found = await docOwner(db, id);
  const url = found && (await signedDownload(db, found.doc));
  if (!url) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.from("activity_log").insert({ actor: a.id, action: "doc_download", target_table: "case_documents", target_id: id });
  return NextResponse.redirect(url, { status: 302, headers: { "cache-control": "private, no-store" } });
}
