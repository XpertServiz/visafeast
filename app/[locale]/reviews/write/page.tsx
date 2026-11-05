import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { seoMeta } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { ReviewForm } from "@/components/tools/ReviewForm";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return seoMeta(locale, "reviewsWrite", "/reviews/write");
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("reviews.write")} intro={t("reviews.note")} path="/reviews/write" />
      <div className="wrap" style={{ paddingBlock: 40, maxWidth: 720 }}><div className="card" style={{ padding: 24 }}><ReviewForm locale={locale} /></div></div>
    </>
  );
}
