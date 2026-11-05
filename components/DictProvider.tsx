"use client";
import { createContext, useContext } from "react";
import type { ClientDict } from "@/lib/i18n";

const Ctx = createContext<ClientDict | null>(null);

/** Gives browser components the text of the current page's language, sent once by the page layout. */
export function DictProvider({ dict, children }: { dict: ClientDict; children: React.ReactNode }) {
  return <Ctx.Provider value={dict}>{children}</Ctx.Provider>;
}

export function useDict(): ClientDict {
  const d = useContext(Ctx);
  if (!d) throw new Error("useDict needs DictProvider");
  return d;
}
