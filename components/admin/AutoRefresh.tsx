"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refreshes the server-rendered data every N seconds (used by the live-visitors screen). */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => { const id = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, seconds * 1000); return () => clearInterval(id); }, [router, seconds]);
  return null;
}
