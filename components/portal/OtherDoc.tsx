"use client";
import { useState } from "react";
import { DocUpload, type UploadText } from "./DocUpload";

/** Send a document that is not on the checklist: the client names it first, then picks the file. */
export function OtherDoc({ label, name, placeholder, text }: { label: string; name: string; placeholder: string; text: UploadText }) {
  const [title, setTitle] = useState("");
  return (
    <details style={{ marginTop: 14 }}>
      <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", fontWeight: 600 }}>{label}</summary>
      <div style={{ display: "grid", gap: 10 }}>
        <div><label className="lbl" htmlFor="od-t">{name}</label><input id="od-t" className="field" value={title} maxLength={120} placeholder={placeholder} onChange={(e) => setTitle(e.target.value)} /></div>
        {title.trim().length >= 2 && <DocUpload base="/api/portal" title={title.trim()} text={text} />}
      </div>
    </details>
  );
}
