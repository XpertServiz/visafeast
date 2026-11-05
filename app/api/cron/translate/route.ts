import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase";
import { translateContent } from "@/lib/server/translate";

export const maxDuration = 60;

/** Runs the content translator on demand (for example the first full pass). The daily job calls the same code. Secret-protected. */
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ ok: false }, { status: 401 });
  const db = serviceClient();
  if (!db) return NextResponse.json({ ok: false, error: "no database" }, { status: 500 });
  const out = await translateContent(db, 45000);
  if (out.done) revalidatePath("/[locale]", "layout");
  return NextResponse.json({ ok: true, ...out });
}
