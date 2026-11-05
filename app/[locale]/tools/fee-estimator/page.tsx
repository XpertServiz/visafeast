import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { getCountries, getSettings, isStale } from "@/lib/data";
import { alternates } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { FeeEstimator } from "@/components/tools/FeeEstimator";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: "Visa Fee Estimator in PKR | Visafeast", description: "Estimate embassy fee, visa centre fee and service fee for your visa, each with the date we last checked it.", alternates: alternates("/tools/fee-estimator", locale) };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const [list, s] = await Promise.all([getCountries(), getSettings()]);
  const rows = list.filter((c) => c.kind !== "immigration").map((c) => ({
    slug: c.slug, label: `${c.country_name} — ${c.visa_name}`, embassy: isStale(c.facts_last_checked) ? null : c.embassy_fee_text, embassyPkr: isStale(c.facts_last_checked) ? null : c.embassy_fee_pkr,
    vfs: c.vfs_fee_text, service: c.service_fee_pkr, checked: c.facts_last_checked, visa: c.visa_name,
  }));
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title="Fee estimator" intro="Pick your visa. Every amount shows the date we last checked it." path="/tools/fee-estimator" />
      <div className="wrap" style={{ paddingBlock: 48 }}><FeeEstimator rows={rows} mode={s.service_fee_mode} whatsapp={s.whatsapp_number} fallback={t("fallback")} /></div>
    </>
  );
}
