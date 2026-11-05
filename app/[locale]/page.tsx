import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Calendar, FileText, Languages, Mail, MessageCircle, Phone, Plane, UserCheck, Handshake, ShieldCheck, Tag, Newspaper } from "lucide-react";
import { pageCtx } from "@/lib/page";
import { lp, regionName } from "@/lib/i18n";
import { waLink } from "@/config/site";
import { getCountriesFor, getFaqsFor, getNews, getPostsFor, getReviews, getSettings, getVideos } from "@/lib/data";
import { IMMIGRATION_HUB } from "@/lib/seed";
import { faqJsonLd, JsonLd, seoMeta, videoJsonLd } from "@/lib/seo";
import { BoardingPass, Flag, FaqList, Section, Stamp, CalEmbed, fmtDate } from "@/components/ui";
import { Photo } from "@/components/Photo";
import { HeroVisual } from "@/components/home/HeroVisual";
import { VideoStrip } from "@/components/home/VideoStrip";
import { VisaTabs } from "@/components/home/VisaTabs";
import { Eligibility } from "@/components/tools/Eligibility";
import { Decoder } from "@/components/tools/Decoder";
import { LeadForm } from "@/components/tools/LeadForm";
import { ReviewForm } from "@/components/tools/ReviewForm";
import { AskZara } from "@/components/home/AskZara";
import { VisaCompare, type CompareItem } from "@/components/home/VisaCompare";
import { CalendarCheck, FileUp, Globe2, MessageSquareText, Route } from "lucide-react";
import { isStale } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return seoMeta(locale, "home", "/");
}

const PROBLEMS = [{ photo: "refused-bank", key: "bank" }, { photo: "refused-papers", key: "papers" }, { photo: "refused-sad", key: "sad" }];

