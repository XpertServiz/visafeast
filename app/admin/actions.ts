"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authClient, getAdmin, can, type Admin } from "@/lib/server/admin-auth";
import { serviceClient } from "@/lib/supabase";
import { parseYouTube } from "@/lib/youtube";
import { fetchAllNews } from "@/lib/server/news";
import { HEADING_FONTS, BODY_FONTS, URDU_FONTS } from "@/lib/font-lists";
import { isTheme } from "@/lib/themes";
import { pingIndexNow } from "@/lib/server/indexnow";
import { hashCode, newCode } from "@/lib/portal";
import { docOwner } from "@/lib/server/portal";
import { siteConfig } from "@/config/site";
import { downloadPexelsImage, getPexelsPhoto } from "@/lib/server/pexels";
import { PHOTOS } from "@/lib/photos";
import sharp from "sharp";
import { llm, llmAvailable } from "@/lib/server/llm";
import { URDU_TRANSLATE_SYSTEM, cleanUrdu, urSource } from "@/lib/country-ur";
import type { Country } from "@/lib/types";

type Check = (r: Admin["role"]) => boolean;
async function need(check: Check = () => true): Promise<{ a: Admin; db: NonNullable<ReturnType<typeof serviceClient>> }> {
  const a = await getAdmin(); const db = serviceClient();
  if (!a || !db || !check(a.role)) redirect("/admin/login");
  return { a, db };
}
const s = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === "string" ? v.trim() : ""; };
const n = (fd: FormData, k: string) => Math.max(0, Math.round(Number(s(fd, k)) || 0));
const log = (db: NonNullable<ReturnType<typeof serviceClient>>, a: Admin, action: string, table: string, id?: string, meta?: unknown) =>
  db.from("activity_log").insert({ actor: a.id, action, target_table: table, target_id: id, meta: meta ?? null });
const refreshSite = () => revalidatePath("/", "layout");
const BASE = { visit: "visit-visa", study: "study-visa", immigration: "immigration" } as const;
/** Tell Bing/Yandex (IndexNow) that a country page changed — English and Urdu URLs. No-op until INDEXNOW_KEY is set. */
async function pingCountry(db: NonNullable<ReturnType<typeof serviceClient>>, id: string) {
  const { data: c } = await db.from("countries").select("slug,kind,is_published").eq("id", id).maybeSingle();
  if (c?.is_published) { const p = `/${BASE[c.kind as keyof typeof BASE]}/${c.slug}`; await pingIndexNow([p, `/ur${p}`]); }
}

// ---------- auth ----------
export async function signIn(_: unknown, fd: FormData) {
  const c = await authClient();
  if (!c) return { error: "Supabase is not set up yet." };
  const { error } = await c.auth.signInWithPassword({ email: s(fd, "email"), password: s(fd, "password") });
  if (error) return { error: "Wrong email or password." };
  redirect("/admin");
}
export async function signOut() { const c = await authClient(); await c?.auth.signOut(); redirect("/admin/login"); }

