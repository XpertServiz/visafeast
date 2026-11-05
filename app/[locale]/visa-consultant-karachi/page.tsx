import type { Metadata } from "next";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { getSettings } from "@/lib/data";
import { seoMeta } from "@/lib/seo";
import { lp } from "@/lib/i18n";
import { PageHeader } from "@/components/PageHeader";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return seoMeta(locale, "karachi", "/visa-consultant-karachi");
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const s = await getSettings();
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("pages.khiTitle")} intro={t("pages.khiIntro")} path="/visa-consultant-karachi" />
      <div className="wrap prose-vf" style={{ paddingBlock: 40, maxWidth: 820 }}>
        <h2>{t("pages.khiHow")}</h2>
        <p>{t("pages.khiHowT")}</p>
        <h2>{t("pages.khiOffice")}</h2>
        <p>{s.address_line}. {s.office_hours}.</p>
        <h2>{t("pages.khiCentres")}</h2>
        <p style={{ color: "var(--muted)" }}>{t("pages.khiCentresT")}</p>
        <p><Link className="btn btn-primary" href={lp(locale, "/book")}>{t("cta.book")}</Link></p>
        <p style={{ color: "var(--muted)", fontSize: 15 }}>{t("pages.khiLocal")}</p>
      </div>
    </>
  );
}
