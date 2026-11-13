"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Flag, Icon } from "@/components/ui";

export interface ImmData { name: string; flag: string; chips: string[]; href: string }

type Tab = "visit" | "study" | "immigration" | "work";
const ICONS = { visit: "airplane", study: "graduation-cap", immigration: "globe", work: "briefcase" } as const;
const KEYS: Tab[] = ["visit", "study", "work", "immigration"];

/** One country card for the Immigration and Work permit tabs: flag, name, the routes as chips, "Open guide". */
function CountryCards({ list, label, color, qualify }: { list: ImmData[]; label: string; color: string; qualify: string }) {
  return (
    <div className="g3" style={{ gap: 16 }}>
      {list.map((c) => (
        <Link prefetch={false} key={c.href} href={c.href} className="lift" style={{ display: "block", textDecoration: "none", background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 22, color: "var(--ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Flag code={c.flag} size={48} width={64} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: ".14em", color, textTransform: "uppercase" }}>{label}</span>
          </div>
          <p className="disp" style={{ margin: "10px 0 12px", fontSize: 23, fontWeight: 600, color: "var(--navy)" }}>{c.name}</p>
          <div>{c.chips.map((x) => <span key={x} className="chip">{x}</span>)}</div>
          <span style={{ display: "inline-block", marginTop: 8, fontSize: 14, fontWeight: 600, color: "var(--amber-text)" }}>{qualify}</span>
        </Link>
      ))}
    </div>
  );
}

export function VisaTabs({ eyebrow, title, visit, study, immigration, work, labels, immNote, workNote, workAll, workHref, qualify }: {
  eyebrow: string; title: string; visit: React.ReactNode; study: React.ReactNode; immigration: ImmData[]; work: ImmData[];
  labels: Record<Tab, string>; immNote: string; workNote: string; workAll: string; workHref: string; qualify: string;
}) {
  const [tab, setTab] = useState<Tab>("visit");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = (i + (e.key === "ArrowRight" ? 1 : KEYS.length - 1)) % KEYS.length;
    setTab(KEYS[n]); refs.current[n]?.focus();
  };
  const note = { margin: "18px 0 0", fontSize: 14, color: "var(--muted-2)", lineHeight: 1.6, maxWidth: 900 } as const;
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", justifyContent: "space-between", gap: 20, marginBottom: 28 }}>
        <div>
          <p className="eyebrow" style={{ margin: 0, color: "var(--amber-text)" }}>{eyebrow}</p>
          <h2 className="disp" style={{ margin: "10px 0 0", fontSize: 40, fontWeight: 600 }}>{title}</h2>
        </div>
        <div role="tablist" aria-label="Visa types" className="visa-tabs" style={{ display: "flex", flexWrap: "wrap", padding: 5, background: "#ECE6DA", borderRadius: 28 }}>
          {KEYS.map((k, i) => (
            <button key={k} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} tabIndex={tab === k ? 0 : -1}
              onClick={() => setTab(k)} onKeyDown={(e) => onKey(e, i)}
              style={{ border: 0, cursor: "pointer", padding: "10px 18px", borderRadius: 999, fontWeight: 600, fontSize: 16, fontFamily: "inherit", background: tab === k ? "var(--navy)" : "transparent", color: tab === k ? "#fff" : "var(--navy)", minHeight: 48, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name={ICONS[k]} size={26} />{labels[k]}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id="panel-visit" aria-labelledby="tab-visit" hidden={tab !== "visit"}>{visit}</div>
      <div role="tabpanel" id="panel-study" aria-labelledby="tab-study" hidden={tab !== "study"}>{study}</div>
      <div role="tabpanel" id="panel-work" aria-labelledby="tab-work" hidden={tab !== "work"}>
        <CountryCards list={work} label={labels.work} color="var(--navy)" qualify={qualify} />
        <p style={note}>{workNote} <Link prefetch={false} href={workHref} style={{ fontWeight: 600 }}>{workAll}</Link></p>
      </div>
      <div role="tabpanel" id="panel-immigration" aria-labelledby="tab-immigration" hidden={tab !== "immigration"}>
        <CountryCards list={immigration} label={labels.immigration} color="var(--ok)" qualify={qualify} />
        <p style={note}>{immNote}</p>
      </div>
    </>
  );
}
