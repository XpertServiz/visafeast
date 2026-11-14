import "server-only";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { siteConfig } from "@/config/site";
import { PdfBrand } from "@/lib/pdf-brand";
import { COUNTRIES, type CountryId } from "@/config/aiman";
import { buildChecklist, COUNTRY_CODE, type ChecklistKind, type ChecklistModel } from "@/lib/checklists";
import { getCountries } from "@/lib/data";

const s = StyleSheet.create({
  page: { padding: 40, paddingBottom: 60, fontSize: 11, color: "#0F172A" },
  head: { backgroundColor: "#0A1A33", color: "#fff", padding: 16, marginBottom: 16, borderRadius: 4 },
  h1: { fontSize: 19 }, sub: { fontSize: 9, color: "#F2A93B", marginTop: 4 },
  row: { flexDirection: "row", marginBottom: 8 }, box: { width: 12, height: 12, borderWidth: 1, borderColor: "#0A1A33", marginRight: 10, marginTop: 1 },
  title: { fontSize: 12, fontWeight: 700 }, detail: { fontSize: 10, color: "#475569" },
  note: { marginTop: 10, padding: 10, backgroundColor: "#F7F4EE", fontSize: 10, color: "#475569" },
  foot: { position: "absolute", bottom: 28, left: 40, right: 40, fontSize: 8, color: "#5B6474" },
});

/** The Visafeast-branded PDF (logo on a navy bar, tick boxes, disclaimer and contact line). */
export async function checklistPdf(m: ChecklistModel): Promise<Uint8Array> {
  const doc = (
    <Document title={m.title} author="Visafeast">
      <Page size="A4" style={s.page}>
        <View style={s.head}><View style={{ marginBottom: 12 }}><PdfBrand height={26} /></View><Text style={s.h1}>{m.title}</Text><Text style={s.sub}>{m.subtitle}</Text></View>
        {m.items.map((d) => (
          <View key={d.title} style={s.row} wrap={false}><View style={s.box} /><View style={{ flex: 1 }}><Text style={s.title}>{d.title}</Text>{d.detail ? <Text style={s.detail}>{d.detail}</Text> : null}</View></View>
        ))}
        <Text style={s.note}>{m.note}</Text>
        <Text style={s.foot} fixed>{siteConfig.disclaimer} WhatsApp: {siteConfig.whatsapp} · {siteConfig.url}</Text>
      </Page>
    </Document>
  );
  return new Uint8Array(await renderToBuffer(doc));
}

/** Finds a country's checklist for a service: the country page's official list when there is one, otherwise the typical list. */
export async function checklistFor(kind: ChecklistKind, id: CountryId): Promise<ChecklistModel> {
  const code = COUNTRY_CODE[id];
  let db: { documents: { title: string; detail?: string }[]; checked: string | null } | null = null;
  if (kind === "visit" || kind === "study") {
    const list = await getCountries(kind);
    const c = list.find((x) => (code === "EU" ? /schengen|europe/.test(x.slug) : x.country_code === code));
    if (c) db = { documents: c.documents ?? [], checked: c.facts_last_checked };
  }
  return buildChecklist(kind, COUNTRIES[id].en, code, db);
}

export const pdfResponse = (bytes: Uint8Array, name: string) =>
  new Response(Buffer.from(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${name}"`, "cache-control": "no-store" } });