// ---------- people & cases ----------
export async function setLeadStatus(fd: FormData) {
  const { a, db } = await need(can.people);
  await db.from("leads").update({ status: s(fd, "status") }).eq("id", s(fd, "id"));
  await log(db, a, "lead_status", "leads", s(fd, "id"), { status: s(fd, "status") });
  revalidatePath("/admin/people"); revalidatePath("/admin");
}
export async function addEnquiry(fd: FormData) {
  const { a, db } = await need(can.people);
  const phone = s(fd, "phone").replace(/[^\d+]/g, "");
  const { data: p } = await db.from("people").upsert({ whatsapp: phone, full_name: s(fd, "name") }, { onConflict: "whatsapp" }).select("id").single();
  await db.from("leads").insert({ person_id: p?.id, name: s(fd, "name"), phone, destination: s(fd, "destination") || null, visa_type: s(fd, "visa_type") || "visit", source: "enquiry", message: s(fd, "message") || null });
  await log(db, a, "add_enquiry", "leads");
  revalidatePath("/admin/people"); revalidatePath("/admin");
}
export async function startCase(fd: FormData) {
  const { a, db } = await need(can.people);
  const personId = s(fd, "person_id"), service = s(fd, "service_type") || "visit", countryId = s(fd, "country_id") || null;
  const { data: ref } = await db.rpc("next_case_ref");
  const first = service === "immigration" ? "assessment" : "new";
  const { data: c, error } = await db.from("cases").insert({ ref, person_id: personId, service_type: service, country_id: countryId, stage: first, consultant_id: a.id, agreed_fee_pkr: n(fd, "fee") || null }).select("id,ref").single();
  if (error || !c) throw new Error(error?.message ?? "Could not start the case");
  await db.from("people").update({ is_client: true }).eq("id", personId);
  if (countryId) {
    const { data: co } = await db.from("countries").select("documents").eq("id", countryId).maybeSingle();
    const docs = (co?.documents ?? []) as { title: string }[];
    if (docs.length) await db.from("case_documents").insert(docs.map((d) => ({ case_id: c.id, title: d.title })));
  }
  await db.from("timeline_events").insert({ person_id: personId, case_id: c.id, kind: "stage_change", body: `Case ${c.ref} started`, actor: a.id });
  await log(db, a, "start_case", "cases", c.id);
  revalidatePath("/admin/cases"); revalidatePath("/admin/people");
  redirect(`/admin/cases/${c.ref}`);
}
export async function setCaseStage(fd: FormData) {
  const { a, db } = await need(can.people);
  const id = s(fd, "id"), stage = s(fd, "stage"), ref = s(fd, "ref");
  const patch: Record<string, unknown> = { stage };
  if (stage === "closed") patch.closed_at = new Date().toISOString();
  await db.from("cases").update(patch).eq("id", id);
  await db.from("timeline_events").insert({ case_id: id, kind: "stage_change", body: `Stage: ${stage}`, actor: a.id });
  revalidatePath(`/admin/cases/${ref}`); revalidatePath("/admin/cases");
}
export async function moveCase(fd: FormData) {
  const { a, db } = await need(can.people);
  const id = s(fd, "id"), stage = s(fd, "stage");
  const { data: c } = await db.from("cases").select("service_type").eq("id", id).maybeSingle();
  if (!c) return;
  const { data: ok } = await db.from("case_stage_templates").select("stage").eq("service_type", c.service_type).eq("stage", stage).maybeSingle();
  if (!ok) return; // only real stages of this service type
  const patch: Record<string, unknown> = { stage };
  if (stage === "closed") patch.closed_at = new Date().toISOString();
  if (stage === "submitted") patch.submitted_at = new Date().toISOString().slice(0, 10);
  await db.from("cases").update(patch).eq("id", id);
  await db.from("timeline_events").insert({ case_id: id, kind: "stage_change", body: `Stage: ${stage}`, actor: a.id });
  revalidatePath("/admin/cases"); revalidatePath(`/admin/cases/${s(fd, "ref")}`);
}
export async function recordDecision(fd: FormData) {
  const { a, db } = await need(can.people);
  const decision = s(fd, "decision");
  const months = Number((await db.from("settings").select("case_doc_retention_months").eq("id", 1).maybeSingle()).data?.case_doc_retention_months ?? 12);
  const del = new Date(); del.setMonth(del.getMonth() + months);
  await db.from("cases").update({ decision, decision_at: new Date().toISOString().slice(0, 10), stage: "closed", closed_at: new Date().toISOString() }).eq("id", s(fd, "id"));
  await db.from("case_documents").update({ delete_after: del.toISOString().slice(0, 10) }).eq("case_id", s(fd, "id"));
  await log(db, a, "decision", "cases", s(fd, "id"), { decision });
  revalidatePath(`/admin/cases/${s(fd, "ref")}`); revalidatePath("/admin/cases");
}
export async function toggleCaseDoc(fd: FormData) {
  const { db } = await need(can.people);
  const got = s(fd, "received") === "1";
  await db.from("case_documents").update({ received: got, status: got ? "approved" : "missing", uploaded_at: got ? new Date().toISOString() : null }).eq("id", s(fd, "id"));
  revalidatePath(s(fd, "path") || "/admin/cases");
}
// ---------- client portal: reviewing documents and giving access ----------
export async function reviewDoc(fd: FormData) {
  const { a, db } = await need(can.people);
  const id = s(fd, "id"), status = s(fd, "status") === "approved" ? "approved" : "rejected", note = s(fd, "note").slice(0, 500);
  const found = await docOwner(db, id);
  if (!found) return;
  await db.from("case_documents").update({ status, received: status === "approved", review_note: status === "rejected" ? note || null : null }).eq("id", id);
  if (status === "rejected") await db.from("client_messages").insert({ person_id: found.ownerId, sender: "staff", staff_id: a.id, body: `Please send "${found.doc.title}" again. ${note}`.trim() });
  await log(db, a, `doc_${status}`, "case_documents", id);
  revalidatePath(s(fd, "path") || "/admin/cases/documents"); revalidatePath("/admin");
}
export async function requestDoc(fd: FormData) {
  const { a, db } = await need(can.people);
  const personId = s(fd, "person_id"), caseId = s(fd, "case_id") || null, title = s(fd, "title").slice(0, 120);
  if (title.length < 2) return;
  await db.from("case_documents").insert(caseId ? { case_id: caseId, title } : { person_id: personId, title });
  await db.from("client_messages").insert({ person_id: personId, sender: "staff", staff_id: a.id, body: `Please send this document: ${title}` });
  await log(db, a, "doc_request", "case_documents", undefined, { title });
  revalidatePath(s(fd, "path") || "/admin/cases");
}
export async function issuePortalCode(_: unknown, fd: FormData): Promise<{ link?: string; kind?: string; error?: string }> {
  const { a, db } = await need(can.people);
  const personId = s(fd, "person_id"), kind = s(fd, "kind") === "reset" ? "reset" : "join";
  const code = newCode();
  await db.from("portal_codes").delete().eq("person_id", personId).eq("kind", kind).is("used_at", null);
  const { error } = await db.from("portal_codes").insert({ code_hash: hashCode(code), person_id: personId, kind, expires_at: new Date(Date.now() + 14 * 86400_000).toISOString(), created_by: a.id });
  if (error) return { error: "Could not create the link. Please try again." };
  await log(db, a, `portal_code_${kind}`, "people", personId);
  return { link: `${siteConfig.url}/portal/${kind === "reset" ? "reset" : "join"}?code=${code}`, kind };
}
export async function addNote(fd: FormData) {
  const { a, db } = await need(can.people);
  await db.from("timeline_events").insert({ person_id: s(fd, "person_id") || null, case_id: s(fd, "case_id") || null, kind: "note", body: s(fd, "body"), actor: a.id });
  revalidatePath(s(fd, "path") || "/admin");
}
export async function addReminder(fd: FormData) {
  const { a, db } = await need(can.people);
  await db.from("reminders").insert({ person_id: s(fd, "person_id") || null, case_id: s(fd, "case_id") || null, due_on: s(fd, "due_on"), note: s(fd, "note") || null, assigned_to: a.id });
  revalidatePath("/admin");
}
export async function doneReminder(fd: FormData) { const { db } = await need(can.people); await db.from("reminders").update({ done: true }).eq("id", s(fd, "id")); revalidatePath("/admin"); }

