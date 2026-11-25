import { AlertTriangle, CheckCircle2, CircleHelp, CircleDot } from "lucide-react";
import { VERDICT_LABEL, type Verdict } from "@/config/reality-check";
import { siteConfig } from "@/config/site";

const LOOK: Record<Verdict, { bg: string; fg: string; bd: string; Icon: typeof CheckCircle2 }> = {
  true: { bg: "var(--navy)", fg: "#fff", bd: "var(--navy)", Icon: CheckCircle2 },
  partly_true: { bg: "var(--amber)", fg: "var(--navy)", bd: "var(--amber)", Icon: CircleDot },
  misleading: { bg: "#FBE9C9", fg: "var(--amber-text)", bd: "var(--amber-text)", Icon: AlertTriangle },
  cannot_verify: { bg: "#EEF2F8", fg: "var(--muted)", bd: "var(--muted-2)", Icon: CircleHelp },
};

/** The verdict as a colour + icon + word, so it reads even without colour. */
export function VerdictBadge({ v, big = false }: { v: Verdict; big?: boolean }) {
  const { bg, fg, bd, Icon } = LOOK[v];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: bg, color: fg, border: `2px solid ${bd}`, borderRadius: 999, padding: big ? "8px 16px" : "3px 10px", fontWeight: 700, fontSize: big ? 18 : 13, whiteSpace: "nowrap" }}>
      <Icon size={big ? 22 : 15} aria-hidden />{VERDICT_LABEL[v]}
    </span>
  );
}

/** Phone, email and website from the site settings. */
export function ContactStrip() {
  const phone = siteConfig.whatsapp.replace(/^\+92/, "0");
  const site = siteConfig.url.replace(/^https?:\/\//, "");
  return (
    <p style={{ margin: 0, display: "flex", gap: "6px 22px", flexWrap: "wrap", fontWeight: 600 }}>
      <a href={`tel:${siteConfig.whatsapp}`} dir="ltr">{phone.replace(/^(\d{4})(\d{7})$/, "$1-$2")}</a>
      <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
      <a href="https://www.visafeast.com">www.visafeast.com</a>
      <span hidden>{site}</span>
    </p>
  );
}
