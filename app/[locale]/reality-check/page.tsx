import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { pageCtx } from "@/lib/page";
import { lp } from "@/lib/i18n";
import { alternates } from "@/lib/seo";
import { getRealityChecks } from "@/lib/server/reality";
import { FOOTER_NOTE, REALITY_PATH } from "@/config/reality-check";
import { PageHeader } from "@/components/PageHeader";
import { RealityList } from "@/components/reality/RealityList";

type P = { params: Promise<{ locale: string }> };
export const revalidate = 1800;
const TITLE = "Visa Reality Check: is that visa or study offer true?";
const DESC = "Short fact-checks of common visa and study-abroad claims, compared with official rules. Official links and a last-verified date on every post.";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: TITLE.slice(0, 70), description: DESC, alternates: alternates(REALITY_PATH, locale, ["en"]), robots: locale === "en" ? undefined : { index: false, follow: true } };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const checks = await getRealityChecks();
  const cards = checks.map((c) => ({ slug: c.slug, title: c.title, claim: c.claim, summary: c.summary, country: c.country, type: c.type, verdict: c.verdict, verified_on: c.verified_on, href: lp(locale, `${REALITY_PATH}/${c.slug}`) }));
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title="Visa Reality Check" intro="An ad says it. We compare it with the official rules." path={REALITY_PATH} />
      <div className="wrap" style={{ paddingBlock: 36 }}>
        <Link href={lp(locale, `${REALITY_PATH}/check-an-offer`)} prefetch={false} className="card lift" style={{ padding: 18, display: "flex", gap: 14, alignItems: "center", textDecoration: "none", color: "var(--ink)", marginBottom: 24 }}>
          <ShieldCheck size={32} aria-hidden style={{ flex: "none", color: "var(--navy)" }} />
          <span><b>Check an offer</b><br /><span style={{ color: "var(--muted)" }}>Tick what the offer says and see the warning signs. Takes one minute.</span></span>
        </Link>
        <RealityList cards={cards} />
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 28 }}>{FOOTER_NOTE}</p>
      </div>
    </>
  );
}
