// WhatsApp number check shared by the page and the server: Pakistani 03xx / +92, Saudi 05xxxxxxxx, or any +country-code number.
export function cleanPhone(raw: string): string | null {
  const p = raw.replace(/[\s()-]/g, "");
  if (/^(\+?92|0)?3\d{9}$/.test(p)) return "+92" + p.replace(/^(\+?92|0)/, "");
  if (/^05\d{8}$/.test(p)) return "+966" + p.slice(1);
  if (/^\+\d{10,15}$/.test(p)) return p;
  return null;
}
