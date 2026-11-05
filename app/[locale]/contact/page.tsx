import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { pageCtx } from "@/lib/page";
import { getCountries, getSettings } from "@/lib/data";
import { alternates } from "@/lib/seo";
import { waLink } from "@/config/site";
import { PageHeader } from "@/components/PageHeader";
import { LeadForm } from "@/components/tools/LeadForm";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: "Contact Visafeast — Visa Consultants in Karachi", description: "Contact Visafeast on WhatsApp, email or Facebook, or send an enquiry. Consultations online across Pakistan.", alternates: alternates("/contact", locale) };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const [s, list] = await Promise.all([getSettings(), getCountries()]);
  const row = { display: "flex", gap: 12, alignItems: "center", margin: "14px 0" } as const;
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title="Contact us" path="/contact" />
      <div className="wrap g2" style={{ paddingBlock: 40, alignItems: "start" }}>
        <div className="card" style={{ padding: 26 }}>
          <p style={row}><MessageCircle aria-hidden /><a href={waLink(undefined, s.whatsapp_number)}>WhatsApp {s.whatsapp_number}</a></p>
          {s.whatsapp_number_pk && <p style={row}><MessageCircle aria-hidden /><a href={waLink(undefined, s.whatsapp_number_pk)}>WhatsApp {s.whatsapp_number_pk}</a></p>}
          <p style={row}><Mail aria-hidden /><a href={`mailto:${s.email}`}>{s.email}</a></p>
          <p style={row}><MapPin aria-hidden />{s.address_line}</p>
          <p style={row}><Clock aria-hidden />{s.office_hours}</p>
          <p><a href={s.facebook_url} rel="noopener">Facebook page →</a></p>
          {s.ntn && <p className="mono" style={{ fontSize: 13 }}>NTN {s.ntn}</p>}
        </div>
        <div className="sky" style={{ borderRadius: 20, padding: 26 }}>
          <h2 className="disp" style={{ color: "#fff", margin: "0 0 18px" }}>{t("cta.enquiryBtn")}</h2>
          <LeadForm locale={locale} countries={[...new Set(list.map((c) => c.country_name))]} />
        </div>
      </div>
    </>
  );
}
