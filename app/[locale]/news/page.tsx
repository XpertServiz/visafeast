import type { Metadata } from "next";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { getCountriesFor, getNews, getPostsFor } from "@/lib/data";
import { lp } from "@/lib/i18n";
import { seoMeta } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { Stamp, fmtDate } from "@/components/ui";

type P = { params: Promise<{ locale: string }>; searchParams: Promise<{ country?: string; tab?: string }> };
export const revalidate = 1800;
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return seoMeta(locale, "news", "/news");
}
export default async function Page({ params, searchParams }: P) {
  const { locale, t } = await pageCtx(params);
  const sp = await searchParams;
  const [news, posts, countries] = await Promise.all([getNews({ country: sp.country, limit: 50 }), getPostsFor(locale), getCountriesFor(locale)]);
  const codes = [...new Map(countries.map((c) => [c.country_code, c.country_name])).entries()];
  const tab = sp.tab === "digests" ? "digests" : "all";
  const chipStyle = (on: boolean) => ({ textDecoration: "none", background: on ? "var(--navy)" : undefined, color: on ? "#fff" : undefined });
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("news.title")} intro={t("pages.newsIntro")} path="/news" />
      <div className="wrap" style={{ paddingBlock: 40 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <Link className="chip" style={chipStyle(tab === "all" && !sp.country)} href={lp(locale, "/news")}>{t("pages.newsAll")}</Link>
          <Link className="chip" style={chipStyle(tab === "digests")} href={lp(locale, "/news?tab=digests")}>{t("news.digest")}</Link>
          {codes.map(([code, name]) => <Link key={code} className="chip" style={chipStyle(sp.country === code)} href={lp(locale, `/news?country=${code}`)}>{name}</Link>)}
        </div>
        {tab === "digests" ? (
          <div className="g2" style={{ marginTop: 20 }}>
            {posts.length === 0 && <p>{t("pages.noDigests")}</p>}
            {posts.map((p) => <article key={p.id} className="card" style={{ padding: 22 }}><h2 className="disp" style={{ fontSize: 22, margin: "0 0 6px" }}><Link href={lp(locale, `/news/${p.slug}`)}>{p.title}</Link></h2><p className="mono" style={{ fontSize: 12, color: "var(--muted-2)" }}>{fmtDate(p.published_at, locale)}</p><p>{p.excerpt}</p></article>)}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
            {news.length === 0 && <p style={{ color: "var(--muted)" }}>{t("news.none")}</p>}
            {news.map((n) => (
              <article key={n.id} className="card" style={{ padding: 20 }}>
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
          </div>
        )}
      </div>
    </>
  );
}
