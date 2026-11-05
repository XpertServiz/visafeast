import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import "flag-icons/css/flag-icons.min.css";
import "../globals.css";
import { siteConfig, isLocale, type Locale } from "@/config/site";
import { fontClassNames, fontVars } from "@/lib/fonts";
import { themeStyle } from "@/lib/themes";
import { getSettings } from "@/lib/data";
import { dirOf, getT } from "@/lib/i18n";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Floating } from "@/components/layout/Floating";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import { Tracker } from "@/components/layout/Tracker";
import { Splash } from "@/components/splash/Splash";
import { orgJsonLd, JsonLd } from "@/lib/seo";

export const revalidate = 3600;

export function generateStaticParams() {
  return siteConfig.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: "#0A1A33", width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "Visa Consultant in Karachi — Visit, Study & Immigration | Visafeast", template: "%s" },
  description: "Visit visas, study visas and immigration pathways from Pakistan, with fees and timelines published openly. Free eligibility check and 15-minute call.",
  icons: { icon: "/logo.jpg", apple: "/logo.jpg" },
  openGraph: { siteName: siteConfig.name, type: "website", images: ["/logo.jpg"] },
  alternates: { canonical: "/" },
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
      style={Object.fromEntries(
        (`${fontVars(settings.heading_font, settings.body_font, settings.urdu_font)};${themeStyle(settings.theme, settings.accent_color)}`)
          .split(";").filter(Boolean).map((kv) => { const i = kv.indexOf(":"); return [kv.slice(0, i), kv.slice(i + 1)]; })
      ) as React.CSSProperties}
    >
      <body>
        <a href="#main" className="sr-only" style={{ position: "absolute", left: 8, top: 8, zIndex: 100 }}>Skip to content</a>
        <Splash style={settings.splash_style} duration={settings.splash_duration_ms} oncePerSession={settings.splash_once_per_session} skipLabel={t("splash.skip")} />
        <Nav locale={locale} />
        <main id="main">{children}</main>
        <Footer locale={locale} settings={settings} />
        <Floating locale={locale} whatsapp={settings.whatsapp_number} chatbot={settings.chatbot_enabled} />
        <ConsentBanner locale={locale} />
        <Tracker locale={locale} />
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