// ---------- money (everything posts via database functions, so the books always balance) ----------
export async function createInvoice(fd: FormData) {
  const { a, db } = await need(can.money);
  const year = new Date().getFullYear();
  const { count } = await db.from("invoices").select("id", { count: "exact", head: true }).gte("issue_date", `${year}-01-01`);
  const number = `VF-INV-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
  const { data: inv, error } = await db.from("invoices").insert({
    number, person_id: s(fd, "person_id"), case_id: s(fd, "case_id") || null, due_date: s(fd, "due_date") || null, language: s(fd, "language") || "en", partner_id: s(fd, "partner_id") || null,
  }).select("id").single();
  if (error || !inv) throw new Error(error?.message ?? "Could not create the invoice");
  const lines = [
    { line_type: "service", description: s(fd, "service_desc") || "Visa file preparation", amount_pkr: n(fd, "service") },
    { line_type: "pass_through", description: s(fd, "pt_desc") || "Embassy / visa centre fee (paid for you)", amount_pkr: n(fd, "pass_through") },
    { line_type: "discount", description: "Discount", amount_pkr: n(fd, "discount") },
  ].filter((l) => l.amount_pkr > 0).map((l) => ({ ...l, invoice_id: inv.id }));
  if (!lines.length) throw new Error("Add at least one amount");
  await db.from("invoice_lines").insert(lines);
  const { error: e2 } = await db.rpc("post_invoice", { p_invoice: inv.id });
  if (e2) throw new Error(e2.message);
  await log(db, a, "create_invoice", "invoices", inv.id, { number });
  revalidatePath("/admin/money"); revalidatePath("/admin");
}
export async function receivePayment(fd: FormData) {
  const { a, db } = await need(can.money);
  const invoiceId = s(fd, "invoice_id") || null;
  const { data: pay, error } = await db.from("payments").insert({
    invoice_id: invoiceId, person_id: s(fd, "person_id") || null, amount_pkr: n(fd, "amount"), paid_on: s(fd, "paid_on") || new Date().toISOString().slice(0, 10),
    method: s(fd, "method"), account_id: s(fd, "account_id"), reference: s(fd, "reference") || null, created_by: a.id,
  }).select("id").single();
  if (error || !pay) throw new Error(error?.message ?? "Could not save the payment");
  const { error: e2 } = await db.rpc("post_payment", { p_payment: pay.id });
  if (e2) { await db.from("payments").delete().eq("id", pay.id); throw new Error(e2.message); }
  await log(db, a, "receive_payment", "payments", pay.id);
  revalidatePath("/admin/money"); revalidatePath("/admin");
}
export async function addExpense(fd: FormData) {
  const { a, db } = await need(can.money);
  const { data: ex, error } = await db.from("expenses").insert({
    category_id: s(fd, "category_id"), amount_pkr: n(fd, "amount"), spent_on: s(fd, "spent_on") || new Date().toISOString().slice(0, 10),
    account_id: s(fd, "account_id"), vendor: s(fd, "vendor") || null, note: s(fd, "note") || null, case_id: s(fd, "case_id") || null, recurring: s(fd, "recurring") || "none",
  }).select("id").single();
  if (error || !ex) throw new Error(error?.message ?? "Could not save the expense");
  const { error: e2 } = await db.rpc("post_expense", { p_expense: ex.id });
  if (e2) { await db.from("expenses").delete().eq("id", ex.id); throw new Error(e2.message); }
  await log(db, a, "add_expense", "expenses", ex.id);
  revalidatePath("/admin/money"); revalidatePath("/admin");
}
export async function payEmbassyFee(fd: FormData) {
  const { a, db } = await need(can.money);
  const { data: x, error } = await db.from("pass_through_payments").insert({ case_id: s(fd, "case_id"), amount_pkr: n(fd, "amount"), paid_on: s(fd, "paid_on") || new Date().toISOString().slice(0, 10), account_id: s(fd, "account_id"), payee: s(fd, "payee") || "Embassy / VFS" }).select("id").single();
  if (error || !x) throw new Error(error?.message ?? "Could not save");
  const { error: e2 } = await db.rpc("post_pass_through", { p_id: x.id });
  if (e2) { await db.from("pass_through_payments").delete().eq("id", x.id); throw new Error(e2.message); }
  await log(db, a, "pay_embassy_fee", "pass_through_payments", x.id);
  revalidatePath("/admin/money");
}
export async function cancelInvoice(fd: FormData) {
  const { a, db } = await need(can.reports);
  const id = s(fd, "id");
  const { data: grp } = await db.from("ledger_entries").select("entry_group").eq("source_table", "invoices").eq("source_id", id).limit(1).maybeSingle();
  if (grp) { const { error } = await db.rpc("reverse_group", { p_group: grp.entry_group }); if (error) throw new Error(error.message); }
  await db.from("invoices").update({ status: "cancelled" }).eq("id", id);
  await log(db, a, "cancel_invoice", "invoices", id);
  revalidatePath("/admin/money");
}
export async function addMoneyAccount(fd: FormData) {
  const { a, db } = await need(can.settings);
  const opening = n(fd, "opening");
  const { data: acc } = await db.from("money_accounts").insert({ name: s(fd, "name"), kind: s(fd, "kind"), opening_balance_pkr: opening }).select("id").single();
  if (acc && opening > 0) await db.rpc("post_owner", { p_kind: "capital", p_amount: opening, p_account: acc.id });
  await log(db, a, "add_account", "money_accounts", acc?.id);
  revalidatePath("/admin/settings"); revalidatePath("/admin/money");
}
export async function takeMoneyOut(fd: FormData) {
  const { a, db } = await need(can.reports);
  const { error } = await db.rpc("post_owner", { p_kind: s(fd, "kind") === "in" ? "capital" : "drawings", p_amount: n(fd, "amount"), p_account: s(fd, "account_id") });
  if (error) throw new Error(error.message);
  await log(db, a, "owner_money", "ledger_entries");
  revalidatePath("/admin/money");
}
export async function closeMonth(fd: FormData) {
  const { a, db } = await need(can.reports);
  const month = `${s(fd, "month").slice(0, 7)}-01`;
  if (!/^\d{4}-\d{2}-01$/.test(month)) throw new Error("Choose a month");
  await db.from("period_locks").upsert({ month, locked_by: a.id });
  await log(db, a, "close_month", "period_locks", month);
  revalidatePath("/admin/money");
}
export async function addService(fd: FormData) {
  const { db } = await need(can.settings);
  await db.from("services").insert({ name: s(fd, "name"), default_fee_pkr: n(fd, "fee") });
  revalidatePath("/admin/settings");
}
export async function markCommissionPaid(fd: FormData) {
  const { a, db } = await need(can.reports);
  const { error } = await db.rpc("post_commission_paid", { p_commission: s(fd, "id"), p_account: s(fd, "account_id") });
  if (error) throw new Error(error.message);
  await log(db, a, "commission_paid", "commissions", s(fd, "id"));
  revalidatePath("/admin/money");
}

// ---------- website ----------
export async function moderateReview(fd: FormData) {
  const { a, db } = await need(can.website);
  const status = s(fd, "status"); // approved | rejected  (text is NEVER editable — brief §9.3)
  await db.from("reviews").update({ status, approved_at: status === "approved" ? new Date().toISOString() : null }).eq("id", s(fd, "id"));
  await log(db, a, `review_${status}`, "reviews", s(fd, "id"));
  refreshSite(); revalidatePath("/admin/reviews");
}
export async function addWhatsappReview(fd: FormData) {
  const { a, db } = await need(can.website);
  if (s(fd, "confirm") !== "on") throw new Error("Please tick the confirmation: this client sent you the review and agreed to publish it.");
  await db.from("reviews").insert({ name: s(fd, "name"), city: s(fd, "city") || null, visa_type: s(fd, "visa_type") || null, rating: Math.min(5, Math.max(1, n(fd, "rating") || 5)), body: s(fd, "body"), consent: true, submitted_via: "whatsapp", admin_confirmed_client_consent: true, status: "approved", approved_at: new Date().toISOString() });
  await log(db, a, "review_added_whatsapp", "reviews");
  refreshSite(); revalidatePath("/admin/reviews");
}
/** Videos tab: add ONE video to the end of the list (any YouTube link, including unlisted ones). */
export async function addVideo(fd: FormData): Promise<{ error?: string }> {
  const { a, db } = await need(can.website);
  const url = s(fd, "url");
  const p = parseYouTube(url);
  if (!p) return { error: "This is not a YouTube link we recognise. Paste the link from the Share button." };
  const { data: all } = await db.from("hero_videos").select("video_id,sort_order").order("sort_order", { ascending: false });
  if (all?.some((r) => r.video_id === p.id)) return { error: "This video is already in the list." };
  let title = s(fd, "title").slice(0, 120);
  if (!title) { try { const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`); if (r.ok) title = String((await r.json()).title ?? "").slice(0, 120); } catch { /* optional */ } }
  const { error } = await db.from("hero_videos").insert({ youtube_url: url, video_id: p.id, title: title || null, caption: s(fd, "caption").slice(0, 160) || null, is_short: p.isShort || s(fd, "short") === "1", is_active: true, sort_order: (all?.[0]?.sort_order ?? 0) + 10 });
  if (error) return { error: "Could not save the video. Please try again." };
  await log(db, a, "add_video", "hero_videos", p.id);
  refreshSite(); revalidatePath("/admin/videos");
  return {};
}
/** Videos tab: show/hide, move up/down or remove one video. */
export async function changeVideo(fd: FormData) {
  const { a, db } = await need(can.website);
  const id = s(fd, "id"), what = s(fd, "what");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  if (what === "remove") await db.from("hero_videos").delete().eq("id", id);
  else if (what === "show" || what === "hide") await db.from("hero_videos").update({ is_active: what === "show" }).eq("id", id);
  else if (what === "up" || what === "down") {
    const { data: all } = await db.from("hero_videos").select("id,sort_order").order("sort_order").order("created_at");
    const list = all ?? [], i = list.findIndex((r) => r.id === id), j = what === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    await Promise.all(list.map((r, k) => db.from("hero_videos").update({ sort_order: (k + 1) * 10 }).eq("id", r.id)));
  } else return;
  await log(db, a, `video_${what}`, "hero_videos", id);
  refreshSite(); revalidatePath("/admin/videos");
}
export async function saveAppearance(fd: FormData) {
  const { a, db } = await need(can.website);
  const pick = <T extends readonly string[]>(list: T, v: string, d: T[number]) => (list.includes(v) ? v : d);
  const theme = s(fd, "theme"), accent = s(fd, "accent_color");
  const style = ["plane_stamp", "globe_spin", "passport_open", "boarding_pass", "logo_fade", "off"].includes(s(fd, "splash_style")) ? s(fd, "splash_style") : "logo_fade";
  await db.from("settings").update({
    heading_font: pick(HEADING_FONTS, s(fd, "heading_font"), "Fraunces"), body_font: pick(BODY_FONTS, s(fd, "body_font"), "Inter"), urdu_font: pick(URDU_FONTS, s(fd, "urdu_font"), "Noto Nastaliq Urdu"),
    theme: isTheme(theme) ? theme : "night_flight", accent_color: /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "#F2A93B",
    splash_style: style, splash_duration_ms: Math.min(3000, Math.max(1000, n(fd, "splash_duration_ms") || 2200)), splash_once_per_session: s(fd, "splash_once") === "on",
    hero_globe_style: s(fd, "globe") === "dotted" ? "dotted" : "realistic", updated_at: new Date().toISOString(),
  }).eq("id", 1);
  await log(db, a, "save_appearance", "settings");
  refreshSite();
}
export async function resetAppearance() {
  const { a, db } = await need(can.website);
  await db.from("settings").update({ heading_font: "Fraunces", body_font: "Inter", urdu_font: "Noto Nastaliq Urdu", theme: "night_flight", accent_color: "#F2A93B", splash_style: "logo_fade", splash_duration_ms: 2200, splash_once_per_session: true }).eq("id", 1);
  await log(db, a, "reset_appearance", "settings"); refreshSite();
}
export async function markFactsChecked(fd: FormData) {
  const { a, db } = await need(can.website);
  await db.from("countries").update({ facts_last_checked: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() }).eq("id", s(fd, "id"));
  await log(db, a, "facts_checked", "countries", s(fd, "id")); refreshSite(); revalidatePath("/admin/website/countries");
}
export async function saveCountryFacts(fd: FormData) {
  const { a, db } = await need(can.website);
  const t = (k: string) => s(fd, k) || null;
  await db.from("countries").update({
    embassy_fee_text: t("embassy_fee_text"), embassy_fee_pkr: n(fd, "embassy_fee_pkr") || null, vfs_fee_text: t("vfs_fee_text"), service_fee_pkr: n(fd, "service_fee_pkr") || null,
    processing_time_text: t("processing_time_text"), max_stay_text: t("max_stay_text"), apply_window_text: t("apply_window_text"), biometrics_text: t("biometrics_text"),
    facts_source_url: t("facts_source_url"), facts_last_checked: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString(),
  }).eq("id", s(fd, "id"));
  await db.from("chat_cache").delete().neq("q_hash", "");
  await log(db, a, "save_country_facts", "countries", s(fd, "id")); await pingCountry(db, s(fd, "id")); refreshSite(); revalidatePath("/admin/website/countries");
}
export async function toggleCountry(fd: FormData) {
  const { a, db } = await need(can.website);
  await db.from("countries").update({ is_published: s(fd, "publish") === "1", updated_at: new Date().toISOString() }).eq("id", s(fd, "id"));
  await log(db, a, "toggle_country", "countries", s(fd, "id")); await pingCountry(db, s(fd, "id")); refreshSite(); revalidatePath("/admin/website/countries");
}
export async function approveUrdu(fd: FormData) {
  const { db } = await need(can.website);
  await db.from("countries").update({ ur_status: s(fd, "status") }).eq("id", s(fd, "id")); refreshSite(); revalidatePath("/admin/website/countries");
}
export async function publishPost(fd: FormData) {
  const { a, db } = await need(can.website);
  await db.from("posts").update({ status: s(fd, "publish") === "1" ? "published" : "draft", published_at: s(fd, "publish") === "1" ? new Date().toISOString() : null, body_md: s(fd, "body_md") || undefined }).eq("id", s(fd, "id"));
  await log(db, a, "publish_post", "posts", s(fd, "id"));
  if (s(fd, "publish") === "1") { const { data: p } = await db.from("posts").select("slug").eq("id", s(fd, "id")).maybeSingle(); if (p?.slug) await pingIndexNow([`/news/${p.slug}`, "/news"]); }
  refreshSite(); revalidatePath("/admin/website/news");
}
export async function fetchNewsNow() { const { a, db } = await need(can.website); const r = await fetchAllNews(); await log(db, a, "fetch_news", "news_items", undefined, r); refreshSite(); revalidatePath("/admin/website/news"); }
export async function saveNewsItem(fd: FormData) {
  const { db } = await need(can.website);
  await db.from("news_items").update({ is_relevant: s(fd, "relevant") !== "0", what_it_means: s(fd, "what") || null }).eq("id", s(fd, "id")); refreshSite(); revalidatePath("/admin/website/news");
}
export async function saveFaq(fd: FormData) {
  const { db } = await need(can.website);
  const id = s(fd, "id");
  const row = { question: s(fd, "question"), answer_md: s(fd, "answer"), country_id: s(fd, "country_id") || null, is_published: true };
  if (id) await db.from("faqs").update(row).eq("id", id); else await db.from("faqs").insert(row);
  refreshSite(); revalidatePath("/admin/website/faqs");
}
export async function deleteFaq(fd: FormData) { const { db } = await need(can.website); await db.from("faqs").delete().eq("id", s(fd, "id")); refreshSite(); revalidatePath("/admin/website/faqs"); }

