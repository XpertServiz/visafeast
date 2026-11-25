"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { TYPES, TYPE_LABEL } from "@/config/reality-check";
import type { RcType, Verdict } from "@/config/reality-check";
import { VerdictBadge } from "./bits";

export interface CardData { slug: string; title: string; claim: string; summary: string; country: string | null; type: RcType; verdict: Verdict; verified_on: string; href: string }

/** Card grid with filter by country and type, and a search box. All in the browser: the page itself is static. */
export function RealityList({ cards }: { cards: CardData[] }) {
  const [country, setCountry] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const countries = useMemo(() => [...new Set(cards.map((c) => c.country).filter((x): x is string => !!x))].sort(), [cards]);
  const shown = cards.filter((c) => (!country || c.country === country) && (!type || c.type === type) && (!q.trim() || `${c.title} ${c.claim} ${c.country ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())));
  const field = { minHeight: 48 } as const;
  return (
    <>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", marginBottom: 20 }}>
        <label style={{ position: "relative", display: "block" }}>
          <span className="sr-only">Search</span>
          <Search size={18} aria-hidden style={{ position: "absolute", insetInlineStart: 12, top: 15, color: "var(--muted-2)" }} />
          <input className="field" style={{ ...field, paddingInlineStart: 38 }} type="search" placeholder="Search a claim" value={q} onChange={(e) => setQ(e.target.value)} maxLength={60} />
        </label>
        <label><span className="sr-only">Country</span>
          <select className="field" style={field} value={country} onChange={(e) => setCountry(e.target.value)}><option value="">All countries</option>{countries.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label><span className="sr-only">Type</span>
          <select className="field" style={field} value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></label>
      </div>
      {shown.length ? (
        <div className="g3" role="list">
          {shown.map((c) => (
            <Link role="listitem" key={c.slug} href={c.href} prefetch={false} className="card lift" style={{ padding: 20, textDecoration: "none", color: "var(--ink)", display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <VerdictBadge v={c.verdict} />
                <span className="mono" style={{ fontSize: 12, color: "var(--muted-2)" }}>{[c.country, TYPE_LABEL[c.type]].filter(Boolean).join(" · ")}</span>
              </span>
              <q style={{ fontWeight: 600, lineHeight: 1.4, quotes: "none" }}>&ldquo;{c.claim}&rdquo;</q>
              <span style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.55 }}>{c.summary}</span>
              <span className="mono" style={{ marginTop: "auto", fontSize: 12, color: "var(--muted-2)" }}>Last verified {c.verified_on}</span>
            </Link>
          ))}
        </div>
      ) : <p className="card" style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No fact-checks match yet. Try fewer words, or <Link href="/talk-with-aiman" style={{ fontWeight: 600 }}>talk with Aiman</Link>.</p>}
    </>
  );
}
