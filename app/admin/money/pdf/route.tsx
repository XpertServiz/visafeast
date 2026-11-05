import { NextResponse, type NextRequest } from "next/server";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { serviceClient } from "@/lib/supabase";
import { siteConfig } from "@/config/site";
import { PdfBrand } from "@/lib/pdf-brand";

export const runtime = "nodejs";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10.5, color: "#0F172A" },
  head: { backgroundColor: "#0A1A33", color: "#fff", padding: 16, marginBottom: 18, borderRadius: 4, flexDirection: "row", justifyContent: "space-between" },
  brand: { fontSize: 20 }, kind: { fontSize: 14, color: "#F2A93B" },
  meta: { fontSize: 9, color: "#C9D3E2", marginTop: 3 },
  label: { fontSize: 8, color: "#5B6474", textTransform: "uppercase", marginBottom: 2 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E4DED3", paddingVertical: 6 },
  th: { fontSize: 8, color: "#5B6474", textTransform: "uppercase" },
  amt: { width: 90, textAlign: "right" },
  total: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  note: { marginTop: 18, padding: 10, backgroundColor: "#F3EBDA", fontSize: 9 },
  foot: { position: "absolute", bottom: 28, left: 40, right: 40, fontSize: 8, color: "#5B6474" },
});
const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString("en-US")}`;
const T = { service: "Visafeast service fee", pass_through: "Fee collected and paid on your behalf (not our income)", discount: "Discount", tax: "Tax" } as const;

/** Staff-only: GET ?type=invoice&id=… or ?type=receipt&id=… → branded PDF (English; see README for the Urdu note). */
export async function GET(req: NextRequest) {
  const a = await getAdmin();
  const db = serviceClient();
  if (!a || !db || !can.money(a.role)) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type"), id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  let doc: React.ReactElement<DocumentProps>;
  let filename: string;
  if (type === "invoice") {
    const { data: inv } = await db.from("invoices").select("id,number,issue_date,due_date,status,notes,person:people(full_name,whatsapp),lines:invoice_lines(line_type,description,amount_pkr),payments(amount_pkr,reversed_by)").eq("id", id).maybeSingle();
    if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const person = (Array.isArray(inv.person) ? inv.person[0] : inv.person) as { full_name: string; whatsapp: string | null } | null;
    const lines = inv.lines as { line_type: keyof typeof T; description: string | null; amount_pkr: number }[];
    const signed = (l: { line_type: string; amount_pkr: number }) => (l.line_type === "discount" ? -l.amount_pkr : l.amount_pkr);
    const total = lines.reduce((x, l) => x + signed(l), 0);
    const paid = (inv.payments as { amount_pkr: number; reversed_by: string | null }[]).filter((p) => !p.reversed_by).reduce((x, p) => x + p.amount_pkr, 0);
    filename = `${inv.number}.pdf`;
    doc = (
      <Document title={`Invoice ${inv.number}`} author="Visafeast">
        <Page size="A4" style={s.page}>
          <View style={s.head}><View><PdfBrand height={28} /><Text style={s.meta}>{siteConfig.address}</Text></View><View><Text style={s.kind}>{inv.status === "draft" ? "QUOTE / DRAFT" : "INVOICE"}</Text><Text style={s.meta}>{inv.number}</Text></View></View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
            <View><Text style={s.label}>Billed to</Text><Text>{person?.full_name}</Text><Text style={{ color: "#475569" }}>{person?.whatsapp}</Text></View>
            <View><Text style={s.label}>Issued</Text><Text>{inv.issue_date}</Text><Text style={[s.label, { marginTop: 6 }]}>Due</Text><Text>{inv.due_date ?? "On receipt"}</Text></View>
          </View>
          <View style={s.row}><Text style={[s.th, { flex: 1 }]}>Description</Text><Text style={[s.th, s.amt]}>Amount</Text></View>
          {lines.map((l, i) => (
            <View key={i} style={s.row} wrap={false}><Text style={{ flex: 1 }}>{l.description || T[l.line_type]}</Text><Text style={s.amt}>{l.line_type === "discount" ? "-" : ""}{pkr(l.amount_pkr)}</Text></View>
          ))}
          <View style={{ marginTop: 12, alignSelf: "flex-end", width: 240 }}>
            <View style={s.total}><Text>Total</Text><Text style={{ fontWeight: 700 }}>{pkr(total)}</Text></View>
            <View style={s.total}><Text>Paid so far</Text><Text>{pkr(paid)}</Text></View>
            <View style={[s.total, { borderTopWidth: 1, borderTopColor: "#0A1A33" }]}><Text style={{ fontWeight: 700 }}>Balance due</Text><Text style={{ fontWeight: 700 }}>{pkr(Math.max(0, total - paid))}</Text></View>
          </View>
          {inv.notes ? <Text style={s.note}>{inv.notes}</Text> : null}
          <Text style={s.note}>Embassy or visa-centre fees are paid to the embassy or visa centre on your behalf and are not Visafeast income. Visafeast does not guarantee visa approval; the decision is made by the embassy.</Text>
          <Text style={s.foot}>WhatsApp {siteConfig.whatsapp} · {siteConfig.url}</Text>
        </Page>
      </Document>
    );
  } else if (type === "receipt") {
    const { data: pay } = await db.from("payments").select("id,amount_pkr,paid_on,method,reference,person:people(full_name),invoice:invoices(number)").eq("id", id).maybeSingle();
    if (!pay) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const person = (Array.isArray(pay.person) ? pay.person[0] : pay.person) as { full_name: string } | null;
    const inv = (Array.isArray(pay.invoice) ? pay.invoice[0] : pay.invoice) as { number: string } | null;
    filename = `receipt-${pay.id.slice(0, 8)}.pdf`;
    doc = (
      <Document title="Payment receipt" author="Visafeast">
        <Page size="A5" style={s.page}>
          <View style={s.head}><View><PdfBrand height={28} /><Text style={s.meta}>{siteConfig.address}</Text></View><View><Text style={s.kind}>RECEIPT</Text><Text style={s.meta}>{pay.paid_on}</Text></View></View>
          <Text style={s.label}>Received from</Text><Text style={{ fontSize: 13, marginBottom: 12 }}>{person?.full_name ?? "Client"}</Text>
          <Text style={s.label}>Amount received</Text><Text style={{ fontSize: 22, marginBottom: 12 }}>{pkr(pay.amount_pkr)}</Text>
          <Text style={s.label}>Paid by</Text><Text style={{ marginBottom: 12 }}>{pay.method ?? "—"}{pay.reference ? ` · ref ${pay.reference}` : ""}</Text>
          {inv ? <><Text style={s.label}>For invoice</Text><Text>{inv.number}</Text></> : <Text style={{ color: "#475569" }}>Advance payment held for your file.</Text>}
          <Text style={s.foot}>Thank you. WhatsApp {siteConfig.whatsapp} · {siteConfig.url}</Text>
        </Page>
      </Document>
    );
  } else return NextResponse.json({ error: "Bad type" }, { status: 400 });

  const buf = await renderToBuffer(doc);
  return new NextResponse(new Uint8Array(buf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${filename}"`, "cache-control": "private, no-store" } });
}
