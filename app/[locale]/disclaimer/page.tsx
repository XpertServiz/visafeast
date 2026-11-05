import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { alternates } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { siteConfig } from "@/config/site";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: "Disclaimer | Visafeast", description: "Visafeast is a private consultancy, not an embassy or government agency.", alternates: alternates("/disclaimer", locale) };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title="Disclaimer" path="/disclaimer" />
      <div className="wrap prose-vf" style={{ paddingBlock: 40, maxWidth: 820 }}>
<p>{siteConfig.disclaimer}</p>
<p>Nothing on this website is legal advice. The eligibility check and the refusal decoder are indicative guides only. Where the law requires a licensed immigration representative, cases are filed with our licensed partners.</p>
      </div>
    </>
  );
}
