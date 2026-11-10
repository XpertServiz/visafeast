"use client";
import { useEffect, useState } from "react";

/**
 * News tabs without a server call: the page is built once (and refreshed on a schedule); choosing a country only hides and shows
 * the stories already on the page. Without JavaScript every story simply stays visible. Old links like ?country=CA still work.
 */
export function NewsTabs({ chips, allLabel, digestLabel, noneLabel, counts, all, digests }: {
  chips: { code: string; name: string }[]; allLabel: string; digestLabel: string; noneLabel: string; counts: Record<string, number>;
  all: React.ReactNode; digests: React.ReactNode;
}) {
  const [tab, setTab] = useState<"all" | "digests">("all");
  const [cc, setCc] = useState("");

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const c = sp.get("country") ?? "";
    if (sp.get("tab") === "digests") setTab("digests"); else if (chips.some((x) => x.code === c)) setCc(c);
  }, [chips]);

  const go = (t: "all" | "digests", c: string) => {
    setTab(t); setCc(c);
    try { history.replaceState(null, "", t === "digests" ? "?tab=digests" : c ? `?country=${c}` : location.pathname); } catch { /* ignore */ }
  };
  const chip = (on: boolean) => ({ textDecoration: "none", cursor: "pointer", font: "inherit", background: on ? "var(--navy)" : undefined, color: on ? "#fff" : undefined });
  const rules = chips.map((x) => `.nl[data-f="${x.code}"] .ni[data-cc~="${x.code}"]{display:block}`).join("");

  return (
    <>
      <style>{`.nl:not([data-f=""]) .ni{display:none}${rules}`}</style>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <button type="button" className="chip" style={chip(tab === "all" && !cc)} onClick={() => go("all", "")}>{allLabel}</button>
        <button type="button" className="chip" style={chip(tab === "digests")} onClick={() => go("digests", "")}>{digestLabel}</button>
        {chips.map((x) => <button type="button" key={x.code} className="chip" style={chip(tab === "all" && cc === x.code)} onClick={() => go("all", x.code)}>{x.name}</button>)}
      </div>
      {tab === "digests" ? digests : (
        <div className="nl" data-f={cc} style={{ display: "grid", gap: 14, marginTop: 20 }}>
          {all}
          {cc && !counts[cc] && <p style={{ color: "var(--muted)" }}>{noneLabel}</p>}
        </div>
      )}
    </>
  );
}
