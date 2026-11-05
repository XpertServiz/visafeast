import type { Metadata } from "next";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { getCountriesFor } from "@/lib/data";
import { lp } from "@/lib/i18n";
import { seoMeta } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { Flag, KIND_BASE } from "@/components/ui";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return seoMeta(locale, "checklists", "/tools/checklists");
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const list = (await getCountriesFor(locale)).filter((c) => c.kind !== "immigration");
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("pages.checklistsTitle")} intro={t("pages.checklistsIntro")} path="/tools/checklists" />
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