const HANDLE = [["gb", "UK"], ["ca", "Canada"], ["us", "USA"], ["au", "Australia"], ["nz", "New Zealand"], ["eu", "Europe"], ["de", "Germany"], ["az", "Baku"], ["th", "Thailand"], ["sg", "Singapore"]];

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await pageCtx(params);
  const [settings, visit, study, imm, videos, reviews, news, posts, faqs] = await Promise.all([
    getSettings(), getCountriesFor(locale, "visit"), getCountriesFor(locale, "study"), getCountriesFor(locale, "immigration"), getVideos(), getReviews(), getNews({ limit: 2 }), getPostsFor(locale, "digest"), getFaqsFor(locale, null),
  ]);
  const guides = [...visit, ...study];
  const destinationCount = new Set(guides.map((c) => c.country_name)).size;
  const liveFacts = guides.filter((c) => c.embassy_fee_text && !isStale(c.facts_last_checked));
  const checkedCount = liveFacts.length;
  const latestCheck = liveFacts.map((c) => c.facts_last_checked as string).sort().at(-1) ?? null;
  const fact = (c: (typeof guides)[number], v: string | null) => (isStale(c.facts_last_checked) ? null : v);
  const compare: CompareItem[] = guides.map((c) => ({ slug: c.slug, kind: c.kind as "visit" | "study", country: c.country_name, flag: c.flag ?? "", href: lp(locale, `/${c.kind === "visit" ? "visit-visa" : "study-visa"}/${c.slug}`), fee: fact(c, c.embassy_fee_text), time: fact(c, c.processing_time_text), stay: fact(c, c.max_stay_text), apply: fact(c, c.apply_window_text), checked: isStale(c.facts_last_checked) ? null : c.facts_last_checked }));
  const book = lp(locale, "/#book");
  const L = (p: string) => lp(locale, p);
  const cardsOf = (list: typeof visit) => (
    <div className="g4">{list.slice(0, 8).map((c) => <BoardingPass key={c.slug} c={c} locale={locale} cta={t("cta.guide")} kindLabel={t(c.kind === "visit" ? "ui.kindVisit" : "ui.kindStudy")} />)}</div>
  );
  const publishedImm = new Set(imm.filter((c) => c.is_published).map((c) => c.slug));
  const immCards = IMMIGRATION_HUB.map((h) => ({ name: h.code === "EU" ? t("hero.europe") : regionName(h.code, locale, h.name), flag: h.flag, chips: h.chips, href: h.slug && publishedImm.has(h.slug) ? L(`/immigration/${h.slug}`) : L("/immigration") }));
  const steps = [
    { icon: Phone, bg: "#E6F0FF", fg: "#1F4E8C", a: t("steps.s1"), b: t("steps.s1d"), photo: "step-call" },
    { icon: FileText, bg: "#FFF1D6", fg: "#8A5300", a: t("steps.s2"), b: t("steps.s2d"), photo: "step-documents" },
    { icon: Plane, bg: "#E3F3E6", fg: "#2F6B3A", a: t("steps.s3"), b: t("steps.s3d"), photo: "step-fly" },
  ];
  const why = [
    { icon: Tag, a: t("whyUs.i1"), b: t("whyUs.i1d") }, { icon: UserCheck, a: t("whyUs.i2"), b: t("whyUs.i2d") },
    { icon: ShieldCheck, a: t("whyUs.i3"), b: t("whyUs.i3d") }, { icon: Languages, a: t("whyUs.i4"), b: t("whyUs.i4d") },
  ];
  const countryNames = [...visit, ...study].map((c) => c.country_name).filter((v, i, a) => a.indexOf(v) === i);

  return (
    <>
      {/* 2. HERO */}
      <section id="top" className="sky" style={{ position: "relative", overflow: "hidden" }}>
        <div className="wrap stack-sm" style={{ paddingBlock: "52px 64px", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ flex: "1 1 540px", minWidth: 0, color: "#fff", position: "relative", zIndex: 2 }}>
            <p className="eyebrow" style={{ margin: "0 0 18px", color: "var(--amber)" }}>{t("hero.eyebrow")}</p>
            <h1 className="disp h1" style={{ margin: 0, fontSize: 60, lineHeight: 1.08, fontWeight: 600, letterSpacing: "-.015em" }}>{t("hero.h1")}</h1>
            <p style={{ margin: "22px 0 0", fontSize: 19, color: "var(--on-navy)", maxWidth: 560 }}>{t("hero.sub")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
              <Link className="btn btn-primary" href={L("/#eligibility")} style={{ minHeight: 52 }}><BadgeCheck size={20} aria-hidden />{t("cta.eligibility")}</Link>
              <Link className="btn btn-ghost" href={book} style={{ minHeight: 52 }}><Calendar size={18} aria-hidden />{t("cta.book")}</Link>
              <a className="btn btn-wa" href={waLink("Hi Visafeast, I'd like to know about a visa.", settings.whatsapp_number)} aria-label="WhatsApp us" style={{ minHeight: 52 }}><MessageCircle size={20} aria-hidden />{t("cta.whatsapp")}</a>
            </div>
            <Link href={book} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16, color: "var(--amber)", fontWeight: 600 }}><Mail size={16} aria-hidden />{t("cta.enquiry")}</Link>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "12px 22px", marginTop: 30, fontSize: 15, color: "var(--on-navy)" }}>
              {["hero.tick1", "hero.tick2", "hero.tick3"].map((k) => <li key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}><BadgeCheck size={20} color="#F2A93B" aria-hidden />{t(k)}</li>)}
            </ul>
          </div>
          <HeroVisual label={t("hero.label")} allLabel={t("hero.routeAll")} routeLabels={[["GB", "United Kingdom", t("hero.routeVisit")], ["CA", "Canada", t("hero.routeVisit")], ["US", "USA", "B1/B2"], ["AU", "Australia", t("hero.routeVisit")], ["DE", "Germany", t("hero.routeStudy")], ["AZ", "Azerbaijan", t("hero.routeEvisa")], ["NZ", "New Zealand", t("hero.routeVisit")], ["TH", "Thailand", t("hero.routeVisit")]].map(([code, name, kind]) => `${regionName(code, locale, name)} · ${kind}`)} />
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <div className="ticker" style={{ paddingBlock: 14, fontSize: 15 }}>
            <span className="eyebrow ticker-label" style={{ color: "var(--amber)", fontSize: 12 }}>{t("hero.handle")}</span>
            <div className="ticker-view">
              <div className="ticker-track" dir="ltr">
                {[0, 1].map((copy) => (
                  <div key={copy} className="ticker-group" aria-hidden={copy === 1 ? true : undefined}>
                    {HANDLE.map(([f, n]) => <span key={n} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#E6ECF5", whiteSpace: "nowrap" }}><Flag code={f} size={20} />{f === "eu" ? t("hero.europe") : f === "az" ? t("hero.baku") : regionName(f, locale, n)}</span>)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2a. TRUST STRIP (real numbers from the data), then ASK ZARA */}
      <section style={{ background: "#fff", borderBottom: "1px solid var(--line)", paddingBlock: 18 }}>
        <div className="wrap" style={{ display: "flex", justifyContent: "center", gap: "12px 34px", flexWrap: "wrap" }}>
          {[
            { Icon: Globe2, text: `${destinationCount} ${t("extras.destinations")}` },
            { Icon: BadgeCheck, text: `${checkedCount} ${t("extras.checkedPages")}` },
            ...(latestCheck ? [{ Icon: CalendarCheck, text: `${t("extras.lastChecked")}: ${latestCheck}` }] : []),
          ].map(({ Icon, text }) => <span key={text} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 15 }}><Icon size={20} color="var(--ok)" aria-hidden />{text}</span>)}
        </div>
      </section>
      {settings.chatbot_enabled && (
        <section style={{ paddingBlock: 28 }}>
          <div className="wrap"><AskZara title={t("extras.askTitle")} placeholder={t("extras.askPlaceholder")} send={t("chat.send")} chips={[t("extras.ask1"), t("extras.ask2"), t("extras.ask3")]} /></div>
        </section>
      )}

      {/* 2b. 3 EASY STEPS */}
      <Section title={t("steps.title")}>
        <div className="g3">
          {steps.map((s, i) => (
            <div key={i} className="card" style={{ padding: 28, textAlign: "center", position: "relative" }}>
              <span className="mono" style={{ position: "absolute", insetInlineStart: 18, top: 16, width: 36, height: 36, borderRadius: "50%", background: "var(--navy)", color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{i + 1}</span>
              <span style={{ width: 96, height: 96, borderRadius: "50%", background: s.bg, color: s.fg, display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "6px 0 14px" }}><s.icon size={44} aria-hidden /></span>
              <p className="disp" style={{ margin: 0, fontSize: 23, fontWeight: 600 }}>{s.a}</p>
              <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>{s.b}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. VIDEOS */}
      <VideoStrip videos={videos} eyebrow={t("videos.eyebrow")} channelUrl={settings.youtube_channel_url} allLabel={t("videos.all")} />
      {videos.slice(0, 3).map((v) => <JsonLd key={v.id} data={videoJsonLd(v)} />)}

      {/* 4. ELIGIBILITY */}
      <Section id="eligibility" tone="white">
        <p className="eyebrow" style={{ textAlign: "center", color: "var(--amber-text)", margin: 0 }}>{t("elig.title")}</p>
        <h2 className="disp" style={{ margin: "6px 0 6px", fontSize: 38, fontWeight: 600, textAlign: "center" }}>{t("elig.h2")}</h2>
        <p style={{ textAlign: "center", color: "var(--muted)", margin: "0 0 28px" }}>{t("elig.sub")}</p>
        <Eligibility locale={locale} bookHref={book} whatsapp={settings.whatsapp_number} />
      </Section>

      {/* 5. DECODER */}
      <Section id="decoder">
        <p className="eyebrow" style={{ textAlign: "center", color: "var(--amber-text)", margin: 0 }}>{t("decoder.title")}</p>
        <h2 className="disp" style={{ margin: "6px 0 6px", fontSize: 38, fontWeight: 600, textAlign: "center" }}>{t("decoder.h2")}</h2>
        <p style={{ textAlign: "center", color: "var(--muted)", margin: "0 0 28px" }}>{t("decoder.sub")}</p>
        <Decoder locale={locale} bookHref={book} whatsapp={settings.whatsapp_number} />
      </Section>

      {/* 6. WHY FILES GET REFUSED */}
      <Section title={t("why.title")} tone="white">
        <div className="g3">
          {PROBLEMS.map((p) => {
            return (
              <div key={p.photo} className="card" style={{ overflow: "hidden" }}>
                <Photo slot={p.photo} aspect="16 / 10" locale={locale} rounded={0} />
                <div style={{ padding: 22 }}>
                  <p className="disp" style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{t(`problems.${p.key}.a`)}</p>
                  <p style={{ color: "var(--muted)", margin: "8px 0 14px" }}>{t(`problems.${p.key}.b`)}</p>
                  <div className="perf" style={{ marginBottom: 14 }} />
                  <p className="eyebrow" style={{ color: "var(--ok)", margin: "0 0 4px", fontSize: 12 }}>{t("why.fix")}</p>
                  <p style={{ margin: 0 }}>{t(`problems.${p.key}.c`)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 7. MID CTA */}
      <section className="sky" style={{ paddingBlock: 56, color: "#fff" }}>
        <div className="wrap stack-sm" style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <div style={{ flex: "0 0 320px", maxWidth: "100%" }}><Photo slot="cta-consultant" aspect="4 / 3" locale={locale} /></div>
          <div style={{ flex: 1 }}>
            <h2 className="disp" style={{ margin: 0, fontSize: 36, fontWeight: 600, lineHeight: 1.2 }}>{t("mid.h2")}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
              <Link className="btn btn-primary" href={book}><Calendar size={18} aria-hidden />{t("cta.book")}</Link>
              <Link className="btn btn-ghost" href={book}><Mail size={18} aria-hidden />{t("cta.enquiryBtn")}</Link>
              <a className="btn btn-wa" href={waLink(undefined, settings.whatsapp_number)}><MessageCircle size={18} aria-hidden />{t("cta.whatsapp")}</a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CHOOSE YOUR VISA PAGE */}
      <Section id="visas" title={t("choose.title")}>
        <VisaTabs visit={cardsOf(visit)} study={cardsOf(study)} immigration={immCards} labels={{ visit: t("choose.visit"), study: t("choose.study"), immigration: t("choose.immigration") }} immNote={t("choose.immNote")} cta={t("cta.guide")} qualify={t("cta.qualify")} />
      </Section>

      {/* 8a. COMPARE (real, checked facts only) */}
      <Section id="compare" title={t("extras.compareTitle")} tone="white">
        <p style={{ textAlign: "center", color: "var(--muted)", maxWidth: 680, margin: "-14px auto 22px" }}>{t("extras.compareNote")}</p>
        <VisaCompare locale={locale} items={compare} initial={compare.filter((c) => c.kind === "visit" && c.fee).slice(0, 3).map((c) => c.slug)}
          text={{ visit: t("extras.visit"), study: t("extras.study"), choose: t("extras.choose"), fee: t("extras.fee"), time: t("extras.time"), stay: t("extras.stay"), apply: t("extras.apply"), checked: t("extras.lastChecked"), unknown: t("extras.unknown"), open: t("extras.open") }} />
      </Section>

      {/* 8b. YOUR FILE ONLINE */}
      <Section id="your-file" title={t("extras.fileTitle")} tone="navy">
        <div className="g3">
          {[
            { Icon: FileUp, h: t("extras.file1"), d: t("extras.file1d") },
            { Icon: Route, h: t("extras.file2"), d: t("extras.file2d") },
            { Icon: MessageSquareText, h: t("extras.file3"), d: t("extras.file3d") },
          ].map(({ Icon, h, d }) => (
            <div key={h} style={{ background: "var(--navy-2)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 22 }}>
              <span aria-hidden style={{ width: 48, height: 48, borderRadius: 14, background: "var(--amber)", color: "#0A1A33", display: "grid", placeItems: "center" }}><Icon size={24} /></span>
              <h3 style={{ margin: "14px 0 6px", fontSize: 20 }}>{h}</h3><p style={{ margin: 0, color: "var(--on-navy)" }}>{d}</p>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 24, marginBottom: 0 }}><a className="btn btn-primary" href={lp(locale, "/portal")}>{t("extras.fileCta")}</a></p>
      </Section>

      {/* 9. REVIEWS */}
      <Section id="reviews" title={t("reviews.title")} tone="white">
        <p style={{ textAlign: "center", color: "var(--muted)", maxWidth: 720, marginInline: "auto" }}>{t("reviews.note")}</p>
        {reviews.length > 0 ? (
          <div className="g3" style={{ marginTop: 24 }}>
            {reviews.slice(0, 6).map((r) => (
              <figure key={r.id} className="card" style={{ margin: 0, padding: 22 }}>
                <p aria-label={`${r.rating} / 5`} style={{ margin: 0, color: "#B87400", letterSpacing: 2 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                <blockquote style={{ margin: "10px 0" }}>{r.body}</blockquote>
                <figcaption style={{ fontSize: 14, color: "var(--muted)" }}>{r.name}{r.city ? `, ${r.city}` : ""}{r.visa_type ? ` · ${r.visa_type}` : ""} · {fmtDate(r.created_at, locale)}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 24, maxWidth: 640, marginInline: "auto", marginTop: 24, textAlign: "center" }}>
            <Stamp color="var(--stamp-blue)">{t("ui.newStamp")}</Stamp>
            <p style={{ margin: "12px 0 0" }}>{t("reviews.empty")}</p>
          </div>
        )}
        {settings.google_reviews_url && <p style={{ textAlign: "center", marginTop: 20 }}><a className="btn btn-outline" href={settings.google_reviews_url} target="_blank" rel="noopener">{t("reviews.google")}</a></p>}
        <div className="card" style={{ padding: 24, maxWidth: 720, marginInline: "auto", marginTop: 28 }}>
          <h3 className="disp" style={{ marginTop: 0, fontSize: 24 }}>{t("reviews.write")}</h3>
          <ReviewForm locale={locale} />
        </div>
      </Section>

      {/* 10. WHY VISAFEAST */}
      <Section title={t("whyUs.title")}>
        <div className="g4">
          {why.map((w) => (
            <div key={w.a} className="card" style={{ padding: 24 }}>
              <span style={{ width: 52, height: 52, borderRadius: 14, background: "#FFF1D6", color: "#8A5300", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><w.icon size={26} aria-hidden /></span>
              <p className="disp" style={{ fontSize: 21, fontWeight: 600, margin: "14px 0 4px" }}>{w.a}</p>
              <p style={{ margin: 0, color: "var(--muted)" }}>{w.b}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 28 }}>
          <Link className="btn btn-primary" href={book}><Handshake size={18} aria-hidden />{t("cta.book")}</Link>
          <Link className="btn btn-outline" href={book}><Mail size={18} aria-hidden />{t("cta.enquiryBtn")}</Link>
        </div>
      </Section>

      {/* 11. NEWS RADAR */}
      <Section id="news" title={t("news.title")} tone="white">
        <div className="g3">
          {news.length === 0 && <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--muted)" }}>{t("news.none")}</p>}
          {news.map((n) => (
            <article key={n.id} className="card" style={{ padding: 22 }}>
              <Stamp color={n.is_official ? "var(--ok)" : "var(--muted-2)"}>{n.is_official ? t("news.official") : t("news.report")}</Stamp>
              <h3 style={{ fontSize: 19, margin: "12px 0 6px" }}><a href={n.url} rel="nofollow noopener" target="_blank">{n.title}</a></h3>
              <p className="mono" style={{ fontSize: 12, color: "var(--muted-2)", margin: 0 }}>{n.source} · {fmtDate(n.published_at, locale)}</p>
              {n.what_it_means && <p style={{ marginBottom: 0 }}><b>{t("ui.whatItMeans")} </b>{n.what_it_means}</p>}
            </article>
          ))}
          {posts[0] && (
            <article className="card" style={{ padding: 22, background: "var(--navy)", color: "#fff" }}>
              <Newspaper aria-hidden color="#F2A93B" />
              <p className="eyebrow" style={{ color: "var(--amber)", margin: "10px 0 6px" }}>{t("news.digest")}</p>
              <h3 style={{ fontSize: 19, margin: "0 0 6px" }}><Link href={L(`/news/${posts[0].slug}`)} style={{ color: "#fff" }}>{posts[0].title}</Link></h3>
              <p style={{ margin: 0, color: "var(--on-navy)" }}>{posts[0].excerpt}</p>
            </article>
          )}
        </div>
        <p style={{ textAlign: "center", marginTop: 20 }}><Link href={L("/news")} style={{ fontWeight: 600 }}>{t("news.all")}</Link></p>
      </Section>

      {/* 12. FAQ */}
      <Section id="faq" title={t("faq.title")}>
        <div style={{ maxWidth: 820, marginInline: "auto" }}><FaqList faqs={faqs} /></div>
        <JsonLd data={faqJsonLd(faqs)} />
      </Section>

      {/* 13. BOOK + ENQUIRY */}
      <section id="book" className="sky" style={{ paddingBlock: 64, scrollMarginTop: 12 }}>
        <div className="wrap">
          <div className="g2" style={{ alignItems: "start", gap: 28 }}>
            <div>
              <h2 className="disp" style={{ color: "#fff", margin: "0 0 18px", fontSize: 34, fontWeight: 600 }}>{t("book.title")}</h2>
              <CalEmbed link={settings.calcom_link} title={t("book.title")} />
            </div>
            <div style={{ background: "var(--navy-2)", borderRadius: 20, padding: 26, border: "1px solid rgba(255,255,255,.1)" }}>
              <h2 className="disp" style={{ color: "#fff", margin: "0 0 18px", fontSize: 30, fontWeight: 600 }}>{t("book.or")}</h2>
              <LeadForm locale={locale} countries={countryNames} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
