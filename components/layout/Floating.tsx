"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { waLink, type Locale } from "@/config/site";
import { dirOf } from "@/config/locales";
import { useDict } from "@/components/DictProvider";
import { track } from "@/lib/track-client";
import { ZaraAvatar } from "./Avatar";

const ChatPanel = dynamic(() => import("./ChatPanel").then((m) => m.ChatPanel), { ssr: false });

/** Bottom corner: Zara the assistant beside the WhatsApp button. Other parts of the page can open her with the "vf-ask" event. */
export function Floating({ locale, whatsapp, chatbot }: { locale: Locale; whatsapp: string; chatbot: boolean }) {
  const [open, setOpen] = useState(false);
  const [first, setFirst] = useState<string | undefined>();
  const [teaser, setTeaser] = useState(false);
  const side = dirOf(locale) === "rtl" ? { left: 18 } : { right: 18 };
  const u = useDict().ui;

  useEffect(() => {
    const onAsk = (e: Event) => { setFirst((e as CustomEvent<string | undefined>).detail); setOpen(true); setTeaser(false); track("chat_open"); };
    window.addEventListener("vf-ask", onAsk);
    let seen = false;
    try { seen = sessionStorage.getItem("vf_teaser") === "1"; } catch { /* ignore */ }
    const t = chatbot && !seen ? setTimeout(() => setTeaser(true), 7000) : undefined;
    return () => { window.removeEventListener("vf-ask", onAsk); if (t) clearTimeout(t); };
  }, [chatbot]);

  const closeTeaser = () => { setTeaser(false); try { sessionStorage.setItem("vf_teaser", "1"); } catch { /* ignore */ } };

  return (
    <>
      {teaser && !open && (
        <div role="status" style={{ position: "fixed", bottom: 92, zIndex: 40, ...side, maxWidth: 230, background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: "10px 34px 10px 12px", boxShadow: "0 10px 30px rgba(10,26,51,.18)", fontSize: 15 }}>
          {u.teaser}
          <button type="button" aria-label={u.close} onClick={closeTeaser} style={{ position: "absolute", top: 2, insetInlineEnd: 2, background: "none", border: 0, cursor: "pointer", minWidth: 32, minHeight: 32, color: "var(--muted)" }}><X size={16} /></button>
        </div>
      )}
      <div style={{ position: "fixed", bottom: 18, display: "flex", alignItems: "center", gap: 12, zIndex: 40, ...side }}>
        {chatbot && (
          <button type="button" className="zara-btn" aria-label={u.askZara} onClick={() => { setFirst(undefined); setOpen(true); closeTeaser(); track("chat_open"); }}
            style={{ width: 62, height: 62, padding: 0, borderRadius: "50%", background: "var(--navy)", border: "2px solid var(--amber)", cursor: "pointer", boxShadow: "0 8px 22px rgba(10,26,51,.3)", display: "grid", placeItems: "center" }}>
            <ZaraAvatar size={56} />
          </button>
        )}
        <a href={waLink("Hi Visafeast, I have a question about a visa.", whatsapp)} aria-label="WhatsApp us" className="pulse" onClick={() => track("whatsapp_click")}
          style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--whatsapp)", color: "#06371B", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3.5 20.5l1.3-4.1A8.5 8.5 0 1 1 8 19.6z" /><path d="M9 8.5c0 3.5 2.5 6.5 6.5 6.5l1-1.6-2-1-1 .8c-1.3-.6-2.2-1.5-2.8-2.8l.8-1-1-2z" /></svg>
        </a>
      </div>
      {open && <ChatPanel locale={locale} whatsapp={whatsapp} firstQuestion={first} onClose={() => setOpen(false)} />}
    </>
  );
}
