import Link from "next/link";
import { Plane } from "lucide-react";
import type { Country, Faq } from "@/lib/types";
import { lp } from "@/lib/i18n";
import type { Locale } from "@/config/site";

export const Flag = ({ code, size = 28 }: { code: string; size?: number }) => (
  <span className={`fi fi-${code.toLowerCase()}`} role="img" aria-label={code.toUpperCase()} style={{ width: size * 1.33, height: size, borderRadius: 4, boxShadow: "0 0 0 1px rgba(0,0,0,.1)", display: "inline-block", flex: "none", backgroundSize: "cover" }} />
);

export const KIND_BASE = { visit: "visit-visa", study: "study-visa", immigration: "immigration" } as const;
export const KIND_COLOR = { visit: "var(--stamp-blue)", study: "var(--bad)", immigration: "var(--stamp-purple)" } as const;

export function BoardingPass({ c, locale, cta }: { c: Country; locale: Locale; cta: string }) {
  return (
    <Link href={lp(locale, `/${KIND_BASE[c.kind]}/${c.slug}`)} className="card lift" style={{ textDecoration: "none", color: "var(--ink)", display: "block", overflow: "hidden" }}>
      <div style={{ padding: "18px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="eyebrow" style={{ color: KIND_COLOR[c.kind], fontSize: 12 }}>{c.kind.toUpperCase()}</span>
          <Flag code={c.flag} size={22} />
        </div>
        <div className="mono" dir="ltr" style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0 6px", fontSize: 14, color: "var(--muted-2)" }}>
          <span>{c.from_code}</span><span style={{ flex: 1, borderTop: "1.5px dashed #C9C0AE" }} /><Plane size={16} aria-hidden /><span style={{ flex: 1, borderTop: "1.5px dashed #C9C0AE" }} /><span>{c.to_code}</span>
        </div>
        <p className="disp" style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{c.country_name}</p>
        <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: 15 }}>{c.visa_name}</p>
      </div>
      <div className="perf" />
      <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", fontSize: 14 }}>
        <span className="mono" style={{ color: "var(--muted-2)", fontSize: 12 }}>{c.card_note}</span>
        <span style={{ color: "var(--amber-text)", fontWeight: 600 }}>{cta}</span>
      </div>
    </Link>
  );
}

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {faqs.map((f) => (
        <details key={f.id} className="card" style={{ padding: "4px 18px" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 18, minHeight: 52, display: "flex", alignItems: "center", listStyle: "none" }}>{f.question}</summary>
          <p style={{ margin: "0 0 16px", color: "#1E293B" }}>{f.answer_md}</p>
        </details>
      ))}
    </div>
  );
}

/** Very small, safe markdown subset: paragraphs, "- " bullets, **bold**, [links](https://…). No raw HTML is ever rendered. */
export function Md({ text }: { text: string }) {
  const inline = (s: string, k: string) => {
    const parts = s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
    return parts.map((p, i) => {
      const b = p.match(/^\*\*([^*]+)\*\*$/); if (b) return <strong key={k + i}>{b[1]}</strong>;
      const l = p.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/); if (l) return <a key={k + i} href={l[2]} rel="nofollow noopener" target="_blank">{l[1]}</a>;
      return p;
    });
  };
  const blocks = text.split(/\n{2,}/);
  return <>{blocks.map((blk, i) => {
    const lines = blk.split("\n");
    if (lines.every((x) => /^\s*[-*] /.test(x))) return <ul key={i}>{lines.map((x, j) => <li key={j}>{inline(x.replace(/^\s*[-*] /, ""), `${i}-${j}`)}</li>)}</ul>;
    if (/^#{2,3} /.test(blk)) return <h3 key={i}>{blk.replace(/^#+ /, "")}</h3>;
    return <p key={i}>{inline(blk, String(i))}</p>;
  })}</>;
}

export function Section({ id, title, children, tone = "paper" }: { id?: string; title?: React.ReactNode; children: React.ReactNode; tone?: "paper" | "white" | "navy" }) {
  const bg = tone === "navy" ? "sky" : "";
  return (
    <section id={id} className={bg} style={{ background: tone === "white" ? "#fff" : undefined, paddingBlock: 56, color: tone === "navy" ? "#fff" : undefined, scrollMarginTop: 12 }}>
      <div className="wrap">
        {title && <h2 className="disp" style={{ margin: "0 0 28px", fontSize: 38, fontWeight: 600, textAlign: "center" }}>{title}</h2>}
        {children}
      </div>
    </section>
  );
}

export function Stamp({ children, color = "var(--ok)", rot = -4 }: { children: React.ReactNode; color?: string; rot?: number }) {
  return <span className="mono" style={{ display: "inline-block", border: `2.5px solid ${color}`, color, padding: "4px 12px", borderRadius: 6, fontWeight: 600, letterSpacing: ".1em", fontSize: 13, transform: `rotate(${rot}deg)`, opacity: 0.9 }}>{children}</span>;
}

export function CalEmbed({ link, title }: { link: string; title: string }) {
  return <iframe title={title} src={`https://cal.com/${link}?embed=true&theme=light`} loading="lazy" style={{ width: "100%", height: 640, border: "1px solid var(--line)", borderRadius: 18, background: "#fff" }} />;
}

export const fmtDate = (d: string | null, locale: Locale) => (d ? new Date(d).toLocaleDateString(locale === "ur" ? "ur-PK" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
