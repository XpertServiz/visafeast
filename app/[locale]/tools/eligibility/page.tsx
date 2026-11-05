import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { lp } from "@/lib/i18n";
import { getSettings } from "@/lib/data";
import { alternates } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { Eligibility } from "@/components/tools/Eligibility";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: "Free Visa Eligibility Check from Pakistan | Visafeast", description: "Answer six quick questions and see how strong your visa file looks. Free, 60 seconds, no sign-up. An indicative guide, not a decision.", alternates: alternates("/tools/eligibility", locale) };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const s = await getSettings();
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("elig.h2")} intro={t("elig.sub")} path="/tools/eligibility" />
      <div className="wrap" style={{ paddingBlock: 48 }}><Eligibility locale={locale} bookHref={lp(locale, "/book")} whatsapp={s.whatsapp_number} /></div>
    </>
  );
}
