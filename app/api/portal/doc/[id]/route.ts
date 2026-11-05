import { NextResponse, type NextRequest } from "next/server";
import { serviceClient } from "@/lib/supabase";
import { docOwner, getClient, signedDownload } from "@/lib/server/portal";

/** A client downloads their own document through a 5-minute private link. Anyone else gets "not found". */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getClient(); const db = serviceClient();
  if (!me || !db) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const found = await docOwner(db, id);
  if (!found || found.ownerId !== me.person.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const url = await signedDownload(db, found.doc);
  if (!url) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.redirect(url, { status: 302, headers: { "cache-control": "private, no-store" } });
}