// ---------- settings ----------
export async function saveSettings(fd: FormData) {
  const { a, db } = await need(can.settings);
  const t = (k: string) => s(fd, k) || null;
  await db.from("settings").update({
    whatsapp_number: s(fd, "whatsapp_number") || "+923076777020", whatsapp_number_pk: t("whatsapp_number_pk"), email: s(fd, "email"), facebook_url: s(fd, "facebook_url"),
    address_line: s(fd, "address_line"), office_hours: s(fd, "office_hours"), ntn: t("ntn"), calcom_link: s(fd, "calcom_link"),
    service_fee_mode: ["exact", "from", "quote"].includes(s(fd, "service_fee_mode")) ? s(fd, "service_fee_mode") : "quote",
    google_reviews_url: t("google_reviews_url"), youtube_channel_url: t("youtube_channel_url"), chatbot_enabled: s(fd, "chatbot_enabled") === "on",
    digest_auto_publish: s(fd, "digest_auto_publish") === "on", case_doc_retention_months: n(fd, "case_doc_retention_months") || 12, updated_at: new Date().toISOString(),
  }).eq("id", 1);
  await log(db, a, "save_settings", "settings"); refreshSite(); revalidatePath("/admin/settings");
}
export async function inviteTeamMember(fd: FormData) {
  const { a, db } = await need(can.settings);
  const email = s(fd, "email"), role = ["owner", "consultant", "editor"].includes(s(fd, "role")) ? s(fd, "role") : "editor";
  const { data, error } = await db.auth.admin.inviteUserByEmail(email);
  if (error || !data.user) throw new Error(error?.message ?? "Could not invite");
  await db.from("profiles").upsert({ id: data.user.id, full_name: s(fd, "name") || email, role });
  await log(db, a, "invite_member", "profiles", data.user.id, { role });
  revalidatePath("/admin/settings");
}

