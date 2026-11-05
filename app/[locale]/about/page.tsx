import type { Metadata } from "next";
import Image from "next/image";
import { pageCtx } from "@/lib/page";
import { seoMeta } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { PageHeader } from "@/components/PageHeader";
import { Photo } from "@/components/Photo";
import { PHOTOS } from "@/lib/photos";
import { DEST } from "@/lib/destination-photos";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return seoMeta(locale, "about", "/about");
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const credits = Object.entries(PHOTOS).filter(([, p]) => p.src && p.credit);
  // Destination photos (country-page slideshows), all from Pexels, which is free to use. Each photographer is credited.
  const destCredits = Object.values(DEST).flat();
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("pages.aboutTitle")} intro={t("pages.aboutIntro")} path="/about" />
      <div className="wrap prose-vf g2" style={{ paddingBlock: 40, alignItems: "start", maxWidth: 1100 }}>
        <div>
          <Image src={siteConfig.logo} alt="Visafeast — providing visa services" width={200} height={200} style={{ borderRadius: 16 }} />
          <h2>{t("pages.aboutApproach")}</h2>
          <ul>{[1, 2, 3, 4].map((n) => <li key={n}><b>{t(`pages.about${n}b`)}</b> {t(`pages.about${n}`)}</li>)}</ul>
          <h2>{t("pages.aboutImm")}</h2>
          <p>{t("choose.immNote")}</p>
          <h2>{t("pages.aboutFounder")}</h2>
          <p style={{ color: "var(--muted)" }}>{t("pages.aboutFounderSoon")}</p>
        </div>
        <div><Photo slot="why-us" aspect="4 / 3" locale={locale} tint="#FBE9C9" fit="contain" /></div>
      </div>
      <div className="wrap prose-vf" style={{ paddingBottom: 48 }}>
        <h2>{t("pages.aboutCredits")}</h2>
        <p>{t("pages.aboutCreditsText")}</p>
        <ul>{credits.map(([k, p]) => <li key={k}>{p.credit} — <a href={p.sourceUrl}>{p.licence}</a></li>)}{destCredits.map((p) => <li key={p.src}>{p.alt}: <a href={p.photographerUrl} rel="nofollow noopener">{p.credit}</a> on <a href={p.creditUrl} rel="nofollow noopener">Pexels</a></li>)}</ul>
      </div>
    </>
  );
}
