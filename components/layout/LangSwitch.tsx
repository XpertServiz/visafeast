"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LOCALES, localeForCountry, localeMeta, lp, splitLocale, type Locale } from "@/config/locales";

const remember = (l: Locale) => { try { document.cookie = `vf_lang=${l};path=/;max-age=31536000;samesite=lax`; } catch { /* ignore */ } };
const readCookie = (name: string) => { try { return document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] ?? null; } catch { return null; } };

/** A plain link on purpose: a full page load changes the language, direction and fonts together, and the choice is remembered. */
function LangLink({ to, path, style, children }: { to: Locale; path: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return <a href={lp(to, path)} hrefLang={localeMeta(to).hreflang} lang={to} onClick={() => remember(to)} style={style}>{children}</a>;
}

/** Header switch: English and the visitor's own language (from their country), as two buttons. */
export function LangSwitch({ locale }: { locale: Locale }) {
  const { path } = splitLocale(usePathname() || "/");
  const [local, setLocal] = useState<Locale>(locale === "en" ? "ur" : locale);
  useEffect(() => {
    if (locale !== "en") return;
    const fromCountry = localeForCountry(readCookie("vf_cc"));
    if (fromCountry !== "en") setLocal(fromCountry);
  }, [locale]);
  const on = { background: "var(--amber)", color: "#0A1A33" };
  const off = { background: "transparent", color: "#fff" };
  const common = { borderRadius: 999, padding: "0 11px", minHeight: 40, display: "inline-flex", alignItems: "center", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" } as const;
  return (
    <div role="group" aria-label="Language" dir="ltr" style={{ display: "flex", border: "1px solid rgba(242,169,59,.5)", borderRadius: 999, padding: 3 }}>
      <LangLink to="en" path={path} style={{ ...common, ...(locale === "en" ? on : off) }}>EN</LangLink>
      <LangLink to={local} path={path} style={{ ...common, ...(locale === local ? on : off), ...(local === "ur" ? { fontFamily: "var(--font-urdu)", lineHeight: 1.6 } : {}) }}>{localeMeta(local).short}</LangLink>
    </div>
  );
}

/** Footer list of every language. Ordinary links, so visitors can pick any language and Google can find all of them. */
export function LangLinks({ locale }: { locale: Locale }) {
  const { path } = splitLocale(usePathname() || "/");
  return (
    <span style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
      {LOCALES.map((l) => <LangLink key={l.code} to={l.code} path={path} style={{ color: l.code === locale ? "var(--amber)" : "var(--on-navy)", textDecoration: "none", fontWeight: l.code === locale ? 600 : 400 }}>{l.native}</LangLink>)}
    </span>
  );
}
