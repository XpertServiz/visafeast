import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageCtx } from "@/lib/page";
import { lp } from "@/lib/i18n";
import { getClient } from "@/lib/server/portal";
import { PageHeader } from "@/components/PageHeader";
import { LoginForm } from "@/components/portal/AuthForms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Client sign in | Visafeast", robots: { index: false, follow: false } };

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ code?: string }> }) {
  const { locale, t } = await pageCtx(params);
  const { code } = await searchParams;
  if (await getClient()) redirect(lp(locale, code ? `/portal/join?code=${encodeURIComponent(code)}` : "/portal"));
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("portal.loginTitle")} intro={t("portal.loginIntro")} path="/portal/login" />
      <div className="wrap" style={{ paddingBlock: 32 }}><LoginForm locale={locale} code={code} /></div>
    </>
  );
}
