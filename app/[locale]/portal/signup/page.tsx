import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageCtx } from "@/lib/page";
import { lp } from "@/lib/i18n";
import { getClient } from "@/lib/server/portal";
import { PageHeader } from "@/components/PageHeader";
import { SignupForm } from "@/components/portal/AuthForms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create your account | Visafeast", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await pageCtx(params);
  if (await getClient()) redirect(lp(locale, "/portal"));
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("portal.signupTitle")} intro={t("portal.signupIntro")} path="/portal/signup" />
      <div className="wrap" style={{ paddingBlock: 32 }}><SignupForm locale={locale} /></div>
    </>
  );
}
