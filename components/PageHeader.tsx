import Image from "next/image";
import { BreadcrumbItems } from "@/components/country/Breadcrumb";
import { GUIDE } from "@/lib/photos";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo";
import { lp } from "@/lib/i18n";
import type { Locale } from "@/config/site";

export function PageHeader({ locale, home, title, intro, path, guide = "happy" }: { locale: Locale; home: string; title: string; intro?: string; path: string; guide?: "happy" | "sad" | false }) {
  return (
    <header className="sky" style={{ paddingBlock: "36px 56px", color: "#fff", position: "relative", overflow: "hidden" }}>
      {guide && <Image className="page-guide" src={GUIDE[guide].src} alt="" width={GUIDE[guide].width} height={GUIDE[guide].height} unoptimized />}
      <JsonLd data={breadcrumbJsonLd([{ name: home, path: lp(locale, "/") }, { name: title, path: lp(locale, path) }])} />
      <div className="wrap" style={{ position: "relative" }}>
        <BreadcrumbItems items={[{ label: home, href: lp(locale, "/") }, { label: title }]} />
        <h1 className="disp h1" style={{ margin: "18px 0 8px", fontSize: 52, fontWeight: 600, lineHeight: 1.1 }}>{title}</h1>
        {intro && <p style={{ color: "var(--on-navy)", fontSize: 19, maxWidth: 720, margin: 0 }}>{intro}</p>}
      </div>
    </header>
  );
}
