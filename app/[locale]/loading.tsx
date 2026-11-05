import { LogoMark } from "@/components/layout/Logo";

/** Shown while moving between pages if the next page takes a moment. */
export default function Loading() {
  return (
    <div role="status" aria-label="Visafeast" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <span className="vf-page-loader"><LogoMark size={72} onDark={false} /></span>
      <span aria-hidden className="vf-splash-bar"><i /></span>
    </div>
  );
}
