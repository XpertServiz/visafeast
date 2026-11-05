import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function BreadcrumbItems({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: 6, padding: 0, margin: 0, fontSize: 14, color: "var(--on-navy-2)", alignItems: "center" }}>
        {items.map((it, i) => (
          <li key={it.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {it.href ? <Link href={it.href} style={{ color: "var(--on-navy)" }}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
            {i < items.length - 1 && <ChevronRight size={14} aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
