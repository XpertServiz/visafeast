import type { Metadata } from "next";
import { AIMAN_PATH } from "@/config/aiman";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { lp, regionName } from "@/lib/i18n";
import { localeMeta } from "@/config/locales";
import { waLink } from "@/config/site";
import { getCountriesFor, getFaqsFor, getNews, getPostsFor, getReviews, getSettings, getVideos } from "@/lib/data";
import { IMMIGRATION_HUB } from "@/lib/seed";
import { WORK_GUIDES } from "@/lib/guides";
import { faqJsonLd, JsonLd, seoMeta, videoJsonLd } from "@/lib/seo";
import { FaqLines, Flag, Icon, KIND_COLOR, UrduWord, WaIcon, fmtDate } from "@/components/ui";
import { CalFrame } from "@/components/home/CalFrame";
import { Photo } from "@/components/Photo";
import { HeroVisual } from "@/components/home/HeroVisual";
import { VideoStrip } from "@/components/home/VideoStrip";
import { VisaTabs } from "@/components/home/VisaTabs";
import { Eligibility } from "@/components/tools/Eligibility";
import { Decoder } from "@/components/tools/Decoder";
import { LeadForm } from "@/components/tools/LeadForm";
import { ReviewForm } from "@/components/tools/ReviewForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return seoMeta(locale, "home", "/");
}

const HANDLE = [["gb", "UK"], ["ca", "Canada"], ["us", "USA"], ["au", "Australia"], ["nz", "New Zealand"], ["eu", "Europe"], ["de", "Germany"], ["az", "Baku"], ["th", "Thailand"], ["sg", "Singapore"], ["my", "Malaysia"], ["lk", "Sri Lanka"], ["nl", "Netherlands"], ["fr", "France"], ["pt", "Portugal"], ["ae", "UAE"]];

