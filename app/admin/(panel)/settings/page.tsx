import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { db } from "@/lib/server/admin-data";
import { Card, Field, Grid, Title, pkr } from "@/components/admin/ui";
import { addMoneyAccount, addService, inviteTeamMember, saveAimanFunds, saveSettings } from "../../actions";
import { DEFAULT_FUNDS, LABEL, mergeFunds, type CountryId } from "@/config/aiman";
import { DEFAULT_SETTINGS } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = (await getAdmin())!;
  if (!can.settings(admin.role)) redirect("/admin");
  const d = db();
  const [{ data: s }, { data: accounts }, { data: services }, { data: team }, { count: videos }] = await Promise.all([
    d.from("settings").select("*").eq("id", 1).maybeSingle(),
    d.from("money_accounts").select("id,name,kind"), d.from("services").select("id,name,default_fee_pkr").eq("is_active", true),
    d.from("profiles").select("id,full_name,role"), d.from("hero_videos").select("id", { count: "exact", head: true }),
  ]);
  const v = { ...DEFAULT_SETTINGS, ...(s ?? {}) } as Record<string, string | boolean | number | null>;
  const { data: ai } = await d.from("aiman_settings").select("funds").eq("id", 1).maybeSingle();
  const aiman = mergeFunds(ai?.funds);
  const t = (k: string) => String(v[k] ?? "");
  const checklist = [
    ["Business details", Boolean(s?.address_line)], ["WhatsApp number", Boolean(s?.whatsapp_number)], ["Cal.com link", Boolean(s?.calcom_link)],
    ["Bank / cash accounts", Boolean(accounts?.length)], ["Price list", Boolean(services?.length)], ["First YouTube video", Boolean(videos)],
  ] as const;

  return (
    <>
      <Title sub="Your business details and accounts.">Settings</Title>
      <Card title={`Setup checklist (${checklist.filter((c) => c[1]).length}/6 done)`}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>{checklist.map(([l, ok]) => <li key={l}>{ok ? "✓" : "○"} <span style={{ color: ok ? "var(--ok)" : undefined }}>{l}</span></li>)}</ul>
      </Card>
      <div style={{ height: 16 }} />
      <Grid min={360}>
        <Card title="Business details">
          <form action={saveSettings} style={{ display: "grid", gap: 10 }}>
            <Field label="WhatsApp number"><input name="whatsapp_number" defaultValue={t("whatsapp_number")} className="field" dir="ltr" /></Field>
            <Field label="Second WhatsApp number (Pakistan, optional)"><input name="whatsapp_number_pk" defaultValue={t("whatsapp_number_pk")} className="field" dir="ltr" /></Field>
            <Field label="Email"><input name="email" defaultValue={t("email")} className="field" type="email" /></Field>
            <Field label="Address / where you work"><input name="address_line" defaultValue={t("address_line")} className="field" /></Field>
            <Field label="Office hours"><input name="office_hours" defaultValue={t("office_hours")} className="field" /></Field>
            <Field label="NTN (optional)"><input name="ntn" defaultValue={t("ntn")} className="field" /></Field>
            <Field label="Facebook page"><input name="facebook_url" defaultValue={t("facebook_url")} className="field" /></Field>
            <Field label="YouTube channel link"><input name="youtube_channel_url" defaultValue={t("youtube_channel_url")} className="field" /></Field>
            <Field label="Google reviews link"><input name="google_reviews_url" defaultValue={t("google_reviews_url")} className="field" /></Field>
            <Field label="Cal.com link (e.g. visa-feast-pvus5i/15min)"><input name="calcom_link" defaultValue={t("calcom_link")} className="field" /></Field>
            <Field label="Show our service fees as"><select name="service_fee_mode" defaultValue={t("service_fee_mode")} className="field"><option value="quote">Contact for quote</option><option value="from">From PKR …</option><option value="exact">Exact amount</option></select></Field>
            <Field label="Delete client documents after (months)"><input name="case_doc_retention_months" type="number" defaultValue={t("case_doc_retention_months") || "12"} className="field" /></Field>
            <label><input type="checkbox" name="chatbot_enabled" defaultChecked={v.chatbot_enabled !== false} style={{ width: 20, height: 20, marginInlineEnd: 8 }} />Show the chat assistant on the website</label>
            <label><input type="checkbox" name="digest_auto_publish" defaultChecked={Boolean(v.digest_auto_publish)} style={{ width: 20, height: 20, marginInlineEnd: 8 }} />Publish the weekly digest automatically (not recommended)</label>
            <button className="btn btn-primary">Save</button>
          </form>
        </Card>

        <Card title="Where your money is kept">
          {accounts?.map((a) => <p key={a.id} style={{ margin: "6px 0" }}>{a.name} <span style={{ color: "var(--muted)" }}>({a.kind})</span></p>)}
          <form action={addMoneyAccount} style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <Field label="Name (e.g. Meezan Bank)"><input name="name" required className="field" /></Field>
            <Field label="Type"><select name="kind" className="field"><option value="cash">Cash in hand</option><option value="bank">Bank account</option><option value="wallet">JazzCash / Easypaisa</option></select></Field>
            <Field label="Balance right now (PKR)"><input name="opening" type="number" min={0} defaultValue={0} className="field" /></Field>
            <button className="btn btn-dark">Add account</button>
          </form>
        </Card>

        <Card title="Price list">
          {services?.map((x) => <p key={x.id} style={{ margin: "6px 0" }}>{x.name} — {pkr(x.default_fee_pkr)}</p>)}
          <form action={addService} style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <Field label="Service"><input name="name" required className="field" placeholder="UK visit visa — file preparation" /></Field>
            <Field label="Fee (PKR)"><input name="fee" type="number" min={0} required className="field" /></Field>
            <button className="btn btn-dark">Add to price list</button>
          </form>
        </Card>

        <Card title="Aiman funds (lacs of PKR)">
          <p style={{ margin: "0 0 12px", color: "var(--muted)" }}>Money the Talk with Aiman page expects, in lacs. Visit and work/PR figures are per person; study is for the first applicant plus the extra for each family member. Change a number and save: the page and the server use it straight away.</p>
          <form action={saveAimanFunds} style={{ display: "grid", gap: 14 }}>
            <b>Visit, per person</b>
            <Grid min={150}>{(Object.keys(DEFAULT_FUNDS.visit) as CountryId[]).map((c) => <Field key={c} label={LABEL[c][0]}><input name={`v_${c}`} type="number" min={0} max={1000} step="0.5" defaultValue={aiman.visit[c]} className="field" inputMode="decimal" /></Field>)}</Grid>
            <b>Study, first applicant</b>
            <Grid min={150}>{(Object.keys(DEFAULT_FUNDS.study) as CountryId[]).map((c) => <Field key={c} label={LABEL[c][0]}><input name={`s_${c}`} type="number" min={0} max={1000} step="0.5" defaultValue={aiman.study[c]} className="field" inputMode="decimal" /></Field>)}</Grid>
            <Grid min={170}>
              <Field label="Study: extra per family member"><input name="studyPerDependant" type="number" min={0} max={1000} step="0.5" defaultValue={aiman.studyPerDependant} className="field" /></Field>
              <Field label="Work abroad, per person"><input name="workPerPerson" type="number" min={0} max={1000} step="0.5" defaultValue={aiman.workPerPerson} className="field" /></Field>
              <Field label="Settle abroad (PR), per person"><input name="prPerPerson" type="number" min={0} max={1000} step="0.5" defaultValue={aiman.prPerPerson} className="field" /></Field>
            </Grid>
            <button className="btn btn-primary" style={{ justifySelf: "start" }}>Save funds</button>
          </form>
        </Card>
        <Card title="Team">
          {team?.map((p) => <p key={p.id} style={{ margin: "6px 0" }}>{p.full_name} — <b>{p.role}</b></p>)}
          <form action={inviteTeamMember} style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <Field label="Name"><input name="name" className="field" /></Field>
            <Field label="Email"><input name="email" type="email" required className="field" /></Field>
            <Field label="Can do"><select name="role" className="field"><option value="consultant">Consultant — people, cases, invoices (no profit reports)</option><option value="editor">Editor — website only</option><option value="owner">Owner — everything</option></select></Field>
            <button className="btn btn-dark">Send invitation</button>
          </form>
        </Card>
      </Grid>
    </>
  );
}
