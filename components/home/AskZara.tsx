"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { ZaraAvatar } from "@/components/layout/Avatar";

/** Ask right on the page: opens Zara with the question already sent. Typos are fine. */
export function AskZara({ title, placeholder, send, chips }: { title: string; placeholder: string; send: string; chips: string[] }) {
  const [q, setQ] = useState("");
  const ask = (text: string) => window.dispatchEvent(new CustomEvent("vf-ask", { detail: text }));
  return (
    <div className="card" style={{ padding: 20, display: "flex", gap: 16, alignItems: "flex-start", maxWidth: 860, marginInline: "auto", boxShadow: "0 14px 34px rgba(10,26,51,.1)" }}>
      <ZaraAvatar size={60} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 22 }}>{title}</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) { ask(q.trim()); setQ(""); } }} style={{ display: "flex", gap: 8 }}>
          <input className="field" dir="auto" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} maxLength={500} style={{ minWidth: 0, flex: 1 }} />
          <button className="btn btn-primary" aria-label={send}><Send size={18} aria-hidden /></button>
        </form>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {chips.map((c) => <button key={c} type="button" className="chip" style={{ border: 0, cursor: "pointer", minHeight: 40, fontSize: 14, margin: 0 }} onClick={() => ask(c)}>{c}</button>)}
        </div>
      </div>
    </div>
  );
}
