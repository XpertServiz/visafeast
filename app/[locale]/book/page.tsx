import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { getCountriesFor, getSettings } from "@/lib/data";
import { seoMeta } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { CalEmbed } from "@/components/ui";
import { LeadForm } from "@/components/tools/LeadForm";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return seoMeta(locale, "book", "/book");
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const [s, list] = await Promise.all([getSettings(), getCountriesFor(locale)]);
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
