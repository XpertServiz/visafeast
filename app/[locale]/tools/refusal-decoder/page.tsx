import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { lp } from "@/lib/i18n";
import { getSettings } from "@/lib/data";
import { alternates } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { Decoder } from "@/components/tools/Decoder";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: "Visa Refusal Letter Decoder — Plain Words | Visafeast", description: "Paste your visa refusal letter and get a plain-words explanation of each reason and what to fix. Nothing is saved unless you ask.", alternates: alternates("/tools/refusal-decoder", locale) };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const s = await getSettings();
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("decoder.h2")} intro={t("decoder.sub")} path="/tools/refusal-decoder" />
      <div className="wrap" style={{ paddingBlock: 48 }}><Decoder locale={locale} bookHref={lp(locale, "/book")} whatsapp={s.whatsapp_number} /></div>
    </>
  );
}
