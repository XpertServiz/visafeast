import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Script from "next/script";
import "flag-icons/css/flag-icons.min.css";
import "../globals.css";
import { siteConfig, isLocale, type Locale } from "@/config/site";
import { fontClassNames, fontVars } from "@/lib/fonts";
import { themeStyle } from "@/lib/themes";
import { getSettings } from "@/lib/data";
import { clientDict, dirOf, getT } from "@/lib/i18n";
import { DictProvider } from "@/components/DictProvider";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Floating } from "@/components/layout/Floating";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import { Tracker } from "@/components/layout/Tracker";
import { BackFix } from "@/components/layout/BackFix";
import { Splash } from "@/components/splash/Splash";
import { orgJsonLd, JsonLd } from "@/lib/seo";
import { GUIDE } from "@/lib/photos";

export const revalidate = 3600;

export function generateStaticParams() {
  return siteConfig.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: "#0A1A33", width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "Visa Consultant in Karachi — Visit, Study & Immigration | Visafeast", template: "%s" },
  description: "Visit visas, study visas and immigration pathways from Pakistan, with fees and timelines published openly. Free eligibility check and 15-minute call.",
  icons: siteConfig.icons,
  manifest: siteConfig.manifest,
  openGraph: { siteName: siteConfig.name, type: "website", images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.name }] },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const settings = await getSettings();
  const t = getT(locale);

  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      data-theme={settings.theme}
      className={fontClassNames}
      suppressHydrationWarning
      style={Object.fromEntries(
        (`${fontVars(settings.heading_font, settings.body_font, settings.urdu_font, locale)};${themeStyle(settings.theme, settings.accent_color)}`)
          .split(";").filter(Boolean).map((kv) => { const i = kv.indexOf(":"); return [kv.slice(0, i), kv.slice(i + 1)]; })
      ) as React.CSSProperties}
    >
      <body>
        <a href="#main" className="sr-only" style={{ position: "absolute", left: 8, top: 8, zIndex: 100 }}>Skip to content</a>
        <Splash style={settings.splash_style} duration={settings.splash_duration_ms} oncePerSession={settings.splash_once_per_session} skipLabel={t("splash.skip")} loadingLabel="Visafeast" />
        <DictProvider dict={clientDict(locale)}>
        <Nav locale={locale} />
        <main id="main">{children}</main>
        <Image className="side-guide" src={GUIDE.happy.src} alt="" width={GUIDE.happy.width} height={GUIDE.happy.height} unoptimized />
        <Footer locale={locale} settings={settings} />
        <Floating locale={locale} whatsapp={settings.whatsapp_number} chatbot={settings.chatbot_enabled} />
        <ConsentBanner />
        </DictProvider>
        <Tracker locale={locale} />
        <BackFix />
        <JsonLd data={orgJsonLd(settings)} />
        {process.env.NEXT_PUBLIC_GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}',{anonymize_ip:true});`}</Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
