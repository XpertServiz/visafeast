import type { Metadata } from "next";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { getReviews, getSettings } from "@/lib/data";
import { alternates } from "@/lib/seo";
import { lp } from "@/lib/i18n";
import { PageHeader } from "@/components/PageHeader";
import { fmtDate } from "@/components/ui";
import { ReviewForm } from "@/components/tools/ReviewForm";

type P = { params: Promise<{ locale: string }> };
export const revalidate = 600;
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: "Client Reviews | Visafeast", description: "Reviews from real Visafeast clients, approved before publishing. We never edit the words or hide fair criticism.", alternates: alternates("/reviews", locale) };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const [reviews, s] = await Promise.all([getReviews(), getSettings()]);
  const avg = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;
  // NOTE: no AggregateRating JSON-LD for own-site reviews (brief §6.6).
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("reviews.title")} intro={t("reviews.note")} path="/reviews" />
      <div className="wrap" style={{ paddingBlock: 40 }}>
        {avg && <p className="mono" style={{ color: "var(--muted-2)" }}>Average {avg} / 5 from {reviews.length} reviews</p>}
        {reviews.length === 0 ? (
          <div className="card" style={{ padding: 24, maxWidth: 640 }}><p style={{ margin: 0 }}>{t("reviews.empty")}</p>{s.google_reviews_url && <p><a href={s.google_reviews_url} rel="noopener">Google reviews →</a></p>}</div>
        ) : (
          <div className="g3">
            {reviews.map((r) => (
              <figure key={r.id} className="card" style={{ margin: 0, padding: 22 }}>
                <p aria-label={`${r.rating} / 5`} style={{ margin: 0, color: "#B87400", letterSpacing: 2 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                <blockquote style={{ margin: "10px 0" }}>{r.body}</blockquote>
                <figcaption style={{ fontSize: 14, color: "var(--muted)" }}>{r.name}{r.city ? `, ${r.city}` : ""}{r.visa_type ? ` · ${r.visa_type}` : ""} · {fmtDate(r.created_at, locale)}</figcaption>
              </figure>
            ))}
          </div>
        )}
        <p style={{ marginTop: 28 }}><Link className="btn btn-primary" href={lp(locale, "/reviews/write")}>{t("reviews.write")}</Link></p>
      </div>
    </>
  );
}
