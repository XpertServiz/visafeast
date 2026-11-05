import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { PageHeader } from "@/components/PageHeader";
import { ResetForm } from "@/components/portal/AuthForms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Choose a new password | Visafeast", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ code?: string }> }) {
  const { locale, t } = await pageCtx(params);
  const { code } = await searchParams;
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("portal.resetTitle")} path="/portal/reset" />
      <div className="wrap" style={{ paddingBlock: 32 }}>
        {code ? <ResetForm locale={locale} code={code} /> : <p role="alert" style={{ color: "var(--bad)" }}>{t("portal.badLink")}</p>}
      </div>
    </>
  );
}
