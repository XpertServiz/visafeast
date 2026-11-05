import type { Metadata } from "next";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { getCountries } from "@/lib/data";
import { lp } from "@/lib/i18n";
import { alternates } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { Flag, KIND_BASE } from "@/components/ui";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: "Visa Document Checklists (PDF) from Pakistan | Visafeast", description: "Interactive document checklists for visit and study visas, downloadable as PDF with the date we last checked them.", alternates: alternates("/tools/checklists", locale) };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const list = (await getCountries()).filter((c) => c.kind !== "immigration");
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title="Document checklists" intro="Open a country, tick off what you have, and download the checklist as a PDF." path="/tools/checklists" />
      <div className="wrap" style={{ paddingBlock: 48 }}>
        <div className="g3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {list.map((c) => (
            <Link key={c.slug} href={lp(locale, `/${KIND_BASE[c.kind]}/${c.slug}#documents`)} className="card lift" style={{ padding: 18, textDecoration: "none", display: "flex", gap: 12, alignItems: "center", color: "var(--ink)" }}>
              <Flag code={c.flag} /><span><b>{c.country_name}</b><br /><span style={{ color: "var(--muted)", fontSize: 14 }}>{c.visa_name}</span></span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
