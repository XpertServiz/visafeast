import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, Clock, FileText, RotateCcw, Upload } from "lucide-react";
import { pageCtx } from "@/lib/page";
import { lp } from "@/lib/i18n";
import { serviceClient } from "@/lib/supabase";
import { getClient, readMessages } from "@/lib/server/portal";
import { buildTimeline, nextStep } from "@/lib/track";
import { clientMayUpload, type DocStatus } from "@/lib/portal";
import { DocUpload } from "@/components/portal/DocUpload";
import { ChatThread } from "@/components/portal/ChatThread";
import { SignOutButton } from "@/components/portal/AuthForms";
import { OtherDoc } from "@/components/portal/OtherDoc";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My file | Visafeast", robots: { index: false, follow: false } };

type P = { params: Promise<{ locale: string }> };
type Row = { id: string; ref: string; service_type: string; stage: string; decision: string | null; visa_or_pathway: string | null; country: { country_name: string } | null };
type Doc = { id: string; title: string; status: DocStatus; file_path: string | null; file_name: string | null; review_note: string | null; required: boolean; case_id: string | null };

const STATUS = {
  missing: { Icon: Upload, color: "var(--amber-text)", bg: "#FFF3DC" },
  uploaded: { Icon: Clock, color: "var(--stamp-blue)", bg: "#E6EEF8" },
  approved: { Icon: Check, color: "var(--ok)", bg: "#FBE9C9" },
  rejected: { Icon: RotateCcw, color: "var(--bad)", bg: "#E6EEF8" },
} as const;

