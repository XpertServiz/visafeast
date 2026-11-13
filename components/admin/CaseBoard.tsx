"use client";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { moveCase } from "@/app/admin/actions";

export interface BoardCase { id: string; ref: string; service_type: string; stage: string; client: string; country: string; decision: string | null }
export interface BoardStage { service_type: string; stage: string; label: string; sort: number }

/** Desktop Kanban: drag a card to another column to change its stage. Phones use the plain list instead. */
export function CaseBoard({ cases, stages }: { cases: BoardCase[]; stages: BoardStage[] }) {
  const [service, setService] = useState<"visit" | "study" | "work" | "immigration">("visit");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [, start] = useTransition();
  const [list, setList] = useOptimistic(cases, (cur, m: { id: string; stage: string }) => cur.map((c) => (c.id === m.id ? { ...c, stage: m.stage } : c)));
  const cols = stages.filter((s) => s.service_type === service).sort((a, b) => a.sort - b.sort);
  const mine = list.filter((c) => c.service_type === service);

  function drop(stage: string) {
    const id = dragId; setDragId(null); setOver(null);
    if (!id) return;
    const c = list.find((x) => x.id === id);
    if (!c || c.stage === stage) return;
    start(async () => { setList({ id, stage }); const fd = new FormData(); fd.set("id", id); fd.set("stage", stage); fd.set("ref", c.ref); await moveCase(fd); });
  }

  return (
    <div>
      <div role="tablist" aria-label="Service" style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["visit", "study", "work", "immigration"] as const).map((k) => (
          <button key={k} role="tab" aria-selected={service === k} onClick={() => setService(k)} className={service === k ? "btn btn-dark" : "btn btn-outline"} style={{ minHeight: 44, textTransform: "capitalize" }}>{k} ({list.filter((c) => c.service_type === k).length})</button>
        ))}
      </div>
      <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(210px, 1fr)", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {cols.map((col) => (
          <section key={col.stage} aria-label={col.label}
            onDragOver={(e) => { e.preventDefault(); setOver(col.stage); }} onDragLeave={() => setOver((o) => (o === col.stage ? null : o))} onDrop={() => drop(col.stage)}
            style={{ background: over === col.stage ? "#FFF3DC" : "var(--passport)", border: "1px solid var(--line)", borderRadius: 14, padding: 10, minHeight: 160 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>{col.label} <span style={{ color: "var(--muted)" }}>({mine.filter((c) => c.stage === col.stage).length})</span></h3>
            <div style={{ display: "grid", gap: 8 }}>
              {mine.filter((c) => c.stage === col.stage).map((c) => (
                <article key={c.id} draggable onDragStart={() => setDragId(c.id)} onDragEnd={() => { setDragId(null); setOver(null); }}
                  className="card" style={{ padding: 10, cursor: "grab", opacity: dragId === c.id ? 0.4 : 1 }}>
                  <Link href={`/admin/cases/${c.ref}`} style={{ textDecoration: "none", color: "var(--ink)" }}>
                    <b className="mono" style={{ fontSize: 13 }}>{c.ref}</b><br />{c.client}<br /><span style={{ color: "var(--muted)", fontSize: 13 }}>{c.country}</span>
                  </Link>
                  {/* keyboard / touch alternative to dragging */}
                  <select aria-label={`Move ${c.ref}`} value={c.stage} className="field" style={{ minHeight: 36, marginTop: 6, padding: "4px 8px", fontSize: 13 }}
                    onChange={(e) => { setDragId(c.id); const st = e.target.value; start(async () => { setList({ id: c.id, stage: st }); const fd = new FormData(); fd.set("id", c.id); fd.set("stage", st); fd.set("ref", c.ref); await moveCase(fd); }); setDragId(null); }}>
                    {cols.map((o) => <option key={o.stage} value={o.stage}>{o.label}</option>)}
                  </select>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
