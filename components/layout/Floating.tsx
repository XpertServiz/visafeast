"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { waLink, type Locale } from "@/config/site";
import { dirOf } from "@/config/locales";
import { useDict } from "@/components/DictProvider";
import { WaIcon } from "@/components/ui";
import { track } from "@/lib/track-client";
import { AimanAvatar } from "./Avatar";

const ChatPanel = dynamic(() => import("./ChatPanel").then((m) => m.ChatPanel), { ssr: false });

/** Bottom corner: the assistant beside the WhatsApp button. Other parts of the page can open the assistant with the "vf-ask" event. */
export function Floating({ locale, whatsapp, chatbot }: { locale: Locale; whatsapp: string; chatbot: boolean }) {
  const [open, setOpen] = useState(false);
  const [first, setFirst] = useState<string | undefined>();
  const side = dirOf(locale) === "rtl" ? { left: 24 } : { right: 24 };
  const u = useDict().ui;

  useEffect(() => {
    const onAsk = (e: Event) => { setFirst((e as CustomEvent<string | undefined>).detail); setOpen(true); track("chat_open"); };
    window.addEventListener("vf-ask", onAsk);
    return () => window.removeEventListener("vf-ask", onAsk);
  }, []);

  return (
    <>
      <div style={{ position: "fixed", bottom: 24, display: "flex", gap: 12, zIndex: 40, ...side }}>
        {chatbot && (
          <button type="button" className="aiman-btn" aria-label={u.askAiman} onClick={() => { setFirst(undefined); setOpen(true); track("chat_open"); }}
            style={{ width: 60, height: 60, padding: 0, borderRadius: "50%", border: "2px solid var(--amber)", cursor: "pointer", background: "var(--navy)", boxShadow: "0 10px 24px rgba(10,26,51,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AimanAvatar size={56} />
          </button>
        )}
        <a href={waLink("Hi Visafeast, I have a question about a visa.", whatsapp)} aria-label="WhatsApp us" className="pulse" onClick={() => track("whatsapp_click")}
          style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--amber)", color: "#0A1A33", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(242,169,59,.35)" }}>
          <WaIcon size={28} />
        </a>
      </div>
      {open && <ChatPanel locale={locale} whatsapp={whatsapp} firstQuestion={first} onClose={() => setOpen(false)} />}
    </>
  );
}
