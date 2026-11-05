import type { Metadata } from "next";
import Image from "next/image";
import { pageCtx } from "@/lib/page";
import { alternates } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { PageHeader } from "@/components/PageHeader";
import { Photo } from "@/components/Photo";
import { PHOTOS } from "@/lib/photos";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: "About Visafeast — Visa Consultants Karachi", description: "How Visafeast works: one consultant from first call to decision, published fees, no fake documents, and immigration cases filed with licensed partners.", alternates: alternates("/about", locale) };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const credits = Object.entries(PHOTOS).filter(([, p]) => p.src && p.credit);
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title="About Visafeast" intro="A private visa consultancy in Karachi serving all of Pakistan." path="/about" />
      <div className="wrap prose-vf g2" style={{ paddingBlock: 40, alignItems: "start", maxWidth: 1100 }}>
        <div>
          <Image src={siteConfig.logo} alt="Visafeast — providing visa services" width={200} height={200} style={{ borderRadius: 16 }} />
          <h2>Our approach</h2>
          <ul>
            <li><b>No guarantees.</b> Only the embassy decides. We give you an honest opinion of your chances before you pay embassy fees.</li>
            <li><b>No fake documents.</b> We never arrange bank statements, letters or funds. A false document can lead to a long ban.</li>
            <li><b>Published fees.</b> Fees and timelines are shown with the date we last checked them and a link to the official source.</li>
            <li><b>Your data.</b> We keep only what we need, never publish your story without consent, and delete case documents after the case closes.</li>
          </ul>
          <h2>Immigration cases</h2>
          <p>{t("choose.immNote")}</p>
          <h2>Founder</h2>
          <p style={{ color: "var(--muted)" }}>Founder story coming soon — to be added by the owner in Admin.</p>
        </div>
        <div><Photo slot="why-us" aspect="4 / 3" locale={locale} /></div>
      </div>
      <div className="wrap prose-vf" style={{ paddingBottom: 48 }}>
        <h2>Image credits</h2>
        <p>Photos are royalty-free, from Pexels, Unsplash and Pixabay. Globe imagery: NASA.</p>
        <ul>{credits.map(([k, p]) => <li key={k}>{p.credit} — <a href={p.sourceUrl}>{p.licence}</a></li>)}{credits.length === 0 && <li>Credits will be listed here as photos are added.</li>}</ul>
      </div>
    </>
  );
}
