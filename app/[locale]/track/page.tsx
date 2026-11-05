import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { PageHeader } from "@/components/PageHeader";
import { TrackForm } from "@/components/tools/TrackForm";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  await pageCtx(params);
  return { title: "Track your visa file | Visafeast", robots: { index: false, follow: false } };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("track.title")} intro={t("track.intro")} path="/track" />
      <div className="wrap" style={{ paddingBlock: 40 }}><TrackForm locale={locale} /></div>
    </>
  );
}
