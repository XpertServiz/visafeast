"use client";
import { useState } from "react";
import { DocUpload, type UploadText } from "./DocUpload";

export interface ServiceChoice { ask: string; choose: string; options: { value: string; label: string }[] }

/**
 * Send a document that is not on the checklist: the client names it first, then picks the file.
 * Before the client has a file, they also say what they need; the first upload then opens their file and gives them a Client ID.
 */
export function OtherDoc({ label, name, placeholder, text, service }: { label: string; name: string; placeholder: string; text: UploadText; service?: ServiceChoice }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("");
  const ready = title.trim().length >= 2 && (!service || kind !== "");
  return (
    <details style={{ marginTop: 14 }} open={Boolean(service)}>
      <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", fontWeight: 600 }}>{label}</summary>
      <div style={{ display: "grid", gap: 10 }}>
        {service && (
          <div><label className="lbl" htmlFor="od-s">{service.ask}</label>
            <select id="od-s" className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">{service.choose}</option>
              {service.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select></div>
        )}
        <div><label className="lbl" htmlFor="od-t">{name}</label><input id="od-t" className="field" value={title} maxLength={120} placeholder={placeholder} onChange={(e) => setTitle(e.target.value)} /></div>
        {ready && <DocUpload base="/api/portal" multiple title={title.trim()} service={kind || undefined} text={text} />}
      </div>
    </details>
  );
}
