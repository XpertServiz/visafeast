"use client";
import { useState } from "react";
import Link from "next/link";
import { Flag } from "@/components/ui";
import { LocalPrice } from "@/components/LocalPrice";
import type { Locale } from "@/config/locales";

export interface CompareItem { slug: string; kind: "visit" | "study"; country: string; flag: string; href: string; fee: string | null; time: string | null; stay: string | null; apply: string | null; checked: string | null }
export interface CompareText { visit: string; study: string; choose: string; fee: string; time: string; stay: string; apply: string; checked: string; unknown: string; open: string }

/** Put destinations side by side using only the published, checked facts. Unknown stays "Being verified", never a guess. */
export function VisaCompare({ locale, items, text, initial }: { locale: Locale; items: CompareItem[]; text: CompareText; initial: string[] }) {
  const [kind, setKind] = useState<"visit" | "study">("visit");
  const list = items.filter((i) => i.kind === kind);
  const [picked, setPicked] = useState<Record<"visit" | "study", string[]>>({ visit: initial, study: items.filter((i) => i.kind === "study").filter((i) => i.fee).slice(0, 3).map((i) => i.slug) });
  const chosen = picked[kind].map((s) => list.find((i) => i.slug === s)).filter(Boolean) as CompareItem[];
  const set = (idx: number, slug: string) => setPicked((p) => { const n = [...p[kind]]; n[idx] = slug; return { ...p, [kind]: n }; });
  const rows: [string, (c: CompareItem) => string | null][] = [[text.fee, (c) => c.fee], [text.time, (c) => c.time], [text.stay, (c) => c.stay], [text.apply, (c) => c.apply]];

  return (
    <div>
      <div role="group" aria-label={text.choose} style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
        {(["visit", "study"] as const).map((k) => <button key={k} type="button" aria-pressed={kind === k} className={kind === k ? "btn btn-dark" : "btn btn-outline"} style={{ minHeight: 44 }} onClick={() => setKind(k)}>{text[k]}</button>)}
      </div>
      <div className="g3">
        {[0, 1, 2].map((idx) => {
          const c = chosen[idx];
          return (
            <article key={idx} className="card lift" style={{ padding: 18, minWidth: 0 }}>
              <label className="lbl" htmlFor={`cmp-${kind}-${idx}`}>{text.choose}</label>
              <select id={`cmp-${kind}-${idx}`} className="field" value={c?.slug ?? ""} onChange={(e) => set(idx, e.target.value)}>
                <option value="">—</option>
                {list.map((i) => <option key={i.slug} value={i.slug}>{i.country}</option>)}
              </select>
              {c && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 6px" }}><Flag code={c.flag} size={28} /><b style={{ fontSize: 19 }}>{c.country}</b></div>
                  <dl style={{ margin: 0 }}>
                    {rows.map(([label, get]) => { const v = get(c); return (
                      <div key={label} style={{ padding: "9px 0", borderTop: "1px solid var(--line)" }}>
                        <dt style={{ fontSize: 13, color: "var(--muted)" }}>{label}</dt>
                        <dd style={{ margin: 0, fontWeight: v ? 600 : 400, color: v ? "var(--ink)" : "var(--muted-2)", fontSize: v ? 15 : 14, overflowWrap: "anywhere" }}>{v ?? text.unknown}{v && label === text.fee && <LocalPrice text={v} locale={locale} />}</dd>
                      </div>
                    ); })}
                  </dl>
                  {c.checked && <p className="mono" style={{ margin: "8px 0 0", fontSize: 12, color: "var(--muted-2)" }}>{text.checked}: {c.checked}</p>}
                  <Link className="btn btn-outline" style={{ marginTop: 12, width: "100%", minHeight: 44 }} href={c.href}>{text.open}</Link>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
