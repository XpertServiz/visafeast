import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { seoMeta } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return seoMeta(locale, "terms", "/terms");
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("pages.termsTitle")} path="/terms" />
      <div className="wrap prose-vf" style={{ paddingBlock: 40, maxWidth: 820 }}>
<p>{t("pages.termsIntro")}</p>
<h2>{t("pages.termsDo")}</h2><p>{t("pages.termsDoT")}</p>
<h2>{t("pages.termsInfo")}</h2><p>{t("pages.termsInfoT")}</p>
<h2>{t("pages.termsFees")}</h2><p>{t("pages.termsFeesT")}</p>
      </div>
    </>
  );
}