// ---------- photos (brief §4: royalty-free only, licence + credit recorded) ----------
async function storePhoto(db: NonNullable<ReturnType<typeof serviceClient>>, slot: string, raw: Buffer, meta: { alt: string; source: "pexels" | "owner"; source_url?: string; photographer?: string; licence: string }) {
  if (!(slot in PHOTOS)) throw new Error("Unknown photo place.");
  const img = await sharp(raw).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true });
  const path = `slots/${slot}-${Date.now()}.webp`;
  const up = await db.storage.from("media").upload(path, img.data, { contentType: "image/webp", upsert: true });
  if (up.error) throw new Error(up.error.message);
  await db.from("media").delete().eq("slot", slot);
  const { error } = await db.from("media").insert({ slot, storage_path: path, width: img.info.width, height: img.info.height, alt_en: meta.alt, source: meta.source, source_url: meta.source_url ?? null, photographer: meta.photographer ?? null, licence: meta.licence, used_on: [slot] });
  if (error) throw new Error(error.message);
}
export async function choosePexelsPhoto(fd: FormData) {
  const { a, db } = await need(can.website);
  const slot = s(fd, "slot"), p = await getPexelsPhoto(Number(s(fd, "photo_id")));
  if (!p) throw new Error("Could not find that photo on Pexels.");
  const raw = await downloadPexelsImage(p.large);
  if (!raw) throw new Error("Could not download the photo.");
  await storePhoto(db, slot, raw, { alt: s(fd, "alt") || p.alt || PHOTOS[slot]?.alt || "", source: "pexels", source_url: p.url, photographer: p.photographer, licence: "Pexels License (free for commercial use)" });
  await log(db, a, "photo_pexels", "media", slot, { pexels_id: p.id }); refreshSite(); revalidatePath("/admin/website/photos");
}
export async function uploadOwnPhoto(fd: FormData) {
  const { a, db } = await need(can.website);
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a photo first.");
  if (file.size > 10 * 1024 * 1024) throw new Error("The photo is bigger than 10 MB.");
  if (!/^image[/](jpeg|png|webp)$/.test(file.type)) throw new Error("Please choose a JPG, PNG or WebP photo.");
  if (s(fd, "mine") !== "on") throw new Error("Please tick the box: you own this photo or have the right to use it.");
  const slot = s(fd, "slot");
  await storePhoto(db, slot, Buffer.from(await file.arrayBuffer()), { alt: s(fd, "alt") || PHOTOS[slot]?.alt || "", source: "owner", licence: "Owner-supplied" });
  await log(db, a, "photo_upload", "media", slot); refreshSite(); revalidatePath("/admin/website/photos");
}
export async function removePhoto(fd: FormData) {
  const { a, db } = await need(can.website);
  await db.from("media").delete().eq("slot", s(fd, "slot"));
  await log(db, a, "photo_remove", "media", s(fd, "slot")); refreshSite(); revalidatePath("/admin/website/photos");
}

