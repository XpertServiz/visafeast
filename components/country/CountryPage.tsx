import Image from "next/image";
import Link from "next/link";
import { Calendar, ExternalLink, MessageCircle, Plane, BadgeCheck, Search } from "lucide-react";
import type { Country } from "@/lib/types";
import { waLink, type Locale } from "@/config/site";
import { getT, lp } from "@/lib/i18n";
import { getCountriesFor, getFaqsFor, getNews, getSettings, isStale } from "@/lib/data";
import { LocalPrice } from "@/components/LocalPrice";
import { BreadcrumbItems } from "./Breadcrumb";
import { breadcrumbJsonLd, faqJsonLd, JsonLd } from "@/lib/seo";
import { BoardingPass, FaqList, Flag, Md, fmtDate, KIND_BASE } from "@/components/ui";
import { Checklist } from "./Checklist";
import { Slideshow } from "./Slideshow";
import { GUIDE } from "@/lib/photos";
import { DEST } from "@/lib/destination-photos";
import { getGuide, IMMIGRATION_GUIDES } from "@/lib/guides";

export async function CountryPage({ c, locale }: { c: Country; locale: Locale }) {
  const t = getT(locale);
  const guide = getGuide(c.slug);
  const [settings, faqs, news, all] = await Promise.all([getSettings(), getFaqsFor(locale, c.slug), getNews({ country: c.country_code, limit: 3 }), getCountriesFor(locale)]);
  const base = KIND_BASE[c.kind];
  const imm = c.kind === "immigration";
  const wa = (q: string) => waLink(q, settings.whatsapp_number);
  const verify = (
    <p style={{ margin: "14px 0 0", fontSize: 15, color: "var(--muted)" }}>
      <a href={wa(`Hi Visafeast, I need the latest information on the ${c.visa_name} for ${c.country_name}.`)} style={{ fontWeight: 600 }}>{t("guide.verifyNote")}</a>
    </p>
  );

  // Facts: the database value while it is fresh, otherwise the value read from the official page (in the guide). Unknown stays unknown.
  const dbFresh = !isStale(c.facts_last_checked);
  const pick = (db: string | null, fromGuide?: string) => (db && dbFresh ? db : fromGuide ?? null);
  const fee = pick(c.embassy_fee_text, guide?.facts?.embassy_fee_text);
  const vfs = pick(c.vfs_fee_text, guide?.facts?.vfs_fee_text);
  const time = pick(c.processing_time_text, guide?.facts?.processing_time_text);
  const stay = pick(c.max_stay_text, guide?.facts?.max_stay_text);
  const window = pick(c.apply_window_text, guide?.facts?.apply_window_text);
  const bio = pick(c.biometrics_text, guide?.facts?.biometrics_text);
  const useDb = dbFresh && !!c.facts_source_url;
  const metaDate = useDb ? c.facts_last_checked : guide?.checked ?? c.facts_last_checked;
  const metaUrl = useDb ? c.facts_source_url : guide?.sources[0]?.url ?? null;
  const domain = metaUrl ? new URL(metaUrl).hostname : null;

  const hubLabel = t(c.kind === "visit" ? "choose.visit" : c.kind === "study" ? "choose.study" : "choose.immigration");
  const related = c.related_slugs.map((s) => all.find((x) => x.slug === s)).filter(Boolean) as Country[];
  const siblings: { href: string; label: string }[] = [
    ...all.filter((x) => x.country_code === c.country_code && x.kind !== c.kind && x.slug !== c.slug).map((x) => ({ href: lp(locale, `/${KIND_BASE[x.kind]}/${x.slug}`), label: x.h1 })),
    ...(imm ? [] : IMMIGRATION_GUIDES.filter((g) => g.code === c.country_code).map((g) => ({ href: lp(locale, `/immigration/${g.slug}`), label: g.h1 }))),
  ];

  const whoFor = guide?.who_for ?? c.who_for_md;
  const docs = c.documents.length ? c.documents : guide?.documents ?? [];
  const funds = c.funds_md ?? guide?.funds ?? null;
  const extras = [...c.extra_sections, ...(guide?.extra ?? [])];
  const options = guide?.options ?? [];
  const slides = guide ? DEST[guide.photos] : undefined;

  const facts: [string, React.ReactNode][] = imm
    ? [[t("guide.programmes"), String(options.length)], [t("common.lastChecked"), metaDate ? fmtDate(metaDate, locale) : "—"], [t("guide.officialPages"), String(guide?.sources.length ?? 0)]]
    : [
        [t("ui.visa"), c.visa_name],
        ...(fee ? [[t("ui.embassyFee"), <>{fee}<LocalPrice text={fee} locale={locale} /></>] as [string, React.ReactNode]] : []),
        ...(time ? [[t("ui.decisionTime"), time] as [string, React.ReactNode]] : []),
        ...(stay ? [[t("ui.stay"), stay] as [string, React.ReactNode]] : []),
        ...(window ? [[t("ui.applyWindow"), window] as [string, React.ReactNode]] : []),
        ...(bio ? [[t("ui.biometrics"), bio] as [string, React.ReactNode]] : []),
      ];
  // One note per page, however many figures are still missing (including the visa-centre fee in the cost table).
  const someUnknown = !imm && ([fee, time, stay, window, bio].some((v) => !v) || !vfs);

  const optionsLabel = t(c.kind === "visit" ? "guide.optionsVisit" : c.kind === "study" ? "guide.optionsStudy" : "guide.optionsImm");
  const anchors: [string, string][] = [
    ...(guide?.overview ? [["overview", t("guide.overview")] as [string, string]] : []),
    ...(options.length ? [["options", optionsLabel] as [string, string]] : []),
    ...(whoFor.length ? [["who", t("ui.whoFor")] as [string, string]] : []),
    ...(docs.length ? [["documents", t("ui.documents")] as [string, string]] : []),
    ...(funds ? [["funds", t("ui.funds")] as [string, string]] : []),
    ["steps", t("ui.howItWorks")],
    ...(c.refusal_reasons.length ? [["refusals", t("ui.refusals")] as [string, string]] : []),
    ...(imm ? [] : [["cost", t("ui.totalCost")] as [string, string]]),
    ...(guide ? [["sources", t("guide.sources")] as [string, string]] : []),
    ["news", t("ui.latestNews")], ["faq", t("ui.faq")],
  ];
  const label = (id: string) => anchors.find((a) => a[0] === id)?.[1] ?? "";
  const feeRow = (name: string, who: string, amount: React.ReactNode) => (
    <tr key={name} style={{ borderTop: "1px solid var(--line)" }}><td style={{ padding: "12px 10px" }}>{name}</td><td style={{ padding: "12px 10px" }}>{who}</td><td style={{ padding: "12px 10px" }}>{amount}</td><td className="mono" style={{ padding: "12px 10px", fontSize: 13 }}>{amount === "—" || !metaDate ? "—" : fmtDate(metaDate, locale)}</td></tr>
  );
  const svc = settings.service_fee_mode === "quote" || !c.service_fee_pkr ? t("ui.contactQuote") : `${settings.service_fee_mode === "from" ? `${t("ui.from")} ` : ""}PKR ${c.service_fee_pkr.toLocaleString("en-PK")}`;
  const crumbs = [{ name: t("common.home"), path: lp(locale, "/") }, { name: hubLabel, path: lp(locale, `/${base}`) }, { name: c.country_name, path: lp(locale, `/${base}/${c.slug}`) }];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)} />}
      <header className="sky" style={{ paddingBlock: "36px 90px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <Image className="page-guide" src={GUIDE.happy.src} alt="" width={GUIDE.happy.width} height={GUIDE.happy.height} unoptimized />
        <div className="wrap" style={{ position: "relative" }}>
          <BreadcrumbItems items={[{ label: t("common.home"), href: lp(locale, "/") }, { label: hubLabel, href: lp(locale, `/${base}`) }, { label: c.country_name }]} />
          <div className="mono" dir="ltr" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 22, color: "var(--amber)", fontSize: 18, maxWidth: 420 }}>
            <span>{c.from_code}</span><span style={{ flex: 1, borderTop: "2px dashed rgba(242,169,59,.6)" }} /><Plane aria-hidden /><span style={{ flex: 1, borderTop: "2px dashed rgba(242,169,59,.6)" }} /><span>{c.to_code}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}><Flag code={c.flag} size={30} /><h1 className="disp h1" style={{ margin: 0, fontSize: 52, lineHeight: 1.1, fontWeight: 600 }}>{c.h1}</h1></div>
          <p style={{ fontSize: 19, color: "var(--on-navy)", maxWidth: 720, marginTop: 16 }}>{c.intro}</p>
          <p className="mono" style={{ fontSize: 12, letterSpacing: ".08em", color: "var(--on-navy-2)" }}>
            {t("common.lastChecked").toUpperCase()} {metaDate ? fmtDate(metaDate, locale).toUpperCase() : "—"} · {t("common.source").toUpperCase()}: {domain && metaUrl ? <a href={metaUrl} rel="nofollow noopener" style={{ color: "var(--amber)" }}>{domain}</a> : t("ui.toVerify")}
          </p>
        </div>
      </header>

      <div className="wrap" style={{ marginTop: -64, position: "relative" }}>
        <section aria-label="Quick facts" className="card" style={{ padding: 22, boxShadow: "0 18px 40px rgba(10,26,51,.12)" }}>
          <div className="g3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
            {facts.map(([k, v]) => <div key={k}><p className="eyebrow" style={{ margin: 0, fontSize: 12, color: "var(--muted-2)" }}>{k}</p><p style={{ margin: "4px 0 0", fontWeight: 600 }}>{v}</p></div>)}
          </div>
          {someUnknown && verify}
        </section>

        <div className="stack-sm" style={{ display: "flex", gap: 36, marginTop: 36, alignItems: "flex-start" }}>
          <article className="prose-vf" style={{ flex: 1, minWidth: 0 }}>
            <nav aria-label={t("common.onThisPage")} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {anchors.map(([id, text]) => <a key={id} href={`#${id}`} className="chip" style={{ textDecoration: "none" }}>{text}</a>)}
            </nav>
            {slides && <div style={{ marginTop: 20 }}><Slideshow slides={slides} labels={{ region: t("guide.photosOf", { country: c.country_name }), prev: t("guide.prevPhoto"), next: t("guide.nextPhoto"), photo: t("guide.photo"), of: t("guide.of") }} /></div>}

            {guide?.overview && (<><h2 id="overview">{label("overview")}</h2><p style={{ fontSize: 18 }}>{guide.overview}</p></>)}

            {options.length > 0 && (
              <>
                <h2 id="options">{optionsLabel}</h2>
                <div className="g2" style={{ gap: 14 }}>
                  {options.map((o) => (
                    <div key={o.name} className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                      <h3 className="disp" style={{ margin: 0, fontSize: 20, lineHeight: 1.25 }}>{o.name}</h3>
                      {o.status && <p style={{ margin: 0 }}><span className="mono" style={{ display: "inline-block", fontSize: 12, padding: "3px 9px", borderRadius: 6, background: "#FBE9C9", color: "var(--amber-text)", fontWeight: 600 }}>{o.status}</span></p>}
                      <p style={{ margin: 0, color: "#1E293B", fontSize: 16, lineHeight: 1.55, flex: 1 }}>{o.summary}</p>
                      {o.url && <a href={o.url} target="_blank" rel="noopener noreferrer nofollow" style={{ fontWeight: 600, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 6 }}>{t("guide.officialPage")} <ExternalLink size={15} aria-hidden /></a>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {whoFor.length > 0 && (<><h2 id="who">{label("who")}</h2>
              <div className="g2">{whoFor.map((w) => <div key={w} className="card" style={{ padding: 16, display: "flex", gap: 10 }}><BadgeCheck size={22} color="#8A5300" style={{ flex: "none" }} aria-hidden /><span>{w}</span></div>)}</div></>)}

            {docs.length > 0 && (<><h2 id="documents">{label("documents")}</h2><Checklist slug={c.slug} docs={docs} locale={locale} whatsapp={settings.whatsapp_number} /></>)}

            {funds && (<>
              <h2 id="funds">{label("funds")}</h2>
              <div className="sky" style={{ borderRadius: 18, padding: 24, color: "#fff" }}><p style={{ margin: 0, color: "#fff", fontSize: 18 }}>{funds}</p></div>
            </>)}

            <h2 id="steps">{label("steps")}</h2>
            <ol style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
              {c.steps.map((s, i) => (
                <li key={s.title} className="card" style={{ padding: 16, display: "flex", gap: 14 }}>
                  <span className="mono" style={{ flex: "none", width: 34, height: 34, borderRadius: "50%", background: "var(--navy)", color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{i + 1}</span>
                  <span><b>{s.title}</b><br />{s.detail}</span>
                </li>
              ))}
            </ol>

            {c.licensed_partner && <aside className="card" style={{ padding: 18, borderColor: "var(--stamp-purple)" }}><b>{t("ui.licensedPartner")}</b> {c.licensed_partner}</aside>}
            {imm && !c.licensed_partner && <aside className="card" style={{ padding: 18 }}>{t("choose.immNote")}</aside>}

            {c.refusal_reasons.length > 0 && (<>
              <h2 id="refusals">{label("refusals")}</h2>
              <div className="g2">{c.refusal_reasons.map((r) => <div key={r.title} className="card" style={{ padding: 16, borderInlineStart: "4px solid var(--bad)" }}><b>{r.title}</b><br />{r.detail}</div>)}</div>
            </>)}

            {extras.map((x) => <section key={x.heading}><h2>{x.heading}</h2><Md text={x.md} /></section>)}

            {!imm && (<>
              <h2 id="cost">{label("cost")}</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                  <thead><tr className="mono" style={{ textAlign: "start", fontSize: 12, color: "var(--muted-2)" }}><th style={{ padding: 10, textAlign: "start" }}>{t("ui.item")}</th><th style={{ padding: 10, textAlign: "start" }}>{t("ui.paidTo")}</th><th style={{ padding: 10, textAlign: "start" }}>{t("ui.amount")}</th><th style={{ padding: 10, textAlign: "start" }}>{t("ui.checked")}</th></tr></thead>
                  <tbody>
                    {feeRow(t("ui.embassyGovFee"), t("ui.embassy"), fee ? <>{fee}<LocalPrice text={fee} locale={locale} /></> : "—")}
                    {feeRow(t("ui.vfsFee"), t("ui.visaCentre"), vfs ?? "—")}
                    {feeRow(t("ui.serviceFee"), "Visafeast", svc)}
                  </tbody>
                </table>
              </div>
            </>)}

            {guide && (
              <>
                <h2 id="sources">{label("sources")}</h2>
                <p style={{ color: "var(--muted)", marginTop: 0 }}>{t("guide.readOn", { date: fmtDate(guide.checked, locale) })}</p>
                <ul style={{ paddingInlineStart: 20 }}>
                  {guide.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow">{s.label}</a></li>)}
                </ul>
              </>
            )}

            <h2 id="news">{label("news")}</h2>
            {news.length ? <ul>{news.map((n) => <li key={n.id}><a href={n.url} rel="nofollow noopener" target="_blank">{n.title}</a> <span className="mono" style={{ fontSize: 12, color: "var(--muted-2)" }}>· {n.source} · {fmtDate(n.published_at, locale)}</span></li>)}</ul>
              : <p style={{ color: "var(--muted)" }}>{t("news.none")}</p>}

            {faqs.length > 0 && (<><h2 id="faq">{t("ui.faq")}</h2><FaqList faqs={faqs} /></>)}
          </article>

          {/* Sidebar — not sticky (brief §6.2) */}
          <aside style={{ flex: "0 0 320px", maxWidth: "100%", display: "grid", gap: 18 }}>
            <div className="card" style={{ padding: 22 }}>
              <Image src="/photos/guide-happy-bust.webp" alt="" width={84} height={84} unoptimized style={{ display: "block", borderRadius: "50%", background: "#FBE9C9", marginBottom: 10 }} />
              <h2 className="disp" style={{ margin: "0 0 12px", fontSize: 22 }}>{t("cta.eligibility")}</h2>
              <div style={{ display: "grid", gap: 10 }}>
                <Link className="btn btn-primary" href={lp(locale, "/tools/eligibility")}><Search size={18} aria-hidden />{t("elig.h2")}</Link>
                <Link className="btn btn-dark" href={lp(locale, "/book")}><Calendar size={18} aria-hidden />{t("cta.book")}</Link>
                <a className="btn btn-wa" href={wa(`Hi Visafeast, I'd like help with the ${c.visa_name} for ${c.country_name}.`)}><MessageCircle size={18} aria-hidden />{t("cta.whatsapp")}</a>
                <Link href={lp(locale, "/tools/refusal-decoder")} style={{ textAlign: "center" }}>{t("nav.decoder")} →</Link>
              </div>
            </div>
            {siblings.slice(0, 3).map((s) => <Link key={s.href} className="card" style={{ padding: 18, textDecoration: "none" }} href={s.href}><b>{s.label} →</b></Link>)}
            {related.length > 0 && <div><p className="eyebrow" style={{ color: "var(--muted-2)" }}>{t("common.related")}</p><div style={{ display: "grid", gap: 12 }}>{related.slice(0, 3).map((r) => <BoardingPass key={r.slug} c={r} locale={locale} cta={t("cta.guide")} kindLabel={t(r.kind === "visit" ? "ui.kindVisit" : r.kind === "study" ? "ui.kindStudy" : "ui.kindImmigration")} />)}</div></div>}
          </aside>
        </div>
      </div>
      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, marginTop: 40 }} className="wrap">{t("ui.disclaimerShort")}</p>
    </>
  );
}
