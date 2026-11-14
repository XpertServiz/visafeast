"use client";
import { useState } from "react";
import type { Chip } from "@/lib/aiman/chat";

/** The country question: a drop-down of tick-boxes. The visitor ticks one or many (or "not sure"), then taps Done. */
export function CountryPicker({ options, L, dir, hasLoc, text, onDone }: {
  options: Chip[]; L: boolean; dir: "rtl" | "ltr"; hasLoc: boolean; text: { open: string; hint: string; done: string; doneN: string }; onDone: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (v: string) => setSel((s) => (v === "any" ? (s.includes("any") ? [] : ["any"]) : s.includes(v) ? s.filter((x) => x !== v) : [...s.filter((x) => x !== "any"), v]));
  const label = (c: Chip) => (L && c.loc ? <span className="loc-only" dir={dir}>{c.loc}</span> : <>{c.en}{hasLoc && c.loc && c.loc !== c.en && <span className="ur" dir={dir} style={{ marginInlineStart: 8 }}>{c.loc}</span>}</>);
  return (
    <div className="cpick">
      <button type="button" className="cpick-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {sel.length ? text.doneN.replace("{n}", String(sel.includes("any") ? 1 : sel.length)) : text.open}
        <span aria-hidden>{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="cpick-panel" role="group" aria-label={text.hint}>
          <p className="cpick-hint">{text.hint}</p>
          <ul>
            {options.map((c) => (
              <li key={c.v}>
                <label className={sel.includes(c.v) ? "on" : ""}>
                  <input type="checkbox" checked={sel.includes(c.v)} onChange={() => toggle(c.v)} />
                  <span>{label(c)}</span>
                </label>
              </li>
            ))}
          </ul>
          <button type="button" className="cta" disabled={!sel.length} onClick={() => onDone(sel)}>{sel.length ? text.doneN.replace("{n}", String(sel.includes("any") ? 1 : sel.length)) : text.done}</button>
        </div>
      )}
    </div>
  );
}
