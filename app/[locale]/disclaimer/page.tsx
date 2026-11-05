import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { seoMeta } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return seoMeta(locale, "disclaimer", "/disclaimer");
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("pages.discTitle")} path="/disclaimer" />
      <div className="wrap prose-vf" style={{ paddingBlock: 40, maxWidth: 820 }}>
<p>{t("ui.disclaimerShort")}</p>
<p>{t("pages.disc1")}</p>
      </div>
    </>
  );
}
