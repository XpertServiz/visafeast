"use client";
import { useEffect, useState } from "react";
import en from "@/messages/en.json";
import ur from "@/messages/ur.json";

export function ConsentBanner({ locale }: { locale: "en" | "ur" }) {
  const [show, setShow] = useState(false);
  const t = (locale === "ur" ? ur : en).consent;
  useEffect(() => { try { if (!localStorage.getItem("vf_consent")) setShow(true); } catch { setShow(true); } }, []);
  if (!show) return null;
  return (
    <div role="region" aria-label="Cookies" style={{ position: "fixed", bottom: 12, insetInline: 12, zIndex: 50, maxWidth: 560, marginInline: "auto", background: "var(--navy)", color: "#fff", borderRadius: 14, padding: "12px 16px", display: "flex", gap: 14, alignItems: "center", boxShadow: "0 10px 30px rgba(0,0,0,.3)", fontSize: 15 }}>
      <span style={{ flex: 1 }}>{t.text}</span>
      <button type="button" className="btn btn-primary" style={{ minHeight: 44 }} onClick={() => {
        try { localStorage.setItem("vf_consent", "1"); document.cookie = `vf_vid=${crypto.randomUUID()};path=/;max-age=31536000;samesite=lax`; } catch { /* ignore */ }
        setShow(false);
      }}>{t.ok}</button>
    </div>
  );
}
