"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Flag } from "@/components/ui";

export interface CardData { slug: string; kind: "visit" | "study"; flag: string; from: string; to: string; country: string; visa: string; note: string; href: string }
export interface ImmData { name: string; flag: string; chips: string[]; href: string }

export function VisaTabs({ visit, study, immigration, labels, immNote, cta, qualify }: {
  visit: React.ReactNode; study: React.ReactNode; immigration: ImmData[]; labels: { visit: string; study: string; immigration: string }; immNote: string; cta: string; qualify: string;
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
    <div>
      <div role="tablist" aria-label="Visa types" style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
        {keys.map((k, i) => (
          <button key={k} ref={(el) => { refs.current[i] = el; }} role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} tabIndex={tab === k ? 0 : -1}
            onClick={() => setTab(k)} onKeyDown={(e) => onKey(e, i)} className="btn"
            style={{ background: tab === k ? "var(--navy)" : "#fff", color: tab === k ? "#fff" : "var(--navy)", borderColor: "var(--navy)" }}>{labels[k]}</button>
        ))}
      </div>
      <div role="tabpanel" id="panel-visit" aria-labelledby="tab-visit" hidden={tab !== "visit"}>{visit}</div>
      <div role="tabpanel" id="panel-study" aria-labelledby="tab-study" hidden={tab !== "study"}>{study}</div>
      <div role="tabpanel" id="panel-immigration" aria-labelledby="tab-immigration" hidden={tab !== "immigration"}>
        <div className="g3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {immigration.map((c) => (
            <div key={c.name} className="card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><Flag code={c.flag} /><span className="disp" style={{ fontSize: 22, fontWeight: 600 }}>{c.name}</span></div>
              <div style={{ flex: 1 }}>{c.chips.map((x) => <span key={x} className="chip">{x}</span>)}</div>
              <Link href={c.href} style={{ fontWeight: 600, marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={16} aria-hidden />{qualify}</Link>
            </div>
          ))}
        </div>
        <p style={{ maxWidth: 800, marginInline: "auto", textAlign: "center", color: "var(--muted)", marginTop: 24 }}>{immNote}</p>
      </div>
      <span hidden>{cta}</span>
    </div>
  );
}
