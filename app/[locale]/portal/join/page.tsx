import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { authClient } from "@/lib/server/admin-auth";
import { PageHeader } from "@/components/PageHeader";
import { JoinButton, SignupForm } from "@/components/portal/AuthForms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connect your file | Visafeast", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ code?: string }> }) {
  const { locale, t } = await pageCtx(params);
  const { code } = await searchParams;
  const c = await authClient();
  const signedIn = c ? Boolean((await c.auth.getUser()).data.user) : false;
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title={t("portal.joinTitle")} intro={t("portal.joinIntro")} path="/portal/join" />
      <div className="wrap" style={{ paddingBlock: 32 }}>
        {!code ? <p role="alert" style={{ color: "var(--bad)" }}>{t("portal.badLink")}</p> : signedIn ? <JoinButton locale={locale} code={code} /> : <SignupForm locale={locale} code={code} />}
      </div>
    </>
  );
}