// ---------- Urdu draft (AI translates only; the owner approves before it is indexed) ----------
export async function draftUrdu(fd: FormData) {
  const { a, db } = await need(can.website);
  if (!llmAvailable()) throw new Error("AI drafting is not switched on. Ask for it in Settings, or add the Urdu text by hand.");
  const { data: c } = await db.from("countries").select("*").eq("id", s(fd, "id")).maybeSingle();
  if (!c) throw new Error("Page not found");
  const out = await llm(URDU_TRANSLATE_SYSTEM, JSON.stringify(urSource(c as Country)), 3500);
  if (!out) throw new Error("The AI did not answer. Please try again in a minute.");
  let parsed: unknown;
  try { parsed = JSON.parse(out.replace(/```json|```/g, "").trim()); } catch { throw new Error("The AI answer could not be read. Please try again."); }
  const clean = cleanUrdu(parsed, c as Country);
  if (!clean.h1 && !clean.intro) throw new Error("The AI answer was incomplete. Please try again.");
  await db.from("countries").update({ content_ur: clean, ur_status: "draft", updated_at: new Date().toISOString() }).eq("id", s(fd, "id"));
  await log(db, a, "draft_urdu", "countries", s(fd, "id"));
  refreshSite(); revalidatePath("/admin/website/countries");
}
