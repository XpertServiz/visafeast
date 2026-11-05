import Link from "next/link";
import { Calendar, ChevronRight, MessageCircle, Plane, BadgeCheck, Search } from "lucide-react";
import type { Country } from "@/lib/types";
import { waLink, type Locale } from "@/config/site";
import { getT, lp } from "@/lib/i18n";
import { getCountriesFor, getFaqsFor, getNews, getSettings, isStale } from "@/lib/data";
import { LocalPrice } from "@/components/LocalPrice";
import { BreadcrumbItems } from "./Breadcrumb";
import { breadcrumbJsonLd, faqJsonLd, JsonLd } from "@/lib/seo";
import { BoardingPass, FaqList, Flag, Md, fmtDate, KIND_BASE } from "@/components/ui";
import { Checklist } from "./Checklist";
import { Photo } from "@/components/Photo";

export async function CountryPage({ c, locale }: { c: Country; locale: Locale }) {
  const t = getT(locale);
  const [settings, faqs, news, all] = await Promise.all([getSettings(), getFaqsFor(locale, c.slug), getNews({ country: c.country_code, limit: 3 }), getCountriesFor(locale)]);
  const base = KIND_BASE[c.kind];
  const stale = isStale(c.facts_last_checked);
  const wa = (q: string) => waLink(q, settings.whatsapp_number);
  const Unknown = () => <a href={wa(`Hi, what's the current ${c.visa_name} fee?`)} style={{ fontSize: 15 }}>{t("fallback")}</a>;
  const val = (v: string | null) => (v && !stale ? v : <Unknown />);
  const fee = (v: string | null) => (v && !stale ? <>{v}<LocalPrice text={v} locale={locale} /></> : <Unknown />);
  const domain = c.facts_source_url ? new URL(c.facts_source_url).hostname : null;
  const hubLabel = t(c.kind === "visit" ? "choose.visit" : c.kind === "study" ? "choose.study" : "choose.immigration");
  const related = c.related_slugs.map((s) => all.find((x) => x.slug === s)).filter(Boolean) as Country[];
  const counterpart = all.find((x) => x.country_code === c.country_code && x.kind !== c.kind && x.slug !== c.slug);

  const facts: [string, React.ReactNode][] = [
    [t("ui.visa"), c.visa_name],
    [t("ui.embassyFee"), fee(c.embassy_fee_text)],
    [t("ui.decisionTime"), val(c.processing_time_text)],
    [t("ui.stay"), val(c.max_stay_text)],
    [t("ui.applyWindow"), val(c.apply_window_text)],
    [t("ui.biometrics"), val(c.biometrics_text)],
  ];
  const anchors = [
    ["who", t("ui.whoFor")], ["documents", t("ui.documents")],
    ...(c.funds_md ? [["funds", t("ui.funds")]] : []),
    ["steps", t("ui.howItWorks")],
    ...(c.refusal_reasons.length ? [["refusals", t("ui.refusals")]] : []),
    ["cost", t("ui.totalCost")], ["news", t("ui.latestNews")], ["faq", t("ui.faq")],
  ];
  const feeRow = (label: string, who: string, amount: React.ReactNode) => (
    <tr key={label} style={{ borderTop: "1px solid var(--line)" }}><td style={{ padding: "12px 10px" }}>{label}</td><td style={{ padding: "12px 10px" }}>{who}</td><td style={{ padding: "12px 10px" }}>{amount}</td><td className="mono" style={{ padding: "12px 10px", fontSize: 13 }}>{c.facts_last_checked ? fmtDate(c.facts_last_checked, locale) : "—"}</td></tr>
  );
  const svc = settings.service_fee_mode === "quote" || !c.service_fee_pkr ? t("ui.contactQuote") : `${settings.service_fee_mode === "from" ? `${t("ui.from")} ` : ""}PKR ${c.service_fee_pkr.toLocaleString("en-PK")}`;
  const crumbs = [{ name: t("common.home"), path: lp(locale, "/") }, { name: hubLabel, path: lp(locale, `/${base}`) }, { name: c.country_name, path: lp(locale, `/${base}/${c.slug}`) }];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)} />}
      <header className="sky" style={{ paddingBlock: "36px 90px", color: "#fff" }}>
        <div className="wrap">
          <BreadcrumbItems items={[{ label: t("common.home"), href: lp(locale, "/") }, { label: hubLabel, href: lp(locale, `/${base}`) }, { label: c.country_name }]} />
          <div className="mono" dir="ltr" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 22, color: "var(--amber)", fontSize: 18, maxWidth: 420 }}>
            <span>{c.from_code}</span><span style={{ flex: 1, borderTop: "2px dashed rgba(242,169,59,.6)" }} /><Plane aria-hidden /><span style={{ flex: 1, borderTop: "2px dashed rgba(242,169,59,.6)" }} /><span>{c.to_code}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}><Flag code={c.flag} size={30} /><h1 className="disp h1" style={{ margin: 0, fontSize: 52, lineHeight: 1.1, fontWeight: 600 }}>{c.h1}</h1></div>
          <p style={{ fontSize: 19, color: "var(--on-navy)", maxWidth: 720, marginTop: 16 }}>{c.intro}</p>
          <p className="mono" style={{ fontSize: 12, letterSpacing: ".08em", color: "var(--on-navy-2)" }}>
            {t("common.lastChecked").toUpperCase()} {c.facts_last_checked ? fmtDate(c.facts_last_checked, locale).toUpperCase() : "—"} · {t("common.source").toUpperCase()}: {domain ? <a href={c.facts_source_url!} rel="nofollow noopener" style={{ color: "var(--amber)" }}>{domain}</a> : t("ui.toVerify")}
          </p>
        </div>
      </header>

      <div className="wrap" style={{ marginTop: -64, position: "relative" }}>
        <section aria-label="Quick facts" className="card" style={{ padding: 22, boxShadow: "0 18px 40px rgba(10,26,51,.12)" }}>
          <div className="g3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
            {facts.map(([k, v]) => <div key={k}><p className="eyebrow" style={{ margin: 0, fontSize: 12, color: "var(--muted-2)" }}>{k}</p><p style={{ margin: "4px 0 0", fontWeight: 600 }}>{v}</p></div>)}
          </div>
        </section>

        <div className="stack-sm" style={{ display: "flex", gap: 36, marginTop: 36, alignItems: "flex-start" }}>
          <article className="prose-vf" style={{ flex: 1, minWidth: 0 }}>
            <nav aria-label={t("common.onThisPage")} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {anchors.map(([id, label]) => <a key={id} href={`#${id}`} className="chip" style={{ textDecoration: "none" }}>{label}</a>)}
            </nav>
            <div style={{ marginTop: 20 }}><Photo slot={`country-${c.flag}`} aspect="21 / 9" locale={locale} priority /></div>

            <h2 id="who">{anchors[0][1]}</h2>
            <div className="g2">{c.who_for_md.map((w) => <div key={w} className="card" style={{ padding: 16, display: "flex", gap: 10 }}><BadgeCheck size={22} color="#2F6B3A" style={{ flex: "none" }} aria-hidden /><span>{w}</span></div>)}</div>

            <h2 id="documents">{anchors[1][1]}</h2>
            <Checklist slug={c.slug} docs={c.documents} locale={locale} whatsapp={settings.whatsapp_number} />

            {c.funds_md && (<>
              <h2 id="funds">{anchors.find((a) => a[0] === "funds")![1]}</h2>
              <div className="sky" style={{ borderRadius: 18, padding: 24, color: "#fff" }}><p style={{ margin: 0, color: "#fff", fontSize: 18 }}>{c.funds_md}</p></div>
            </>)}

            <h2 id="steps">{anchors.find((a) => a[0] === "steps")![1]}</h2>
            <ol style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
              {c.steps.map((s, i) => (
                <li key={s.title} className="card" style={{ padding: 16, display: "flex", gap: 14 }}>
                  <span className="mono" style={{ flex: "none", width: 34, height: 34, borderRadius: "50%", background: "var(--navy)", color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{i + 1}</span>
                  <span><b>{s.title}</b><br />{s.detail}</span>
                </li>
              ))}
            </ol>

            {c.licensed_partner && <aside className="card" style={{ padding: 18, borderColor: "var(--stamp-purple)" }}><b>{t("ui.licensedPartner")}</b> {c.licensed_partner}</aside>}
            {c.kind === "immigration" && !c.licensed_partner && <aside className="card" style={{ padding: 18 }}>{t("choose.immNote")}</aside>}

            {c.refusal_reasons.length > 0 && (<>
              <h2 id="refusals">{anchors.find((a) => a[0] === "refusals")![1]}</h2>
              <div className="g2">{c.refusal_reasons.map((r) => <div key={r.title} className="card" style={{ padding: 16, borderInlineStart: "4px solid var(--bad)" }}><b>{r.title}</b><br />{r.detail}</div>)}</div>
            </>)}

            {c.extra_sections.map((x) => <section key={x.heading}><h2>{x.heading}</h2><Md text={x.md} /></section>)}

            <h2 id="cost">{anchors.find((a) => a[0] === "cost")![1]}</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                <thead><tr className="mono" style={{ textAlign: "start", fontSize: 12, color: "var(--muted-2)" }}><th style={{ padding: 10, textAlign: "start" }}>{t("ui.item")}</th><th style={{ padding: 10, textAlign: "start" }}>{t("ui.paidTo")}</th><th style={{ padding: 10, textAlign: "start" }}>{t("ui.amount")}</th><th style={{ padding: 10, textAlign: "start" }}>{t("ui.checked")}</th></tr></thead>
                <tbody>
                  {feeRow(t("ui.embassyGovFee"), t("ui.embassy"), fee(c.embassy_fee_text))}
                  {feeRow(t("ui.vfsFee"), t("ui.visaCentre"), fee(c.vfs_fee_text))}
                  {feeRow(t("ui.serviceFee"), "Visafeast", svc)}
                </tbody>
              </table>
            </div>

            <h2 id="news">{anchors.find((a) => a[0] === "news")![1]}</h2>
            {news.length ? <ul>{news.map((n) => <li key={n.id}><a href={n.url} rel="nofollow noopener" target="_blank">{n.title}</a> <span className="mono" style={{ fontSize: 12, color: "var(--muted-2)" }}>· {n.source} · {fmtDate(n.published_at, locale)}</span></li>)}</ul>
              : <p style={{ color: "var(--muted)" }}>{t("news.none")}</p>}

            {faqs.length > 0 && (<><h2 id="faq">{t("ui.faq")}</h2><FaqList faqs={faqs} /></>)}
          </article>

          {/* Sidebar — not sticky (brief §6.2) */}
          <aside style={{ flex: "0 0 320px", maxWidth: "100%", display: "grid", gap: 18 }}>
            <div className="card" style={{ padding: 22 }}>
              <h2 className="disp" style={{ margin: "0 0 12px", fontSize: 22 }}>{t("cta.eligibility")}</h2>
              <div style={{ display: "grid", gap: 10 }}>
                <Link className="btn btn-primary" href={lp(locale, "/tools/eligibility")}><Search size={18} aria-hidden />{t("elig.h2")}</Link>
                <Link className="btn btn-dark" href={lp(locale, "/book")}><Calendar size={18} aria-hidden />{t("cta.book")}</Link>
                <a className="btn btn-wa" href={wa(`Hi Visafeast, I'd like help with the ${c.visa_name} for ${c.country_name}.`)}><MessageCircle size={18} aria-hidden />{t("cta.whatsapp")}</a>
                <Link href={lp(locale, "/tools/refusal-decoder")} style={{ textAlign: "center" }}>{t("nav.decoder")} →</Link>
              </div>
            </div>
            {counterpart && <Link className="card" style={{ padding: 18, textDecoration: "none" }} href={lp(locale, `/${KIND_BASE[counterpart.kind]}/${counterpart.slug}`)}><b>{counterpart.h1} →</b></Link>}
            {related.length > 0 && <div><p className="eyebrow" style={{ color: "var(--muted-2)" }}>{t("common.related")}</p><div style={{ display: "grid", gap: 12 }}>{related.slice(0, 3).map((r) => <BoardingPass key={r.slug} c={r} locale={locale} cta={t("cta.guide")} kindLabel={t(r.kind === "visit" ? "ui.kindVisit" : r.kind === "study" ? "ui.kindStudy" : "ui.kindImmigration")} />)}</div></div>}
          </aside>
        </div>
      </div>
      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, marginTop: 40 }} className="wrap">{t("ui.disclaimerShort")}</p>
    </>
  );
}
