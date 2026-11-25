import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { alternates } from "@/lib/seo";
import { getCountriesFor } from "@/lib/data";
import { FOOTER_NOTE, REALITY_PATH } from "@/config/reality-check";
import { PageHeader } from "@/components/PageHeader";
import { OfferCheck } from "@/components/reality/OfferCheck";

type P = { params: Promise<{ locale: string }> };
export const revalidate = 3600;
const PATH = `${REALITY_PATH}/check-an-offer`;

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: "Check an offer: warning signs | Visafeast", description: "Tick what a visa, study or job offer says and see its warning signs. Free, private, no sign-up.", alternates: alternates(PATH, locale, ["en"]), robots: locale === "en" ? undefined : { index: false, follow: true } };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const list = await getCountriesFor(locale);
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title="Check an offer" intro="Tick what the offer says. Nothing is sent anywhere unless you choose to." path={PATH} guide={false} />
      <div className="wrap" style={{ paddingBlock: 36, maxWidth: 820 }}>
        <OfferCheck locale={locale} countries={[...new Set(list.map((c) => c.country_name))]} />
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 28 }}>{FOOTER_NOTE}</p>
      </div>
    </>
  );
}
