// Sends two real test emails through Resend with the website's own sender, to the business inbox (OWNER_NOTIFY_EMAIL).
// One looks like the owner's "sign-up request" notice, one like the client's "account approved" email. Prints only the result, never the key.
// Run: node tests/e2e/email.live.mjs
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const key = env.RESEND_API_KEY, from = env.RESEND_FROM || "Visafeast <no-reply@visafeast.com>", to = env.OWNER_NOTIFY_EMAIL || "visafeast@gmail.com";
if (!key) { console.log("FAIL  RESEND_API_KEY is empty"); process.exit(1); }
const send = async (subject, html) => {
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ from, to: [to], subject, html }) });
  const j = await r.json().catch(() => ({}));
  console.log(r.ok ? "PASS" : "FAIL", `HTTP ${r.status}`, subject, r.ok ? `(id ${j.id})` : JSON.stringify({ name: j.name, message: j.message }));
  return r.ok ? j.id : null;
};
const ids = [
  await send("TEST: Sign-up request: Test Client", "<p><b>Test Client</b> asked for a client account (this is only a test of the email).</p><p><a href=\"https://www.visafeast.com/admin/cases#requests\">Open Client files to approve or decline</a>.</p>"),
  await send("TEST: Your Visafeast account is approved", "<p>Assalam-o-Alaikum Test Client,</p><p>Your Visafeast client account is approved. You can sign in now (this is only a test of the email).</p><p dir=\"rtl\">آپ کا ویزا فیسٹ اکاؤنٹ منظور ہو گیا ہے۔</p>"),
];
// check the delivery status Resend reports a few seconds later
await new Promise((r) => setTimeout(r, 6000));
for (const id of ids.filter(Boolean)) {
  const r = await fetch(`https://api.resend.com/emails/${id}`, { headers: { Authorization: `Bearer ${key}` } });
  const j = await r.json().catch(() => ({}));
  console.log("status of", id.slice(0, 8), "->", j.last_event ?? j.status ?? `HTTP ${r.status}`);
}
process.exit(ids.every(Boolean) ? 0 : 1);
