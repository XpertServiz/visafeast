import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/server/admin-auth";

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });
  const { path } = (await req.json().catch(() => ({}))) as { path?: string };
  if (path) revalidatePath(path); else revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
