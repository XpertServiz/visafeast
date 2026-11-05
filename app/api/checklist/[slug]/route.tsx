import { LOCALE_CODES, type Locale } from "@/config/locales";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { clientIp, rateLimit, verifyTurnstile } from "@/lib/server/guard";
import { createLead } from "@/lib/server/leads";
import { getCountry } from "@/lib/data";
import { siteConfig } from "@/config/site";
import { PdfBrand } from "@/lib/pdf-brand";

export const runtime = "nodejs";
const schema = z.object({ name: z.string().trim().min(2).max(80), phone: z.string().trim().min(7).max(20), turnstile: z.string().optional(), locale: z.enum(LOCALE_CODES as [Locale, ...Locale[]]).default("en").transform((l) => (l === "ur" ? "ur" as const : "en" as const)), website: z.string().max(0).optional() });

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 11, color: "#0F172A" },
  head: { backgroundColor: "#0A1A33", color: "#fff", padding: 16, marginBottom: 16, borderRadius: 4 },
  h1: { fontSize: 20 }, sub: { fontSize: 9, color: "#F2A93B", marginTop: 4 },
  row: { flexDirection: "row", marginBottom: 8 }, box: { width: 12, height: 12, borderWidth: 1, borderColor: "#0A1A33", marginRight: 10, marginTop: 1 },
  title: { fontSize: 12, fontWeight: 700 }, detail: { fontSize: 10, color: "#475569" },
  foot: { position: "absolute", bottom: 28, left: 40, right: 40, fontSize: 8, color: "#5B6474" },
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Please enter your name and WhatsApp number." }, { status: 422 });
  if (!(await rateLimit(`pdf:${clientIp(req)}`, 6, 3600_000))) return NextResponse.json({ error: "Too many downloads. Please WhatsApp us." }, { status: 429 });
  if (!(await verifyTurnstile(p.data.turnstile, req))) return NextResponse.json({ error: "Bot check failed." }, { status: 400 });
  const c = await getCountry(slug);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await createLead({ name: p.data.name, phone: p.data.phone, source: "checklist", destination: c.country_name, visa_type: c.kind, page_path: `/${c.kind}/${c.slug}` });

  const checked = c.facts_last_checked ?? "being verified";
  const doc = (
    <Document title={`${c.h1} — document checklist`} author="Visafeast">
      <Page size="A4" style={s.page}>
        <View style={s.head}><View style={{ marginBottom: 12 }}><PdfBrand height={26} /></View><Text style={s.h1}>{c.h1}</Text><Text style={s.sub}>DOCUMENT CHECKLIST · LAST CHECKED {checked}</Text></View>
        {c.documents.length ? c.documents.map((d) => (
          <View key={d.title} style={s.row} wrap={false}><View style={s.box} /><View style={{ flex: 1 }}><Text style={s.title}>{d.title}</Text>{d.detail ? <Text style={s.detail}>{d.detail}</Text> : null}</View></View>
        )) : <Text>The official document list for this visa is being verified. Please WhatsApp us for your personal checklist.</Text>}
        <Text style={s.foot}>{siteConfig.disclaimer} WhatsApp: {siteConfig.whatsapp} · {siteConfig.url}</Text>
      </Page>
    </Document>
  );
  const buf = await renderToBuffer(doc);
  return new NextResponse(new Uint8Array(buf), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="visafeast-${slug}-checklist.pdf"` } });
}
