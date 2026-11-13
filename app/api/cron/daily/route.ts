import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchAllNews } from "@/lib/server/news";
import { serviceClient } from "@/lib/supabase";
import { notifyOwner } from "@/lib/server/notify";
import { createRecurringExpenses, morningSummary, purgeExpiredDocuments } from "@/lib/server/daily";
import { pullSearchConsole } from "@/lib/server/gsc";
import { translateContent } from "@/lib/server/translate";
import { storageMaintenance } from "@/lib/server/storage";

export const maxDuration = 60;

/** One daily job at 04:00 UTC (9am Karachi): news fetch, recurring expenses, Search Console pull, then the morning email.
 *  Kept as ONE cron so the site stays inside Vercel's free 2-cron limit. */
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ ok: false }, { status: 401 });
  const out: Record<string, unknown> = {};
  const step = async (name: string, fn: () => Promise<unknown>) => { try { out[name] = await fn(); } catch (e) { out[name] = { error: e instanceof Error ? e.message : "failed" }; } };

  await step("news", async () => { const r = await fetchAllNews(); revalidatePath("/news"); revalidatePath("/[locale]/news", "page"); revalidatePath("/[locale]", "page"); return r; });
  const db = serviceClient();
  if (db) {
    let made = 0;
    await step("recurring", async () => (made = await createRecurringExpenses(db)));
    await step("documentsDeleted", () => purgeExpiredDocuments(db));
    await step("storage", () => storageMaintenance(db));
    await step("searchConsole", pullSearchConsole);
    await step("translate", async () => { const r = await translateContent(db, 15000); if (r.done) revalidatePath("/[locale]", "layout"); return r; });
    await step("morningEmail", async () => { const m = await morningSummary(db, made); return { sent: await notifyOwner(m.subject, m.html), ...m.data }; });
  }
  return NextResponse.json({ ok: true, ...out });
}
