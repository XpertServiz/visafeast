"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Flag, Icon } from "@/components/ui";

export interface ImmData { name: string; flag: string; chips: string[]; href: string }

const ICONS = { visit: "airplane", study: "graduation-cap", immigration: "globe" } as const;

export function VisaTabs({ eyebrow, title, visit, study, immigration, labels, immLabel, immNote, qualify }: {
  eyebrow: string; title: string; visit: React.ReactNode; study: React.ReactNode; immigration: ImmData[]; labels: { visit: string; study: string; immigration: string }; immLabel: string; immNote: string; qualify: string;
}) {
  const [tab, setTab] = useState<"visit" | "study" | "immigration">("visit");
  const keys = ["visit", "study", "immigration"] as const;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = (i + (e.key === "ArrowRight" ? 1 : keys.length - 1)) % keys.length;
    setTab(keys[n]); refs.current[n]?.focus();
  };
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", justifyContent: "space-between", gap: 20, marginBottom: 28 }}>
        <div>
          <p className="eyebrow" style={{ margin: 0, color: "var(--amber-text)" }}>{eyebrow}</p>
          <h2 className="disp" style={{ margin: "10px 0 0", fontSize: 40, fontWeight: 600 }}>{title}</h2>
        </div>
        <div role="tablist" aria-label="Visa types" style={{ display: "flex", flexWrap: "wrap", padding: 5, background: "#ECE6DA", borderRadius: 999 }}>
          {keys.map((k, i) => (
            <button key={k} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} tabIndex={tab === k ? 0 : -1}
              onClick={() => setTab(k)} onKeyDown={(e) => onKey(e, i)}
              style={{ border: 0, cursor: "pointer", padding: "10px 20px", borderRadius: 999, fontWeight: 600, fontSize: 16, fontFamily: "inherit", background: tab === k ? "var(--navy)" : "transparent", color: tab === k ? "#fff" : "var(--navy)", minHeight: 48, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name={ICONS[k]} size={26} />{labels[k]}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id="panel-visit" aria-labelledby="tab-visit" hidden={tab !== "visit"}>{visit}</div>
      <div role="tabpanel" id="panel-study" aria-labelledby="tab-study" hidden={tab !== "study"}>{study}</div>
      <div role="tabpanel" id="panel-immigration" aria-labelledby="tab-immigration" hidden={tab !== "immigration"}>
        <div className="g3" style={{ gap: 16 }}>
          {immigration.map((c) => (
            <Link prefetch={false} key={c.name} href={c.href} className="lift" style={{ display: "block", textDecoration: "none", background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 22, color: "var(--ink)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Flag code={c.flag} size={48} width={64} />
                <span className="mono" style={{ fontSize: 11, letterSpacing: ".14em", color: "var(--ok)", textTransform: "uppercase" }}>{immLabel}</span>
              </div>
              <p className="disp" style={{ margin: "10px 0 12px", fontSize: 23, fontWeight: 600, color: "var(--navy)" }}>{c.name}</p>
              <div>{c.chips.map((x) => <span key={x} className="chip">{x}</span>)}</div>
              <span style={{ display: "inline-block", marginTop: 8, fontSize: 14, fontWeight: 600, color: "var(--amber-text)" }}>{qualify}</span>
            </Link>
          ))}
        </div>
        <p style={{ margin: "18px 0 0", fontSize: 14, color: "var(--muted-2)", lineHeight: 1.6, maxWidth: 900 }}>{immNote}</p>
      </div>
    </>
  );
}
