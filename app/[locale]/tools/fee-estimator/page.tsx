import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { getCountriesFor, getSettings, isStale } from "@/lib/data";
import { seoMeta } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { FeeEstimator } from "@/components/tools/FeeEstimator";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return seoMeta(locale, "feeEstimator", "/tools/fee-estimator");
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const [list, s] = await Promise.all([getCountriesFor(locale), getSettings()]);
  const rows = list.filter((c) => c.kind !== "immigration").map((c) => ({
    slug: c.slug, label: `${c.country_name} — ${c.visa_name}`, embassy: isStale(c.facts_last_checked) ? null : c.embassy_fee_text, embassyPkr: isStale(c.facts_last_checked) ? null : c.embassy_fee_pkr,
    vfs: c.vfs_fee_text, service: c.service_fee_pkr, checked: c.facts_last_checked, visa: c.visa_name,
  }));
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("pages.feeTitle")} intro={t("pages.feeIntro")} path="/tools/fee-estimator" />
      <div className="wrap" style={{ paddingBlock: 48 }}><FeeEstimator locale={locale} rows={rows} mode={s.service_fee_mode} whatsapp={s.whatsapp_number} fallback={t("fallback")} /></div>
    </>
  );
}
