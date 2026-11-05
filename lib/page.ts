import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/site";
import { getT } from "./i18n";

/** Resolve the [locale] param for a page and return the locale + translate fn. */
export async function pageCtx(params: Promise<{ locale: string }>) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  return { locale, t: getT(locale) };
}