export default async function Portal({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const me = await getClient();
  const db = serviceClient();
  if (!me || !db) redirect(lp(locale, "/portal/login"));
  const pid = me.person.id;

  const { data: cs } = await db.from("cases").select("id,ref,service_type,stage,decision,visa_or_pathway,country:countries(country_name)").eq("person_id", pid).is("deleted_at", null).order("created_at", { ascending: false });
  const cases = (cs ?? []) as unknown as Row[];
  const ids = cases.map((c) => c.id);
  const [{ data: tpl }, { data: dd }, messages] = await Promise.all([
    db.from("case_stage_templates").select("service_type,stage,label_en,label_ur,sort"),
    db.from("case_documents").select("id,title,status,file_path,file_name,review_note,required,case_id").or(ids.length ? `person_id.eq.${pid},case_id.in.(${ids.join(",")})` : `person_id.eq.${pid}`).order("title"),
    readMessages(db, pid),
  ]);
  const docs = ((dd ?? []) as Doc[]).sort((a, b) => order(a.status) - order(b.status));
  if (messages.some((m) => m.sender === "staff")) await db.from("client_messages").update({ read_by_client_at: new Date().toISOString() }).eq("person_id", pid).eq("sender", "staff").is("read_by_client_at", null);

  const upText = { choose: t("portal.up_choose"), busy: t("portal.up_busy"), tooBig: t("portal.up_tooBig"), failed: t("portal.up_failed"), done: t("portal.up_done") };
  const chatText = { placeholder: t("portal.c_placeholder"), send: t("portal.c_send"), empty: t("portal.c_empty"), me: t("portal.c_me"), them: t("portal.c_them"), failed: t("portal.c_failed") };

  return (
    <>
      <header className="sky" style={{ paddingBlock: "32px 40px", color: "#fff" }}>
        <div className="wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div><p style={{ margin: 0, color: "var(--on-navy)" }}>{t("portal.hello")}, {me.person.full_name}</p><h1 className="disp h1" style={{ margin: "4px 0 0", fontSize: 44, fontWeight: 600 }}>{t("portal.dashTitle")}</h1></div>
          <SignOutButton locale={locale} />
        </div>
      </header>

      <div className="wrap g2" style={{ paddingBlock: 28, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 20, minWidth: 0 }}>
          <section className="card" style={{ padding: 22 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>{t("portal.status")}</h2>
            {cases.length === 0 && <p style={{ margin: 0 }}>{t("portal.noCase")}</p>}
            {cases.map((c) => (
              <div key={c.id} style={{ marginBottom: 12 }}>
                <p style={{ margin: "0 0 4px", color: "var(--muted)", fontSize: 14 }}>{t("portal.clientId")}</p>
                <p style={{ margin: "0 0 10px", fontSize: 22 }}><b className="mono" dir="ltr">{c.ref}</b> <span style={{ fontSize: 16, color: "var(--muted)" }}>· {c.country?.country_name ?? ""} {c.visa_or_pathway ?? ""}</span></p>
                <p style={{ margin: "0 0 12px" }}><b>{t("portal.currentStatus")}:</b> <span style={{ display: "inline-block", marginInlineStart: 6, padding: "4px 12px", borderRadius: 99, background: "var(--amber)", color: "var(--navy)", fontWeight: 700 }}>{(tpl ?? []).find((x) => x.service_type === c.service_type && x.stage === c.stage)?.[locale === "ur" ? "label_ur" : "label_en"] || c.stage}</span></p>
                <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                  {buildTimeline((tpl ?? []).filter((x) => x.service_type === c.service_type), c.stage, locale === "ur" ? "ur" : "en").map((s) => (
                    <li key={s.stage} style={{ display: "flex", gap: 10, alignItems: "center", opacity: s.state === "todo" ? 0.5 : 1, fontWeight: s.state === "current" ? 700 : 500 }}>
                      <span aria-hidden style={{ flex: "0 0 24px", height: 24, borderRadius: 99, display: "grid", placeItems: "center", background: s.state === "done" ? "var(--ok)" : s.state === "current" ? "var(--amber)" : "#E4DED3", color: s.state === "done" ? "#fff" : "#0A1A33" }}>{s.state === "done" ? <Check size={15} /> : ""}</span>{s.label}
                    </li>
                  ))}
                </ol>
                <p style={{ margin: "12px 0 0", padding: 12, borderRadius: 12, background: "var(--passport)" }}><b>{t("portal.next")}:</b> {nextStep(c.stage, locale === "ur" ? "ur" : "en")}</p>
                {c.decision && <p style={{ marginBottom: 0 }}>{t(`portal.${c.decision}`)}</p>}
              </div>
            ))}
          </section>

          <section className="card" id="chat" style={{ padding: 22, scrollMarginTop: 16 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>{t("portal.chat")}</h2>
            <ChatThread endpoint="/api/portal/messages" me="client" initial={messages} text={chatText} />
          </section>
        </div>

        <section className="card" style={{ padding: 22, minWidth: 0 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 22 }}>{t("portal.docs")}</h2>
          <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 15 }}>{t("portal.upHelp")}</p>
          {docs.length === 0 && <p>{t("portal.noDocs")}</p>}
          <div style={{ display: "grid", gap: 10 }}>
            {docs.map((d) => {
              const s = STATUS[d.status] ?? STATUS.missing;
              return (
                <div key={d.id} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span aria-hidden style={{ flex: "0 0 36px", height: 36, borderRadius: 10, background: s.bg, color: s.color, display: "grid", placeItems: "center" }}><s.Icon size={18} /></span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <b style={{ overflowWrap: "anywhere" }}>{d.title}</b><br />
                      <span style={{ color: s.color, fontSize: 14, fontWeight: 600 }}>{t(`portal.st_${d.status}`)}</span>
                      {d.review_note && d.status === "rejected" && <p dir="auto" style={{ margin: "4px 0 0", fontSize: 15 }}>{d.review_note}</p>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "flex-start" }}>
                    {d.file_path && <a className="btn btn-outline" style={{ minHeight: 44 }} href={`/api/portal/doc/${d.id}`}><FileText size={18} aria-hidden />{t("portal.view")}</a>}
                    {clientMayUpload(d.status) && <DocUpload base="/api/portal" docId={d.id} text={upText} label={d.file_path ? t("portal.up_replace") : undefined} variant={d.file_path ? "outline" : "dark"} />}
                  </div>
                </div>
              );
            })}
          </div>
          <OtherDoc label={t("portal.addOther")} name={t("portal.otherName")} placeholder={t("portal.otherPlaceholder")} text={upText}
            service={cases.length === 0 ? { ask: t("portal.serviceAsk"), choose: t("portal.serviceChoose"), options: [{ value: "visit", label: t("ui.kindVisit") }, { value: "study", label: t("ui.kindStudy") }, { value: "work", label: t("ui.kindWork") }, { value: "immigration", label: t("ui.kindImmigration") }] } : undefined} />
        </section>
      </div>
    </>
  );
}
const order = (s: string) => ({ rejected: 0, missing: 1, uploaded: 2, approved: 3 }[s] ?? 4);
