import Link from "next/link";

export const pkr = (n: number | null | undefined) => `PKR ${Number(n ?? 0).toLocaleString("en-PK")}`;
export const day = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

export function Title({ children, sub, action }: { children: React.ReactNode; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      <div><h1 className="disp" style={{ margin: 0, fontSize: 34, fontWeight: 600 }}>{children}</h1>{sub && <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>{sub}</p>}</div>
      {action}
    </div>
  );
}
export function Card({ title, children, id, tone }: { title?: string; children: React.ReactNode; id?: string; tone?: "warn" }) {
  return (
    <section id={id} className="card" style={{ padding: 20, borderColor: tone === "warn" ? "var(--amber)" : undefined, scrollMarginTop: 16 }}>
      {title && <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>{title}</h2>}
      {children}
    </section>
  );
}
export function Empty({ text, href, cta }: { text: string; href?: string; cta?: string }) {
  return <div style={{ textAlign: "center", padding: 18, color: "var(--muted)" }}><p style={{ margin: "0 0 10px" }}>{text}</p>{href && <Link className="btn btn-primary" href={href}>{cta}</Link>}</div>;
}
export function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "ok" | "bad" }) {
  return <div className="card" style={{ padding: 16 }}><p className="eyebrow" style={{ margin: 0, fontSize: 11, color: "var(--muted-2)" }}>{label}</p><p className="disp" style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 600, color: tone === "ok" ? "var(--ok)" : tone === "bad" ? "var(--bad)" : undefined }}>{value}</p></div>;
}
export function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label className="lbl">{label}{children}</label></div>; }
export function Grid({ children, min = 240 }: { children: React.ReactNode; min?: number }) { return <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 14 }}>{children}</div>; }
export function Badge({ children, color = "var(--stamp-blue)" }: { children: React.ReactNode; color?: string }) { return <span className="mono" style={{ border: `2px solid ${color}`, color, borderRadius: 6, padding: "1px 8px", fontSize: 12, fontWeight: 600 }}>{children}</span>; }
export function SetupNeeded({ what }: { what: string }) { return <Card tone="warn"><p style={{ margin: 0 }}><b>Not connected yet.</b> {what} — follow the steps in README.md, section "Connect Supabase".</p></Card>; }
