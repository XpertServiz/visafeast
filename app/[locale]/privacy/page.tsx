import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { seoMeta } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { siteConfig } from "@/config/site";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return seoMeta(locale, "privacy", "/privacy");
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("pages.privTitle")} path="/privacy" />
      <div className="wrap prose-vf" style={{ paddingBlock: 40, maxWidth: 820 }}>
<p>{t("pages.privIntro")}</p>
<h2>{t("pages.privCollect")}</h2><ul>{["Forms", "Chat", "Stats", "Cookies"].map((k) => <li key={k}><b>{t(`pages.priv${k}`)}</b> {t(`pages.priv${k}T`)}</li>)}</ul>
<h2>{t("pages.privWhy")}</h2><p>{t("pages.privWhyT")}</p>
<h2>{t("pages.privLong")}</h2><p>{t("pages.privLongT")}</p>
<h2>{t("pages.privRights")}</h2><p>{t("pages.privRightsT", { email: siteConfig.email })}</p>
<h2>{t("pages.privDecoder")}</h2><p>{t("pages.privDecoderT")}</p>
      </div>
    </>
  );
}
