"use client";
import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
import { issuePortalCode } from "@/app/admin/actions";
import { waLink } from "@/config/site";

/** Gives the client a one-time link by WhatsApp: to connect their login to this file, or to choose a new password. */
export function PortalAccess({ personId, name, whatsapp, hasLogin }: { personId: string; name: string; whatsapp: string | null; hasLogin: boolean }) {
  const [state, action, pending] = useActionState(issuePortalCode, null as { link?: string; kind?: string; error?: string } | null);
  const text = state?.link && (state.kind === "reset"
    ? `Assalam-o-Alaikum ${name}, use this one-time link to choose a new Visafeast password: ${state.link}`
    : `Assalam-o-Alaikum ${name}, open your Visafeast file here to send documents and chat with your consultant: ${state.link}`);
  return (
    <div>
      <p style={{ margin: "0 0 10px", color: "var(--muted)", fontSize: 15 }}>{hasLogin ? "This client has a login." : "This client has no login yet."} Links work once and last 14 days.</p>
      <form action={action}>
        <input type="hidden" name="person_id" value={personId} /><input type="hidden" name="kind" value={hasLogin ? "reset" : "join"} />
        <button className={hasLogin ? "btn btn-outline" : "btn btn-dark"} style={{ minHeight: 44 }} disabled={pending}>{hasLogin ? "New password link" : "Create client login link"}</button>
      </form>
      {state?.error && <p role="alert" style={{ color: "var(--bad)" }}>{state.error}</p>}
      {state?.link && (
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          <input readOnly value={state.link} className="field mono" aria-label="Link for the client" style={{ fontSize: 13 }} onFocus={(e) => e.currentTarget.select()} />
          {whatsapp && text && <a className="btn btn-wa" target="_blank" rel="noreferrer" href={waLink(text, whatsapp)}><MessageCircle size={18} aria-hidden />Send on WhatsApp</a>}
        </div>
      )}
    </div>
  );
}
