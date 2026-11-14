import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/server/guard";
import { serviceClient } from "@/lib/supabase";
import { isCountry } from "@/config/aiman";
import { checklistFor, checklistPdf, pdfResponse } from "@/lib/server/checklist-pdf";

export const runtime = "nodejs";

/** The checklist PDF for the visitor who just finished the Aiman chat. The link carries their own lead id, so it only works after they completed the chat. */
export async function GET(req: NextRequest) {
  const lead = req.nextUrl.searchParams.get("lead") ?? "", c = req.nextUrl.searchParams.get("c") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(lead) || !isCountry(c)) return NextResponse.json({ ok: false }, { status: 404 });
  if (!(await rateLimit(`aimanpdf:${clientIp(req)}`, 20, 3600_000))) return NextResponse.json({ ok: false, error: "Too many downloads. Please WhatsApp us." }, { status: 429 });
  const db = serviceClient();
  const { data } = db ? await db.from("aiman_leads").select("purpose").eq("id", lead).maybeSingle() : { data: null };
  if (!data?.purpose || !["visit", "study", "work", "immigration"].includes(data.purpose)) return NextResponse.json({ ok: false }, { status: 404 });
  const m = await checklistFor(data.purpose as "visit", c);
  return pdfResponse(await checklistPdf(m), `visafeast-${c}-${data.purpose}-checklist.pdf`);
}
