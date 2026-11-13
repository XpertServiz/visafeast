"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Upload } from "lucide-react";

export interface UploadText { choose: string; busy: string; tooBig: string; failed: string; done: string }
const MAX = 10 * 1024 * 1024;

/** Sends the file straight to private storage with a one-file ticket from our server, so big phone photos work. */
export function DocUpload({ base, docId, title, personId, service, text, label, variant = "dark" }: {
  base: string; docId?: string; title?: string; personId?: string; service?: string; text: UploadText; label?: string; variant?: "dark" | "outline";
}) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy">("idle");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(file: File) {
    if (file.size > MAX) { setMsg({ ok: false, text: text.tooBig }); return; }
    setState("busy"); setMsg(null);
    try {
      const r = await fetch(`${base}/upload-url`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ doc_id: docId, title, person_id: personId, service, mime: file.type, size: file.size }) });
      const t = await r.json();
      if (!r.ok || !t.ok) throw new Error(t.error || text.failed);
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
      const up = await sb.storage.from("case-documents").uploadToSignedUrl(t.path, t.token, file, { contentType: file.type });
      if (up.error) throw new Error(text.failed);
      const d = await fetch(`${base}/upload-done`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ doc_id: t.doc_id, path: t.path, file_name: file.name }) });
      const dj = await d.json();
      if (!d.ok || !dj.ok) throw new Error(dj.error || text.failed);
      setMsg({ ok: true, text: text.done });
      router.refresh();
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : text.failed }); }
    finally { setState("idle"); if (input.current) input.current.value = ""; }
  }

  return (
    <div>
      <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void send(f); }} />
      <button type="button" className={variant === "dark" ? "btn btn-dark" : "btn btn-outline"} style={{ minHeight: 44 }} disabled={state === "busy"} onClick={() => input.current?.click()}>
        <Upload size={18} aria-hidden />{state === "busy" ? text.busy : (label ?? text.choose)}
      </button>
      {msg && <p role={msg.ok ? "status" : "alert"} style={{ margin: "6px 0 0", fontSize: 14, color: msg.ok ? "var(--ok)" : "var(--bad)" }}>{msg.text}</p>}
    </div>
  );
}
