import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit, verifyTurnstile } from "@/lib/server/guard";
import { createLead } from "@/lib/server/leads";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20).regex(/^[+\d][\d\s()-]{6,}$/, "Invalid number"),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(60).optional(),
  destination: z.string().trim().max(80).optional(),
  visa_type: z.enum(["visit", "study", "immigration"]).optional(),
  prior_refusal: z.enum(["no", "once", "more"]).optional(),
  nationality: z.string().trim().max(60).optional(),
  residence_country: z.string().trim().max(60).optional(),
  message: z.string().trim().max(1500).optional(),
  source: z.enum(["enquiry", "chatbot", "checklist", "eligibility", "calcom", "review_request", "immigration", "decoder"]).default("enquiry"),
  page_path: z.string().max(200).optional(),
  eligibility: z.unknown().optional(),
  utm: z.unknown().optional(),
  website: z.string().max(0).optional(), // honeypot — must stay empty
  turnstile: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    // honeypot hit -> pretend success so bots learn nothing
    if ((body as { website?: string })?.website) return NextResponse.json({ ok: true });
    return NextResponse.json({ ok: false, error: "Please check the form fields." }, { status: 422 });
  }
  const { turnstile, website: _hp, ...lead } = parsed.data;
  if (!(await rateLimit(`lead:${clientIp(req)}`, 8, 3600_000))) return NextResponse.json({ ok: false, error: "Too many requests. Please WhatsApp us." }, { status: 429 });
  if (!(await verifyTurnstile(turnstile, req))) return NextResponse.json({ ok: false, error: "Bot check failed. Please retry." }, { status: 400 });
  const r = await createLead({ ...lead, email: lead.email || undefined });
  return NextResponse.json({ ok: r.ok });
}
