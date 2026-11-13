import { NextResponse, type NextRequest } from "next/server";
import { crossSite, rateLimit } from "@/lib/server/guard";
import { serviceClient } from "@/lib/supabase";
import { getClient, pendingFiles } from "@/lib/server/portal";
import { esc, notifyOwner } from "@/lib/server/notify";
import { siteConfig } from "@/config/site";

/** The client says "I have sent everything": the owner gets ONE email for the whole batch, not one per file. */
export async function POST(req: NextRequest) {
  if (crossSite(req)) return NextResponse.json({ ok: false, error: "Request not allowed." }, { status: 403 });
  const me = await getClient(); const db = serviceClient();
  if (!me || !db) return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });
  if (!(await rateLimit(`psubmit:${me.person.id}`, 6, 3600_000))) return NextResponse.json({ ok: false, error: "Too many tries. Please wait a little." }, { status: 429 });
  const files = await pendingFiles(db, me.person.id);
  if (!files.length) return NextResponse.json({ ok: false, error: "No new files to send." }, { status: 409 });
  const { data: c } = await db.from("cases").select("ref").eq("person_id", me.person.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  await db.from("timeline_events").insert({ person_id: me.person.id, kind: "client_submit", body: `Client sent ${files.length} file(s) to the consultant`, meta: { count: files.length } });
  const list = files.slice(0, 40).map((f) => `<li>${esc(f.title)}${f.file_name ? ` · ${esc(f.file_name)}` : ""}</li>`).join("");
  const sent = await notifyOwner(
    `${files.length} new file${files.length > 1 ? "s" : ""} from ${me.person.full_name}${c ? ` (${c.ref})` : ""}`,
    `<p><b>${esc(me.person.full_name)}</b>${c ? ` · Client ID <b>${esc(c.ref)}</b>` : ""} finished sending <b>${files.length}</b> file${files.length > 1 ? "s" : ""}:</p><ul>${list}</ul><p><a href="${esc(siteConfig.url)}/admin/cases/documents">Open Documents by file</a></p>`,
  );
  return NextResponse.json({ ok: true, count: files.length, emailed: sent });
}
