import "server-only";
import { serviceClient } from "../supabase";
import { esc, notifyOwner } from "./notify";

export interface LeadInput {
  name?: string; phone?: string; email?: string; city?: string; destination?: string; visa_type?: string;
  prior_refusal?: string; message?: string; source: string; page_path?: string; nationality?: string; residence_country?: string;
  eligibility?: unknown; utm?: unknown;
}

/** Normalise a Pakistani/international number to digits for de-duplication. */
export const normPhone = (p?: string) => (p ?? "").replace(/[^\d+]/g, "").replace(/^00/, "+").replace(/^0(3\d{9})$/, "+92$1");

/** Create/update the person (de-dup by WhatsApp number) and insert the lead. Falls back to a log when no DB is configured. */
export async function createLead(l: LeadInput): Promise<{ ok: boolean; id?: string; stored: boolean }> {
  const db = serviceClient();
  let id: string | undefined;
  if (db) {
    try {
      let person_id: string | null = null;
      const phone = normPhone(l.phone);
      if (phone) {
        const { data: p } = await db.from("people").upsert({ whatsapp: phone, full_name: l.name ?? null, email: l.email ?? null, city: l.city ?? null }, { onConflict: "whatsapp" }).select("id").single();
        person_id = p?.id ?? null;
      }
      const { data, error } = await db.from("leads").insert({
        name: l.name, phone, email: l.email, city: l.city, destination: l.destination, visa_type: l.visa_type, prior_refusal: l.prior_refusal,
        message: l.message, source: l.source, page_path: l.page_path, nationality: l.nationality, residence_country: l.residence_country,
        eligibility: l.eligibility ?? null, utm: l.utm ?? null, person_id,
      }).select("id").single();
      if (error) throw error;
      id = data?.id;
      if (person_id) await db.from("timeline_events").insert({ person_id, kind: "note", body: `New ${l.source} enquiry${l.destination ? " — " + l.destination : ""}` });
    } catch (e) { console.error("[lead:db-error]", e); }
  } else { console.info("[lead:no-db]", l.source, l.name); }

  void notifyOwner(`New ${l.source} enquiry — ${l.name ?? "no name"}`,
    `<h3>New ${esc(l.source)} enquiry</h3><p><b>${esc(l.name)}</b><br>WhatsApp: ${esc(l.phone)}<br>Email: ${esc(l.email)}<br>City: ${esc(l.city)}<br>Wants: ${esc(l.visa_type)} ${esc(l.destination)}<br>Passport: ${esc(l.nationality)} · Lives in: ${esc(l.residence_country)}<br>Refused before: ${esc(l.prior_refusal)}</p><p>${esc(l.message)}</p>`);
  return { ok: true, id, stored: Boolean(db && id) };
}
