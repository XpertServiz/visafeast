import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { getCountries, getSettings } from "@/lib/data";
import { alternates } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { CalEmbed } from "@/components/ui";
import { LeadForm } from "@/components/tools/LeadForm";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: "Book a Free 15-Minute Visa Call | Visafeast", description: "Book a free 15-minute call with a Visafeast consultant, or send an enquiry and we will reply on WhatsApp.", alternates: alternates("/book", locale) };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const [s, list] = await Promise.all([getSettings(), getCountries()]);
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("book.title")} path="/book" />
      <div className="wrap g2" style={{ paddingBlock: 40, alignItems: "start" }}>
        <CalEmbed link={s.calcom_link} title={t("book.title")} />
        <div className="sky" style={{ borderRadius: 20, padding: 26 }}>
          <h2 className="disp" style={{ color: "#fff", margin: "0 0 18px" }}>{t("book.or")}</h2>
          <LeadForm locale={locale} countries={[...new Set(list.map((c) => c.country_name))]} />
        </div>
      </div>
    </>
  );
}
