"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export interface SendText { button: string; busy: string; done: string; failed: string; hint: string }

/** One tap tells the consultant "I have finished sending my files": the owner gets a single email for the whole batch. */
export function SendToConsultant({ count, text }: { count: number; text: SendText }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function go() {
    setState("busy");
    try {
      const r = await fetch("/api/portal/submit", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error);
      setState("done"); router.refresh();
    } catch { setState("error"); }
  }
  if (state === "done") return <p role="status" style={{ margin: "14px 0 0", padding: 12, borderRadius: 12, background: "#FBE9C9", color: "var(--navy)", fontWeight: 600 }}>{text.done}</p>;
  if (count < 1) return null;
  return (
    <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: "var(--passport)", border: "1px solid var(--line)" }}>
      <p style={{ margin: "0 0 10px", fontSize: 15 }}>{text.hint.replace("{n}", String(count))}</p>
      <button type="button" className="btn btn-primary" style={{ minHeight: 48, width: "100%" }} disabled={state === "busy"} onClick={go}><Send size={18} aria-hidden />{state === "busy" ? text.busy : text.button.replace("{n}", String(count))}</button>
      {state === "error" && <p role="alert" style={{ margin: "8px 0 0", color: "var(--bad)", fontSize: 14 }}>{text.failed}</p>}
    </div>
  );
}
