import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { LOCALES } from "@/config/locales";

/** Everything public is open to search engines. Private areas stay closed, in every language. */
export default function robots(): MetadataRoute.Robots {
  const privateAreas = LOCALES.filter((l) => l.code !== "en").flatMap((l) => [`/${l.code}/portal`, `/${l.code}/track`]);
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/track", "/portal", ...privateAreas, "/*?*"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
