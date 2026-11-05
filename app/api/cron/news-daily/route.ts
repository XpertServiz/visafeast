import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchAllNews } from "@/lib/server/news";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ ok: false }, { status: 401 });
  const r = await fetchAllNews();
  revalidatePath("/news"); revalidatePath("/[locale]/news", "page"); revalidatePath("/[locale]", "page");
  return NextResponse.json({ ok: true, ...r });
}