const Eyebrow = ({ children }: { children: React.ReactNode }) => <p className="eyebrow" style={{ margin: 0, color: "var(--amber-text)" }}>{children}</p>;
const H2 = ({ children, mb = 28 }: { children: React.ReactNode; mb?: number }) => <h2 className="disp" style={{ margin: `10px 0 ${mb}px`, fontSize: 40, fontWeight: 600 }}>{children}</h2>;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await pageCtx(params);
  const [settings, visit, study, videos, reviews, news, posts, faqs] = await Promise.all([
    getSettings(), getCountriesFor(locale, "visit"), getCountriesFor(locale, "study"), getVideos(), getReviews(), getNews({ limit: 2 }), getPostsFor(locale, "digest"), getFaqsFor(locale, null),
  ]);
  const L = (p: string) => lp(locale, p);
  const book = L("/#book");
  const whatsapp = waLink("Hi Visafeast, I'd like to know about a visa.", settings.whatsapp_number);
  const countryNames = [...visit, ...study].map((c) => c.country_name).filter((v, i, a) => a.indexOf(v) === i);
  const workCards = WORK_GUIDES.map((g) => ({ name: regionName(g.code, locale, g.name), flag: g.flag, chips: g.options.map((o) => o.name), href: L(`/work-permit/${g.slug}`) }));
  const immCards = IMMIGRATION_HUB.map((h) => ({ name: h.code === "EU" ? t("hero.europe") : regionName(h.code, locale, h.name), flag: h.flag, chips: h.chips, href: h.slug ? L(`/immigration/${h.slug}`) : L("/immigration") }));
  const cardsOf = (list: typeof visit, base: string, label: string, color: string) => (
    <div className="g4" style={{ gap: 16 }}>
      {list.slice(0, 16).map((c) => (
        <Link prefetch={false} key={c.slug} href={L(`/${base}/${c.slug}`)} className="lift" style={{ display: "block", textDecoration: "none", background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 20, color: "var(--ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Flag code={c.flag ?? ""} size={48} width={64} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: ".14em", color, textTransform: "uppercase" }}>{label}</span>
          </div>
          <p className="disp" style={{ margin: "14px 0 2px", fontSize: 23, fontWeight: 600, color: "var(--navy)" }}>{c.country_name}</p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>{c.visa_name}</p>
          <div className="perf-line" style={{ margin: "14px 0 10px" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--amber-text)" }}>{t("cta.guide")}</span>
        </Link>
      ))}
    </div>
  );
  const pill = { padding: "14px 22px" } as const;
  const localLang = locale === "en" ? "ur" : locale;

  return (
    <div className="home">
      {/* HERO */}
      <section id="top" className="sky" style={{ position: "relative", overflow: "hidden" }}>
        <div className="hero-inner pad32">
          <div style={{ flex: "1 1 540px", minWidth: 0, color: "#fff", position: "relative", zIndex: 2 }}>
            <p className="eyebrow eyebrow-body" style={{ margin: "0 0 18px", color: "var(--amber)" }}>{t("hero.eyebrow")}</p>
            <h1 className="disp h1" style={{ margin: 0, fontSize: 60, lineHeight: 1.04, fontWeight: 600, letterSpacing: "-.015em" }}>{t("hero.h1")}</h1>
            <p style={{ margin: "22px 0 0", fontSize: 19, lineHeight: 1.6, color: "var(--on-navy)", maxWidth: 560 }}>{t("home.heroSub")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
              <a className="btn btn-primary" href={L("/#eligibility")} style={{ padding: "16px 24px", minHeight: 52 }}>{t("cta.eligibility")}</a>
              <a className="btn btn-ghost" href={book} style={{ padding: "16px 22px", minHeight: 52 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>{t("cta.book")}
              </a>
              <a className="btn btn-wa" href={whatsapp} aria-label="WhatsApp us" style={{ padding: "16px 20px", minHeight: 52 }}><WaIcon />{t("cta.whatsapp")}</a>
              <a href={AIMAN_PATH} style={{ background: "#fff", color: "var(--navy)", fontWeight: 700, fontSize: 15, textDecoration: "none", padding: "16px 22px", minHeight: 52, display: "inline-flex", alignItems: "center", borderRadius: 999 }}>{t("cta.talkAiman")}</a>
            </div>
            <a href={book} style={{ display: "inline-block", marginTop: 16, color: "var(--amber)", fontWeight: 600, textDecoration: "underline" }}>{t("cta.enquiry")}</a>
            <ul style={{ listStyle: "none", padding: 0, margin: "32px 0 0", display: "flex", flexWrap: "wrap", gap: 20, fontSize: 14, color: "var(--on-navy)" }}>
              {[["money-bag", "home.tick1"], ["handshake", "home.tick2"], ["phone", "home.tick3"]].map(([icon, k]) => <li key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}><Icon name={icon} size={28} />{t(k)}</li>)}
            </ul>
          </div>
          <HeroVisual label={t("hero.label")} allLabel={t("hero.routeAll")} routeLabels={[["GB", "United Kingdom", t("hero.routeVisit")], ["CA", "Canada", t("home.routeImm")], ["US", "USA", "B1/B2"], ["AU", "Australia", t("home.routeSkilled")], ["DE", "Germany", t("hero.routeStudy")], ["AZ", "Azerbaijan", t("hero.routeEvisa")], ["NZ", "New Zealand", t("hero.routeVisit")], ["TH", "Thailand", t("hero.routeVisit")]].map(([code, name, kind]) => `${regionName(code, locale, name)} · ${kind}`)} />
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <div className="ticker">
            <span className="mono ticker-label">{t("hero.handle")}</span>
            <div className="ticker-view">
              <div className="ticker-track" dir="ltr">
                {[0, 1].map((copy) => (
                  <div key={copy} className="ticker-group" aria-hidden={copy === 1 ? true : undefined}>
                    {HANDLE.map(([f, n]) => <span key={n} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#E6ECF5", whiteSpace: "nowrap" }}><Flag code={f} size={22} width={30} />{f === "eu" ? t("hero.europe") : f === "az" ? t("hero.baku") : regionName(f, locale, n)}</span>)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 EASY STEPS */}
      <section className="sec" style={{ paddingBlock: "56px 8px" }}>
        <h2 className="disp" style={{ margin: "0 0 24px", fontSize: 36, fontWeight: 600, textAlign: "center" }}>{t("steps.title")}</h2>
        <div className="g3">
          {[["phone", t("steps.s1"), t("steps.s1d")], ["folder", t("steps.s2"), t("home.step2d")], ["airplane", t("steps.s3"), t("home.step3d")]].map(([icon, a, b], i) => (
            <div key={icon} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 22, padding: 28, textAlign: "center", position: "relative" }}>
              <span className="mono" style={{ position: "absolute", insetInlineStart: 18, top: 16, width: 36, height: 36, borderRadius: "50%", background: "var(--navy)", color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{i + 1}</span>
              <Icon name={icon} size={96} style={{ margin: "6px auto 14px" }} />
              <p className="disp" style={{ margin: 0, fontSize: 23, fontWeight: 600 }}>{a}</p>
              <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VIDEOS */}
      <VideoStrip videos={videos} eyebrow={t("home.videosEyebrow")} title={t("home.videosTitle")} soon={t("home.videoSoon")} label={t("home.videoLabel")} play={t("home.playVideo")} of={t("elig.of")} />
      {videos.slice(0, 3).map((v) => <JsonLd key={v.id} data={videoJsonLd(v)} />)}

      {/* ELIGIBILITY */}
      <section id="eligibility" className="sec" style={{ paddingBlock: "56px 24px" }}>
        <Eligibility split locale={locale} bookHref={book} whatsapp={settings.whatsapp_number} />
      </section>

      {/* REFUSAL DECODER */}
      <section id="decoder" className="sec" style={{ paddingBlock: "64px 24px" }}>
        <Decoder split locale={locale} bookHref={book} whatsapp={settings.whatsapp_number}
          picture={<Photo slot="decoder" aspect="1 / 1" locale={locale} rounded="50%" tint="#FBE9C9" sizes="132px" />} />
      </section>

      {/* WHY FILES GET REFUSED */}
      <section className="sec" style={{ paddingBlock: "64px 24px" }}>
        <Eyebrow>{t("why.title")}</Eyebrow>
        <H2>{t("home.whyTitle")}</H2>
        <div className="g3" style={{ gap: 20 }}>
          {[
            { slot: "refused-bank", tint: "#FBE9C9", icon: "money-bag", size: 70, bad: t("home.why1a"), ok: t("home.why1b") },
            { slot: "refused-papers", tint: "#E3ECF7", icon: "document", size: 64, flip: true, bad: t("home.why2a"), ok: t("home.why2b") },
            { slot: "refused-sad", tint: "#FBE9C9", icon: "passport-control", size: 64, bad: t("home.why3a"), ok: t("home.why3b") },
          ].map((p) => (
            <div key={p.slot} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 22, overflow: "hidden" }}>
              <div style={{ position: "relative" }}>
                <div className={p.flip ? "flip" : undefined}><Photo slot={p.slot} height={210} tint={p.tint} locale={locale} rounded={0} fit="contain" sizes="240px" /></div>
                <Icon name={p.icon} size={p.size} style={{ position: "absolute", insetInlineEnd: 22, top: 22 }} />
              </div>
              <div style={{ padding: 22 }}>
                <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "var(--bad)" }}><Icon name="cross" size={22} />{p.bad}</p>
                <p style={{ margin: "10px 0 0", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "var(--ok)" }}><Icon name="check" size={22} />{p.ok}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MID CTA */}
      <section className="sec" style={{ paddingBlock: "32px 8px" }}>
        <div className="split sky" style={{ alignItems: "center", justifyContent: "space-between", gap: 20, borderRadius: 22, padding: "20px 32px", color: "#fff", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 120, flexShrink: 0 }}><Photo slot="cta-consultant" aspect="1 / 1" locale={locale} rounded="50%" tint="#FBE9C9" sizes="120px" /></div>
            <div>
              <p className="disp" style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>{t("home.midTitle")}</p>
              <p style={{ margin: "6px 0 0", color: "var(--on-navy)" }}>{t("home.midSub")}</p>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <a className="btn btn-primary" href={book} style={pill}><Icon name="calendar" size={22} />{t("cta.book")}</a>
            <a className="btn btn-ghost" href={book} style={pill}><Icon name="envelope" size={22} />{t("cta.enquiryBtn")}</a>
            <a className="btn btn-wa" href={waLink(undefined, settings.whatsapp_number)} style={pill}>{t("cta.whatsapp")}</a>
          </div>
        </div>
      </section>

      {/* CHOOSE YOUR VISA PAGE */}
      <section id="visas" className="sec" style={{ paddingBlock: "64px 24px" }}>
        <VisaTabs eyebrow={t("nav.visas")} title={t("home.chooseTitle")}
          visit={cardsOf(visit, "visit-visa", t("ui.kindVisit"), KIND_COLOR.visit)} study={cardsOf(study, "study-visa", t("ui.kindStudy"), KIND_COLOR.study)} immigration={immCards} work={workCards}
          labels={{ visit: t("ui.kindVisit"), study: t("ui.kindStudy"), immigration: t("ui.kindImmigration"), work: t("ui.kindWork") }} immNote={t("home.immNote")} workNote={t("home.workNote")} workAll={t("home.workAll")} workHref={L("/work-permit")} qualify={t("cta.guide")} />
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="sec" style={{ paddingBlock: "64px 24px" }}>
        <div className="split" style={{ gap: 32, alignItems: "stretch" }}>
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>
            <Eyebrow>{t("reviews.title")}</Eyebrow>
            <H2 mb={18}>{t("home.reviewsTitle")}</H2>
            <div style={{ background: "#fff", border: "1px dashed #CFC6B6", borderRadius: 16, padding: 18, color: "var(--muted-2)", display: "flex", gap: 12, alignItems: "center" }}>
              <Icon name="check" size={32} />
              <p style={{ margin: 0, fontSize: 15 }}><strong style={{ color: "var(--ink)" }}>{t("home.reviewsReal")}</strong> {t("home.reviewsNote")}</p>
            </div>
          </div>
          <div style={{ flex: "1 1 460px", minWidth: 0, background: "#fff", border: "1px solid var(--line)", borderRadius: 20, padding: 28 }}>
            <h3 className="disp" style={{ margin: "0 0 18px", fontSize: 22, fontWeight: 600 }}>{t("reviews.write")}</h3>
            <ReviewForm locale={locale} />
          </div>
        </div>
        {reviews.length > 0 && (
          <div className="g3" style={{ marginTop: 24 }}>
            {reviews.slice(0, 6).map((r) => (
              <figure key={r.id} style={{ margin: 0, padding: 22, background: "#fff", border: "1px solid var(--line)", borderRadius: 16 }}>
                <p aria-label={`${r.rating} / 5`} style={{ margin: 0, color: "#B87400", letterSpacing: 2 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                <blockquote style={{ margin: "10px 0", lineHeight: 1.6 }}>{r.body}</blockquote>
                <figcaption style={{ fontSize: 14, color: "var(--muted)" }}>{r.name}{r.city ? `, ${r.city}` : ""}{r.visa_type ? ` · ${r.visa_type}` : ""} · {fmtDate(r.created_at, locale)}</figcaption>
              </figure>
            ))}
          </div>
        )}
        {settings.google_reviews_url && <p style={{ marginTop: 20 }}><a className="btn btn-outline" href={settings.google_reviews_url} target="_blank" rel="noopener">{t("reviews.google")}</a></p>}
      </section>

      {/* WHY VISAFEAST */}
      <section className="sec" style={{ paddingBlock: "64px 24px" }}>
        <Eyebrow>{t("whyUs.title")}</Eyebrow>
        <H2>{t("home.whyUsTitle")}</H2>
        <div className="g4" style={{ gap: 16 }}>
          {[
            ["money-bag", t("home.tick1"), t("home.w1d")],
            ["handshake", t("home.tick2"), t("home.w2d")],
            ["shield", t("home.w3"), t("home.w3d")],
            ["speech", null, t("home.w4d")],
          ].map(([icon, a, b]) => (
            <div key={icon} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 20, padding: 24, textAlign: "center" }}>
              <Icon name={icon as string} size={80} style={{ margin: "0 auto 12px" }} />
              <p className="disp" style={{ margin: 0, fontSize: 21, fontWeight: 600 }}>{a ?? <>English &amp; {localLang === "ur" ? <UrduWord height={21} /> : localeMeta(localLang).native}</>}</p>
              <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>{b}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 26, justifyContent: "center" }}>
          <a className="btn btn-dark" href={book} style={pill}><Icon name="calendar" size={22} />{t("cta.book")}</a>
          <a className="btn btn-outline" href={book} style={pill}><Icon name="envelope" size={22} />{t("cta.enquiryBtn")}</a>
        </div>
      </section>

      {/* NEWS */}
      <section id="news" className="sec" style={{ paddingBlock: "64px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
          <div>
            <Eyebrow>{t("home.newsEyebrow")}</Eyebrow>
            <h2 className="disp" style={{ margin: "10px 0 0", fontSize: 40, fontWeight: 600, display: "flex", alignItems: "center", gap: 14 }}><Icon name="newspaper" size={52} />{t("home.newsTitle")}</h2>
          </div>
          <Link prefetch={false} href={L("/news")} style={{ fontWeight: 600, textDecoration: "underline" }}>{t("home.newsAll")}</Link>
        </div>
        <div className="g3">
          {news.map((n) => (
            <article key={n.id} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {n.country_codes.length > 0 && <span className="mono" style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, background: "#E8EEF7", color: "var(--stamp-blue)" }}>{n.country_codes.slice(0, 2).join(" · ")}</span>}
                <span className="mono" style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, textTransform: "uppercase", ...(n.is_official ? { background: "#FBE9C9", color: "var(--amber-text)" } : { background: "#EEF2F8", color: "var(--muted-2)" }) }}>{n.is_official ? t("news.official") : t("news.report")}</span>
              </div>
              <h3 className="disp" style={{ margin: "4px 0 0", fontSize: 19, fontWeight: 600, lineHeight: 1.35 }}><a href={n.url} rel="nofollow noopener" target="_blank" style={{ color: "inherit", textDecoration: "none" }}>{n.title}</a></h3>
              {n.what_it_means && <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6, fontSize: 15 }}><strong style={{ color: "var(--ink)" }}>{t("ui.whatItMeans")}</strong> {n.what_it_means}</p>}
              <p className="mono" style={{ margin: "auto 0 0", fontSize: 12, color: "var(--muted-2)" }}>{n.source} · {fmtDate(n.published_at, locale)}</p>
            </article>
          ))}
          {news.length < 2 && (
            <div className={news.length === 0 ? "news-empty" : undefined} style={{ background: "#fff", border: "1px dashed #CFC6B6", borderRadius: 16, padding: 24, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "var(--muted-2)", minHeight: 180 }}>{t("news.none")}</div>
          )}
          <article style={{ background: "var(--navy)", color: "#fff", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            <div><span className="mono" style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, background: "rgba(242,169,59,.16)", color: "var(--amber)", textTransform: "uppercase" }}>{t("news.digest")}</span></div>
            <h3 className="disp" style={{ margin: "4px 0 0", fontSize: 19, fontWeight: 600, lineHeight: 1.35 }}><Link prefetch={false} href={posts[0] ? L(`/news/${posts[0].slug}`) : L("/news")} style={{ color: "#fff", textDecoration: "none" }}>{posts[0]?.title ?? t("home.digestTitle")}</Link></h3>
            <p style={{ margin: 0, color: "var(--on-navy)", lineHeight: 1.6, fontSize: 15 }}>{posts[0]?.excerpt ?? t("home.digestBody")}</p>
            {posts[0]?.published_at && <p className="mono" style={{ margin: "auto 0 0", fontSize: 12, color: "var(--on-navy-2)" }}>{fmtDate(posts[0].published_at, locale)}</p>}
          </article>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="sec" style={{ maxWidth: 960, paddingBlock: "64px 24px" }}>
        <Eyebrow>{t("ui.faq")}</Eyebrow>
        <H2>{t("home.faqTitle")}</H2>
        <FaqLines faqs={faqs} />
        <JsonLd data={faqJsonLd(faqs)} />
      </section>

      {/* BOOK + ENQUIRY */}
      <section id="book" className="sec" style={{ paddingBlock: "64px 96px" }}>
        <div className="split" style={{ gap: 24 }}>
          <div style={{ flex: "1 1 560px", minWidth: 0, background: "#fff", border: "1px solid var(--line)", borderRadius: 20, padding: 28, display: "flex", flexDirection: "column" }}>
            <h2 className="disp" style={{ margin: 0, fontSize: 26, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}><Icon name="calendar" size={36} />{t("book.title")}</h2>
            <p style={{ margin: "4px 0 18px", color: "var(--muted)", fontSize: 15 }}>{t("home.bookSub")}</p>
            <CalFrame src={`https://cal.com/${settings.calcom_link}?embed=true&theme=light`} title={t("book.title")} className="cal-frame" />
          </div>
          <div style={{ flex: "1 1 420px", minWidth: 0, background: "var(--navy)", color: "#fff", borderRadius: 20, padding: 28 }}>
            <h2 className="disp" style={{ margin: 0, fontSize: 26, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}><Icon name="envelope" size={36} />{t("book.or")}</h2>
            <p style={{ margin: "4px 0 18px", color: "var(--on-navy)", fontSize: 15 }}>{t("home.enqSub")}</p>
            <LeadForm compact locale={locale} countries={countryNames} />
          </div>
        </div>
      </section>
    </div>
  );
}
