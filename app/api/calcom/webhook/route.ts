import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createLead } from "@/lib/server/leads";

/** Cal.com booking webhook -> lead (source='calcom'). Signature is verified with CALCOM_WEBHOOK_SECRET. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "Webhook not configured" }, { status: 503 });
  const sig = req.headers.get("x-cal-signature-256") || "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const evt = JSON.parse(raw);
    if (evt.triggerEvent === "BOOKING_CREATED") {
      const att = evt.payload?.attendees?.[0] ?? {};
      await createLead({ name: att.name, email: att.email, phone: att.phone ?? evt.payload?.responses?.phone?.value, source: "calcom", message: `Booked: ${evt.payload?.title ?? "call"} at ${evt.payload?.startTime ?? ""}` });
    }
  } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  return NextResponse.json({ ok: true });
}
