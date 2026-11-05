"use client";
import { useRef } from "react";

/** The phone menu. Closes itself when a link inside is tapped, so it doesn't cover the page. */
export function MobileMenu({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const menu = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={menu} className={className} style={style} onClick={(e) => { if ((e.target as HTMLElement).closest("a") && menu.current) menu.current.open = false; }}>
      {children}
    </details>
  );
}
