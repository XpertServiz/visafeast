import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MessageCircle } from "lucide-react";
import { pageCtx } from "@/lib/page";
import { lp } from "@/lib/i18n";
import { alternates, JsonLd } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { AIMAN_PATH } from "@/config/aiman";
import { FOOTER_NOTE, REALITY_PATH, TYPE_LABEL, VERDICT_LABEL } from "@/config/reality-check";
import { getRealityCheck } from "@/lib/server/reality";
import { PageHeader } from "@/components/PageHeader";
import { ContactStrip, VerdictBadge } from "@/components/reality/bits";

type P = { params: Promise<{ locale: string; slug: string }> };
export const revalidate = 1800;
export async function generateStaticParams() { return []; }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await (async () => ({ ...(await pageCtx(params)), slug: (await params).slug }))();
  const c = await getRealityCheck(slug);
  if (!c) return {};
  const title = `${c.title} | Visafeast`.slice(0, 70);
  const description = `${VERDICT_LABEL[c.verdict]}: ${c.summary}`.slice(0, 160);
  const img = `${siteConfig.url}/api/reality-og?slug=${encodeURIComponent(c.slug)}`;
  return {
    title, description, alternates: alternates(`${REALITY_PATH}/${slug}`, locale, ["en"]),
    openGraph: { title, description, type: "article", url: `${siteConfig.url}${lp(locale, `${REALITY_PATH}/${slug}`)}`, siteName: siteConfig.name, images: [{ url: img, width: 1200, height: 630, alt: c.title }] },
    twitter: { card: "summary_large_image", images: [img] },
    robots: locale === "en" ? undefined : { index: false, follow: true },
  };
}

export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const c = await getRealityCheck((await params).slug);
  if (!c) notFound();
  const faq = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: c.rows.map((r) => ({ "@type": "Question", name: `Is this true: ${r.claim}?`, acceptedAnswer: { "@type": "Answer", text: `${VERDICT_LABEL[r.verdict]}. ${r.rule}` } })) };
  const blocks: [string, string][] = [["What is true", c.what_true], ["What is misleading", c.what_misleading], ["What is missing", c.what_missing]];
  return (
    <>
      <JsonLd data={faq} />
      <PageHeader locale={locale} home={t("common.home")} title={c.title} path={`${REALITY_PATH}/${c.slug}`} guide={false} />
      <article className="wrap" style={{ paddingBlock: 36, maxWidth: 860, display: "grid", gap: 28 }}>
        <section className="card" style={{ padding: 24 }}>
          <p className="mono" style={{ margin: 0, fontSize: 12, color: "var(--muted-2)", textTransform: "uppercase" }}>An ad says</p>
          <blockquote style={{ margin: "8px 0 16px", fontSize: 22, fontWeight: 600, lineHeight: 1.4 }}>&ldquo;{c.claim}&rdquo;</blockquote>
          <p style={{ margin: 0, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <VerdictBadge v={c.verdict} big />
            <span className="mono" style={{ fontSize: 13, color: "var(--muted-2)" }}>{[c.country, TYPE_LABEL[c.type]].filter(Boolean).join(" · ")} · Last verified <time dateTime={c.verified_on}>{c.verified_on}</time></span>
          </p>
          <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 0 }}>{c.summary}</p>
          {c.ur_summary && <p dir="rtl" lang="ur" style={{ fontFamily: "var(--f-nastaliq), serif", lineHeight: 2.1, fontSize: 18, marginBottom: 0, background: "#F4F7FB", borderRadius: 12, padding: "10px 14px" }}>{c.ur_summary}</p>}
        </section>

        {c.rows.length > 0 && (
          <section>
            <h2 className="disp" style={{ fontSize: 26 }}>Claim against the official rules</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead><tr style={{ textAlign: "start", background: "var(--navy)", color: "#fff" }}><th scope="col" style={{ padding: 10, textAlign: "start" }}>Claim</th><th scope="col" style={{ padding: 10, textAlign: "start" }}>What the official rules say</th><th scope="col" style={{ padding: 10, textAlign: "start" }}>Verdict</th></tr></thead>
                <tbody>{c.rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}><td style={{ padding: 10, fontWeight: 600 }}>{r.claim}</td><td style={{ padding: 10 }}>{r.rule}</td><td style={{ padding: 10 }}><VerdictBadge v={r.verdict} /></td></tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        )}

        {blocks.filter(([, b]) => b.trim()).map(([h, b]) => <section key={h}><h2 className="disp" style={{ fontSize: 22, margin: "0 0 6px" }}>{h}</h2><p style={{ margin: 0, lineHeight: 1.7 }}>{b}</p></section>)}

        {c.checklist.length > 0 && (
          <section className="card" style={{ padding: 24 }}>
            <h2 className="disp" style={{ fontSize: 24, marginTop: 0 }}>What to do before you pay</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
              {c.checklist.map((x, i) => <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><span aria-hidden style={{ flex: "none", width: 22, height: 22, border: "2px solid var(--navy)", borderRadius: 6, marginTop: 2 }} />{x}</li>)}
            </ul>
          </section>
        )}

        <section>
          <h2 className="disp" style={{ fontSize: 22, margin: "0 0 8px" }}>Official sources</h2>
          <ul style={{ margin: 0, paddingInlineStart: 22, lineHeight: 1.9 }}>
            {c.sources.map((s) => <li key={s.url}><a href={s.url} rel="nofollow noopener" target="_blank" style={{ fontWeight: 600 }}>{s.title} <ExternalLink size={14} aria-hidden style={{ verticalAlign: "-2px" }} /></a></li>)}
          </ul>
          <p className="mono" style={{ fontSize: 13, color: "var(--muted-2)" }}>Last verified {c.verified_on}</p>
        </section>

        <section className="sky" style={{ borderRadius: 20, padding: 24, color: "#fff" }}>
          <h2 className="disp" style={{ margin: "0 0 6px", color: "#fff", fontSize: 24 }}>Not sure about your own case?</h2>
          <p style={{ color: "var(--on-navy)", margin: "0 0 16px" }}>Answer a few short questions and we will tell you where you stand.</p>
          <Link className="btn btn-primary" href={AIMAN_PATH}><MessageCircle size={18} aria-hidden />Talk with Aiman</Link>
          <div style={{ marginTop: 18, color: "#fff" }} className="rc-contact"><ContactStrip /></div>
        </section>

        <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{FOOTER_NOTE}</p>
      </article>
    </>
  );
}
