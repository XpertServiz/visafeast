import type { Metadata } from "next";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { getCountriesFor, getNews, getPostsFor } from "@/lib/data";
import { lp } from "@/lib/i18n";
import { seoMeta } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { Stamp, fmtDate } from "@/components/ui";
import { NewsTabs } from "@/components/news/NewsTabs";

type P = { params: Promise<{ locale: string }> };
export const revalidate = 1800;
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return seoMeta(locale, "news", "/news");
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const [latest, posts, countries] = await Promise.all([getNews({ limit: 40 }), getPostsFor(locale), getCountriesFor(locale)]);
  const codes = [...new Map(countries.map((c) => [c.country_code, c.country_name])).entries()];
  // the newest few for every country, so each country tab has stories even when the overall newest are all from one country
  const perCountry = await Promise.all(codes.map(([code]) => getNews({ country: code, limit: 8 })));
  const news = [...new Map([...latest, ...perCountry.flat()].map((n) => [n.id, n])).values()].sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  const counts = Object.fromEntries(codes.map(([code]) => [code, news.filter((n) => n.country_codes.includes(code)).length]));
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("news.title")} intro={t("pages.newsIntro")} path="/news" />
      <div className="wrap" style={{ paddingBlock: 40 }}>
        <NewsTabs
          chips={codes.map(([code, name]) => ({ code, name }))} allLabel={t("pages.newsAll")} digestLabel={t("news.digest")} noneLabel={t("news.none")} counts={counts}
          digests={(
            <div className="g2" style={{ marginTop: 20 }}>
              {posts.length === 0 && <p>{t("pages.noDigests")}</p>}
              {posts.map((p) => <article key={p.id} className="card" style={{ padding: 22 }}><h2 className="disp" style={{ fontSize: 22, margin: "0 0 6px" }}><Link href={lp(locale, `/news/${p.slug}`)}>{p.title}</Link></h2><p className="mono" style={{ fontSize: 12, color: "var(--muted-2)" }}>{fmtDate(p.published_at, locale)}</p><p>{p.excerpt}</p></article>)}
            </div>
          )}
          all={(
            <>
              {news.length === 0 && <p style={{ color: "var(--muted)" }}>{t("news.none")}</p>}
              {news.map((n) => (
              <article key={n.id} className="card ni" data-cc={n.country_codes.join(" ")} style={{ padding: 20 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <Stamp color={n.is_official ? "var(--ok)" : "var(--muted-2)"}>{n.is_official ? t("news.official") : t("news.report")}</Stamp>
                  <span className="mono" style={{ fontSize: 12, color: "var(--muted-2)" }}>{n.source} · {fmtDate(n.published_at, locale)}</span>
                  {n.country_codes.map((c) => <span key={c} className="chip" style={{ margin: 0 }}>{c}</span>)}
                </div>
                <h2 style={{ fontSize: 20, margin: "10px 0 4px" }}><a href={n.url} rel="nofollow noopener" target="_blank">{n.title}</a></h2>
                {n.summary && <p style={{ margin: 0, color: "var(--muted)" }}>{n.summary}</p>}
                {n.what_it_means && <p style={{ marginBottom: 0 }}><b>{t("ui.whatItMeans")} </b>{n.what_it_means}</p>}
              </article>
            ))}
            </>
          )}
        />
      </div>
    </>
  );
}
