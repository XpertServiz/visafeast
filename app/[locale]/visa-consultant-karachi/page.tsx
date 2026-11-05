import type { Metadata } from "next";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { getSettings } from "@/lib/data";
import { alternates } from "@/lib/seo";
import { lp } from "@/lib/i18n";
import { PageHeader } from "@/components/PageHeader";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: "Visa Consultant in Karachi | Visafeast", description: "Visa consultant in Karachi for visit, study and immigration files. Free 15-minute call; consultations online across Pakistan.", alternates: alternates("/visa-consultant-karachi", locale) };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const s = await getSettings();
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title="Visa Consultant in Karachi" intro="Visit, study and immigration files — prepared properly the first time." path="/visa-consultant-karachi" />
      <div className="wrap prose-vf" style={{ paddingBlock: 40, maxWidth: 820 }}>
        <h2>How a consultation works</h2>
        <p>Start with a free 15-minute call or a WhatsApp message. We look at your travel history, income documents and plan, and tell you honestly what to prepare. Consultations run by phone or WhatsApp video, so you can use Visafeast from anywhere in Pakistan.</p>
        <h2>Office hours and location</h2>
        <p>{s.address_line}. {s.office_hours}.</p>
        <h2>Visa application centres in Karachi</h2>
        <p style={{ color: "var(--muted)" }}>Centre addresses and appointment rules change. Karachi VFS / visa centre details are being verified against official sources and will be added here with the date we checked them.</p>
        <p><Link className="btn btn-primary" href={lp(locale, "/book")}>{t("cta.book")}</Link></p>
        <p style={{ color: "var(--muted)", fontSize: 15 }}>Local content for Lahore and Islamabad will be added only when we have real local information.</p>
      </div>
    </>
  );
}
