"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { waLink } from "@/config/site";
import { track } from "@/lib/track-client";

const ChatPanel = dynamic(() => import("./ChatPanel").then((m) => m.ChatPanel), { ssr: false });

export function Floating({ locale, whatsapp, chatbot }: { locale: "en" | "ur"; whatsapp: string; chatbot: boolean }) {
  const [open, setOpen] = useState(false);
  const right = locale === "ur" ? { left: 18 } : { right: 18 };
  return (
    <>
      <div style={{ position: "fixed", bottom: 18, display: "flex", flexDirection: "column", gap: 12, zIndex: 40, ...right }}>
        {chatbot && (
          <button type="button" aria-label={locale === "ur" ? "چیٹ" : "Chat with us"} onClick={() => { setOpen(true); track("chat_open"); }}
            style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--navy)", color: "var(--amber)", border: "2px solid var(--amber)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageCircle />
          </button>
        )}
        <a href={waLink("Hi Visafeast, I have a question about a visa.", whatsapp)} aria-label="WhatsApp us" className="pulse" onClick={() => track("whatsapp_click")}
          style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--whatsapp)", color: "#06371B", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3.5 20.5l1.3-4.1A8.5 8.5 0 1 1 8 19.6z" /><path d="M9 8.5c0 3.5 2.5 6.5 6.5 6.5l1-1.6-2-1-1 .8c-1.3-.5-2.3-1.5-2.8-2.8l.8-1-1-2z" /></svg>
        </a>
      </div>
      {open && <ChatPanel locale={locale} whatsapp={whatsapp} onClose={() => setOpen(false)} />}
    </>
  );
}
