import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { PageHeader } from "@/components/PageHeader";
import { ReviewForm } from "@/components/tools/ReviewForm";

type P = { params: Promise<{ locale: string }> };
export const metadata: Metadata = { title: "Write a Review | Visafeast", description: "Share your experience with Visafeast. Reviews are approved before they appear.", robots: { index: false, follow: true } };
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("reviews.write")} intro={t("reviews.note")} path="/reviews/write" />
      <div className="wrap" style={{ paddingBlock: 40, maxWidth: 720 }}><div className="card" style={{ padding: 24 }}><ReviewForm locale={locale} /></div></div>
    </>
  );
}
