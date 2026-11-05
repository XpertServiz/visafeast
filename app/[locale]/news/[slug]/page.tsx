import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageCtx } from "@/lib/page";
import { getPostsFor } from "@/lib/data";
import { alternates, JsonLd } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { PageHeader } from "@/components/PageHeader";
import { Md, fmtDate } from "@/components/ui";

type P = { params: Promise<{ locale: string; slug: string }> };
export const revalidate = 1800;
export async function generateStaticParams() { return []; }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  const { slug } = await params;
  const p = (await getPostsFor(locale)).find((x) => x.slug === slug);
  if (!p) return {};
  return { title: `${p.title} | Visafeast`.slice(0, 70), description: p.excerpt ?? undefined, alternates: alternates(`/news/${slug}`, locale) };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const { slug } = await params;
  const p = (await getPostsFor(locale)).find((x) => x.slug === slug);
  if (!p) notFound();
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: p.title, datePublished: p.published_at, dateModified: p.published_at, author: { "@type": "Organization", name: siteConfig.name }, publisher: { "@type": "Organization", name: siteConfig.name } }} />
      <PageHeader locale={locale} home={t("common.home")} title={p.title} intro={p.published_at ? `${t("pages.published")} ${fmtDate(p.published_at, locale)}` : undefined} path={`/news/${slug}`} />
      <article className="wrap prose-vf" style={{ paddingBlock: 40, maxWidth: 820 }}>
        <Md text={p.body_md} />
        {p.sources.length > 0 && (<><h2>{t("pages.sources")}</h2><ul>{p.sources.map((s) => <li key={s.url}><a href={s.url} rel="nofollow noopener" target="_blank">{s.title}</a></li>)}</ul></>)}
      </article>
    </>
  );
}
