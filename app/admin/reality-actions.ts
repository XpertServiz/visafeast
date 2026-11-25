"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { serviceClient } from "@/lib/supabase";
import { publishErrors, slugify, isType, isVerdict, bannedIn, type RcInput } from "@/lib/reality";
import { pingIndexNow } from "@/lib/server/indexnow";

const RESERVED = ["check-an-offer", "new"];
const s = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === "string" ? v.trim() : ""; };
async function need() {
  const a = await getAdmin(); const db = serviceClient();
  if (!a || !db || !can.website(a.role)) redirect("/admin/login");
  return { a, db };
}
const refresh = () => { revalidatePath("/", "layout"); };
const back = (id: string, msg: string, ok = false): never => redirect(`/admin/reality-check/${id}?${ok ? "ok" : "err"}=${encodeURIComponent(msg)}`);

/** Read the form into one post. Rows and sources come as numbered slots; empty slots are ignored. */
function parse(fd: FormData): RcInput {
  const rows: RcInput["rows"] = [];
  for (let i = 0; i < 10; i++) {
    const claim = s(fd, `row_claim_${i}`), rule = s(fd, `row_rule_${i}`), v = s(fd, `row_verdict_${i}`);
    if (claim || rule) rows.push({ claim, rule, verdict: isVerdict(v) ? v : "cannot_verify" });
  }
  const sources: RcInput["sources"] = [];
  for (let i = 0; i < 8; i++) { const url = s(fd, `src_url_${i}`), title = s(fd, `src_title_${i}`); if (url) sources.push({ title: title || url, url }); }
  const type = s(fd, "type"), verdict = s(fd, "verdict");
  return {
    slug: s(fd, "slug") || slugify(s(fd, "title")), title: s(fd, "title"), claim: s(fd, "claim"), country: s(fd, "country") || null,
    type: isType(type) ? type : "study", verdict: isVerdict(verdict) ? verdict : ("" as never),
    summary: s(fd, "summary"), what_true: s(fd, "what_true"), what_misleading: s(fd, "what_misleading"), what_missing: s(fd, "what_missing"),
    rows, checklist: s(fd, "checklist").split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 12), sources,
    verified_on: s(fd, "verified_on"), ur_summary: s(fd, "ur_summary") || null, status: "draft",
  };
}

/** Save the post. With intent "publish" it goes live only if every rule passes; otherwise it is saved as a draft and the reasons are shown. */
export async function saveReality(fd: FormData) {
  const { a, db } = await need();
  const id = s(fd, "id");
  const intent = s(fd, "intent");
  const c = parse(fd);
  if (!c.title) return back(id || "new", "Add a title first.");
  if (RESERVED.includes(c.slug)) c.slug = `${c.slug}-1`;
  const { data: set } = await db.from("reality_settings").select("do_not_name").eq("id", 1).maybeSingle();
  const names: string[] = set?.do_not_name ?? [];
  const errors = intent === "publish" ? publishErrors(c, names) : [];
  const wantsLive = intent === "publish" && errors.length === 0;
  const { data: prev } = id ? await db.from("reality_checks").select("status,published_at").eq("id", id).maybeSingle() : { data: null };
  const row = { ...c, status: wantsLive ? "published" : intent === "unpublish" ? "draft" : (prev?.status === "published" && intent !== "draft" ? "published" : "draft"), updated_at: new Date().toISOString(), published_at: wantsLive ? (prev?.published_at ?? new Date().toISOString()) : prev?.published_at ?? null };
  // a live post that is edited must keep passing the rules, or it drops back to a draft
  if (row.status === "published" && !wantsLive) { const e = publishErrors(c, names); if (e.length) { row.status = "draft"; errors.push(...e); } }
  if (!row.verdict) (row as { verdict: string }).verdict = "cannot_verify";
  const q = id ? db.from("reality_checks").update(row).eq("id", id).select("id,slug").single() : db.from("reality_checks").insert(row).select("id,slug").single();
  const { data, error } = await q;
  if (error || !data) return back(id || "new", error?.code === "23505" ? "That web address (slug) is already used. Change it." : "Could not save. Try again.");
  await db.from("activity_log").insert({ actor: a.id, action: wantsLive ? "reality_publish" : "reality_save", target_table: "reality_checks", target_id: data.id });
  refresh();
  if (wantsLive) void pingIndexNow([`/reality-check/${data.slug}`, "/reality-check"]).catch(() => {});
  if (errors.length) return back(data.id, `Saved as a draft. Not published yet: ${errors.join(" ")}`);
  return back(data.id, wantsLive ? "Published. It is live on the website." : "Saved.", true);
}

export async function setRealityStatus(fd: FormData) {
  const { a, db } = await need();
  const id = s(fd, "id"), to = s(fd, "to");
  const { data: r } = await db.from("reality_checks").select("*").eq("id", id).maybeSingle();
  if (!r) redirect("/admin/reality-check");
  if (to === "published") {
    const { data: set } = await db.from("reality_settings").select("do_not_name").eq("id", 1).maybeSingle();
    const e = publishErrors(r as RcInput, set?.do_not_name ?? []);
    if (e.length) return back(id, `Not published: ${e.join(" ")}`);
    await db.from("reality_checks").update({ status: "published", published_at: r.published_at ?? new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
  } else await db.from("reality_checks").update({ status: "draft", updated_at: new Date().toISOString() }).eq("id", id);
  await db.from("activity_log").insert({ actor: a.id, action: `reality_${to === "published" ? "publish" : "unpublish"}`, target_table: "reality_checks", target_id: id });
  refresh();
  return back(id, to === "published" ? "Published. It is live on the website." : "Taken off the website. It is a draft again.", true);
}

export async function markRealityVerified(fd: FormData) {
  const { db } = await need();
  const id = s(fd, "id");
  await db.from("reality_checks").update({ verified_on: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() }).eq("id", id);
  refresh();
  return back(id, "Last-verified date set to today. Only do this after you checked the official links again.", true);
}

export async function deleteReality(fd: FormData) {
  const { a, db } = await need();
  const id = s(fd, "id");
  await db.from("reality_checks").delete().eq("id", id);
  await db.from("activity_log").insert({ actor: a.id, action: "reality_delete", target_table: "reality_checks", target_id: id });
  refresh();
  redirect("/admin/reality-check");
}

export async function saveDoNotName(fd: FormData) {
  const { db } = await need();
  const list = s(fd, "names").split(/\r?\n|,/).map((x) => x.trim()).filter((x) => x.length >= 2).slice(0, 50);
  await db.from("reality_settings").update({ do_not_name: list, updated_at: new Date().toISOString() }).eq("id", 1);
  // a name the admin lists must not already sit in a live post
  const { data: live } = await db.from("reality_checks").select("id,title,claim,summary,what_true,what_misleading,what_missing,rows,checklist,sources,ur_summary,country").eq("status", "published");
  let pulled = 0;
  for (const p of live ?? []) {
    const text = JSON.stringify(p);
    if (bannedIn(text, list).some((h) => h.startsWith("the name"))) { await db.from("reality_checks").update({ status: "draft" }).eq("id", p.id); pulled++; }
  }
  if (pulled) refresh();
  redirect(`/admin/reality-check?ok=${encodeURIComponent(pulled ? `Saved. ${pulled} live post(s) used a listed name and went back to draft.` : "Saved.")}`);
}
