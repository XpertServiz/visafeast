"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authClient, getAdmin, can, type Admin } from "@/lib/server/admin-auth";
import { serviceClient } from "@/lib/supabase";
import { parseYouTube } from "@/lib/youtube";
import { fetchAllNews } from "@/lib/server/news";
import { HEADING_FONTS, BODY_FONTS, URDU_FONTS } from "@/lib/font-lists";
import { isTheme } from "@/lib/themes";

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
  await db.from("case_documents").update({ received: s(fd, "received") === "1", uploaded_at: new Date().toISOString() }).eq("id", s(fd, "id"));
  revalidatePath(`/admin/cases/${s(fd, "ref")}`);
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
  refreshSite(); revalidatePath("/admin/website/reviews");
}
export async function addWhatsappReview(fd: FormData) {
  const { a, db } = await need(can.website);
  if (s(fd, "confirm") !== "on") throw new Error("Please tick the confirmation: this client sent you the review and agreed to publish it.");
  await db.from("reviews").insert({ name: s(fd, "name"), city: s(fd, "city") || null, visa_type: s(fd, "visa_type") || null, rating: Math.min(5, Math.max(1, n(fd, "rating") || 5)), body: s(fd, "body"), consent: true, submitted_via: "whatsapp", admin_confirmed_client_consent: true, status: "approved", approved_at: new Date().toISOString() });
  await log(db, a, "review_added_whatsapp", "reviews");
  refreshSite(); revalidatePath("/admin/website/reviews");
}
export async function saveVideos(fd: FormData) {
  const { a, db } = await need(can.website);
  const urls = fd.getAll("url").map(String), titles = fd.getAll("title").map(String), caps = fd.getAll("caption").map(String), shorts = fd.getAll("short").map(String), actives = fd.getAll("active").map(String);
  const rows: Record<string, unknown>[] = []; const seen = new Set<string>();
  for (let i = 0; i < urls.length; i++) {
    if (!urls[i].trim()) continue;
    const p = parseYouTube(urls[i]);
    if (!p) throw new Error(`Video ${i + 1}: this is not a valid YouTube link.`);
    if (seen.has(p.id)) throw new Error(`Video ${i + 1}: this video is already in the list.`);
    seen.add(p.id);
    let title = titles[i]?.trim();
    if (!title) { try { const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(urls[i])}&format=json`); if (r.ok) title = (await r.json()).title; } catch { /* optional */ } }
    rows.push({ youtube_url: urls[i].trim(), video_id: p.id, title: title || null, caption: caps[i]?.trim() || null, is_short: p.isShort || shorts[i] === "1", is_active: actives[i] !== "0", sort_order: (rows.length + 1) * 10 });
  }
  await db.from("hero_videos").delete().neq("video_id", "");
  if (rows.length) await db.from("hero_videos").insert(rows);
  await log(db, a, "save_videos", "hero_videos", undefined, { count: rows.length });
  revalidatePath("/", "layout"); revalidatePath("/admin/website/videos");
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
  await log(db, a, "save_country_facts", "countries", s(fd, "id")); refreshSite(); revalidatePath("/admin/website/countries");
}
export async function toggleCountry(fd: FormData) {
  const { a, db } = await need(can.website);
  await db.from("countries").update({ is_published: s(fd, "publish") === "1", updated_at: new Date().toISOString() }).eq("id", s(fd, "id"));
  await log(db, a, "toggle_country", "countries", s(fd, "id")); refreshSite(); revalidatePath("/admin/website/countries");
}
export async function approveUrdu(fd: FormData) {
  const { db } = await need(can.website);
  await db.from("countries").update({ ur_status: s(fd, "status") }).eq("id", s(fd, "id")); refreshSite(); revalidatePath("/admin/website/countries");
}
export async function publishPost(fd: FormData) {
  const { a, db } = await need(can.website);
  await db.from("posts").update({ status: s(fd, "publish") === "1" ? "published" : "draft", published_at: s(fd, "publish") === "1" ? new Date().toISOString() : null, body_md: s(fd, "body_md") || undefined }).eq("id", s(fd, "id"));
  await log(db, a, "publish_post", "posts", s(fd, "id")); refreshSite(); revalidatePath("/admin/website/news");
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
    whatsapp_number: s(fd, "whatsapp_number") || "+16479662297", whatsapp_number_pk: t("whatsapp_number_pk"), email: s(fd, "email"), facebook_url: s(fd, "facebook_url"),
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
