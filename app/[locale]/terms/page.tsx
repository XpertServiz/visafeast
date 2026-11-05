import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { alternates } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { siteConfig } from "@/config/site";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: "Terms of Use | Visafeast", description: "Terms for using the Visafeast website and services.", alternates: alternates("/terms", locale) };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title="Terms of Use" path="/terms" />
      <div className="wrap prose-vf" style={{ paddingBlock: 40, maxWidth: 820 }}>
<p>Last updated: 5 November 2026. The owner should have these terms reviewed before launch.</p>
<h2>What we do</h2><p>Visafeast prepares and reviews files for visit, study and immigration applications. We do not decide visas and cannot guarantee outcomes.</p>
<h2>Information on this site</h2><p>Fees, times and requirements are shown with the date we last checked them and an official source. Always confirm on the official website before paying.</p>
<h2>Fees</h2><p>Our service fees are agreed in writing before work starts. Embassy and visa-centre fees paid on your behalf are client money and are not our income.</p>
      </div>
    </>
  );
}
