"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function LangSwitch({ locale }: { locale: "en" | "ur" }) {
  const pathname = usePathname() || "/";
  const base = pathname === "/ur" ? "/" : pathname.startsWith("/ur/") ? pathname.slice(3) : pathname;
  const en = base, ur = base === "/" ? "/ur" : `/ur${base}`;
  const remember = (l: string) => { try { document.cookie = `vf_lang=${l};path=/;max-age=31536000;samesite=lax`; } catch { /* ignore */ } };
  const on = { background: "var(--amber)", color: "#0A1A33" };
  const off = { background: "transparent", color: "#fff" };
  const common = { borderRadius: 999, padding: "0 11px", minHeight: 40, display: "inline-flex", alignItems: "center", fontWeight: 600, textDecoration: "none" } as const;
  return (
    <div role="group" aria-label="Language" style={{ display: "flex", border: "1px solid rgba(242,169,59,.5)", borderRadius: 999, padding: 3 }}>
      <Link href={en} hrefLang="en" lang="en" onClick={() => remember("en")} aria-current={locale === "en" ? "true" : undefined} style={{ ...common, ...(locale === "en" ? on : off) }}>EN</Link>
      <Link href={ur} hrefLang="ur" lang="ur" onClick={() => remember("ur")} aria-current={locale === "ur" ? "true" : undefined} style={{ ...common, ...(locale === "ur" ? on : off), fontFamily: "var(--font-urdu)", lineHeight: 1.6 }}>اردو</Link>
    </div>
  );
}
