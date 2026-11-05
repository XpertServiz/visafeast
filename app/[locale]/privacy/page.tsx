import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { alternates } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { siteConfig } from "@/config/site";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await pageCtx(params);
  return { title: "Privacy Policy | Visafeast", description: "What Visafeast collects, why, and how long we keep it.", alternates: alternates("/privacy", locale) };
}
export default async function Page({ params }: P) {
  const { locale, t } = await pageCtx(params);
  return (
    <>
      <PageHeader locale={locale} home={t("common.home")} title="Privacy Policy" path="/privacy" />
      <div className="wrap prose-vf" style={{ paddingBlock: 40, maxWidth: 820 }}>
<p>Last updated: 5 November 2026. This is a plain-language summary; the owner should have it reviewed before launch.</p>
<h2>What we collect</h2><ul><li><b>Forms:</b> the details you type into an enquiry, review, checklist or booking form.</li><li><b>Chat:</b> messages sent to the website assistant.</li><li><b>Visit statistics:</b> pages viewed, approximate city and country (from your connection), device and browser type, and a daily anonymous hash. We never store your IP address.</li></ul>
<h2>Why</h2><p>To answer you, prepare your file, and improve the website.</p>
<h2>How long</h2><p>Chat logs and enquiries are kept for up to 12 months. Case documents are deleted a set number of months after your case closes. Visit statistics are kept for 13 months.</p>
<h2>Your rights</h2><p>Ask us on WhatsApp or by email at {siteConfig.email} to see, correct or delete your data.</p>
<h2>Refusal letter decoder</h2><p>Text you paste is not saved unless you tick the consent box and choose to send it to a consultant.</p>
      </div>
    </>
  );
}
