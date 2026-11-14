import "server-only";
import { siteConfig } from "@/config/site";

const isLocal = (u: string) => /localhost|127\.0\.0\.1|\[::1\]/.test(u);
/** True when running on a computer (not the real website): emails are only logged, so tests never reach the owner's or a client's inbox. Set ALLOW_LOCAL_EMAIL=1 to send for real. */
const devOnly = () => isLocal(siteConfig.url) && process.env.ALLOW_LOCAL_EMAIL !== "1";

/** Email the owner via Resend. Silently does nothing until RESEND_API_KEY is set. Never throws. */
export async function notifyOwner(subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (devOnly()) { console.info("[notify:local — not sent]", subject); return true; }
  if (!key) { console.info("[notify:skipped — no RESEND_API_KEY]", subject); return false; }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.RESEND_FROM || "Visafeast <no-reply@visafeast.com>", to: [process.env.OWNER_NOTIFY_EMAIL || "visafeast@gmail.com"], subject, html: emailShell(html) }),
    });
    return r.ok;
  } catch { return false; }
}

/** Email one person (for example a client whose sign-up was approved). Best effort: false when Resend is not set up or refuses. Never throws. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (devOnly() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) { console.info("[notify:local — not sent]", subject, "->", to.replace(/^[^@]+/, "***")); return true; }
  if (!key || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.RESEND_FROM || "Visafeast <no-reply@visafeast.com>", to: [to], subject, html: emailShell(html) }),
    });
    return r.ok;
  } catch { return false; }
}

/** Wraps an email in the Visafeast look: the logo banner on top, the message below. */
export function emailShell(inner: string): string {
  const base = siteConfig.url.replace(/\/$/, "");
  // pictures must load from the public site, never from a computer's localhost address
  const pic = isLocal(base) ? "https://www.visafeast.com" : base;
  return `<!doctype html><html><body style="margin:0;background:#F7F4EE"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE"><tr><td align="center" style="padding:20px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden"><tr><td style="background:#0A1A33"><a href="${pic}" style="display:block;color:#F2A93B;font:bold 22px Georgia,serif;text-decoration:none;line-height:78px;height:78px;overflow:hidden"><img src="${pic}/brand/email-header.png" width="600" height="78" alt="Visafeast" style="display:block;width:100%;max-width:600px;height:78px;border:0;color:#F2A93B;font:bold 22px/78px Georgia,serif"></a></td></tr><tr><td style="padding:20px 24px;font:15px/1.5 Arial,sans-serif;color:#0F172A">${inner}</td></tr></table></td></tr></table></body></html>`;
}

export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
