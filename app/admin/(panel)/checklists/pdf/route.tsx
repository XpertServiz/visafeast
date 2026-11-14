import { NextResponse, type NextRequest } from "next/server";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { isCountry } from "@/config/aiman";
import { checklistFor, checklistPdf, pdfResponse } from "@/lib/server/checklist-pdf";

export const runtime = "nodejs";

/** Staff only: one country's checklist as a Visafeast-branded PDF. */
export async function GET(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can.people(admin.role)) return NextResponse.json({ ok: false }, { status: 401 });
  const kind = req.nextUrl.searchParams.get("kind") ?? "", c = req.nextUrl.searchParams.get("c") ?? "";
  if (!["visit", "study", "work", "immigration"].includes(kind) || !isCountry(c)) return NextResponse.json({ ok: false }, { status: 404 });
  const m = await checklistFor(kind as "visit", c);
  return pdfResponse(await checklistPdf(m), `visafeast-${c}-${kind}-checklist.pdf`);
}
