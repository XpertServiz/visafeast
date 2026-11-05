import "server-only";

/** Email the owner via Resend. Silently does nothing until RESEND_API_KEY is set. Never throws. */
export async function notifyOwner(subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.info("[notify:skipped — no RESEND_API_KEY]", subject); return false; }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.RESEND_FROM || "Visafeast <no-reply@visafeast.com>", to: [process.env.OWNER_NOTIFY_EMAIL || "visafeast@gmail.com"], subject, html }),
    });
    return r.ok;
  } catch { return false; }
}

export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
