import { ImageResponse } from "next/og";
import { getCountries, getCountry } from "@/lib/data";
import { getImmigrationGuide, IMMIGRATION_GUIDES, immigrationCountry } from "@/lib/guides";
import { MARK_LIGHT_DATA, PDF_MARK, PDF_WORD, WORDMARK_LIGHT_DATA } from "@/lib/brand-data";

export const ogSize = { width: 1200, height: 630 };

/** Generated Open Graph image per country: navy background, boarding-pass route, country name (brief §14.2). */
export async function countryOg(slug: string) {
  // Immigration pages come from the guides, not the database.
  const guide = getImmigrationGuide(slug);
  const c = guide ? immigrationCountry(guide, "en") : await getCountry(slug);
  const route = c ? `${c.from_code}  ✈  ${c.to_code}` : "KHI ✈ WORLD";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0A1A33", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={MARK_LIGHT_DATA} width={Math.round((PDF_MARK.w * 78) / PDF_MARK.h)} height={78} alt="" />
          <img src={WORDMARK_LIGHT_DATA} width={Math.round((PDF_WORD.w * 36) / PDF_WORD.h)} height={36} alt="" style={{ marginLeft: 22 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 44, color: "#F2A93B", letterSpacing: 6 }}>{route}</div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.1, marginTop: 16 }}>{c?.h1 ?? "Visa from Pakistan"}</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#C9D3E2" }}>Fees & timelines with the date we last checked</div>
      </div>
    ),
    ogSize,
  );
}

/** Build every country image once (at build time) instead of drawing it each time a link preview asks for it. */
export async function ogStaticParams(kind: "visit" | "study" | "immigration") {
  const slugs = kind === "immigration" ? IMMIGRATION_GUIDES.map((g) => g.slug) : (await getCountries(kind)).map((c) => c.slug);
  return ["en", "ur"].flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}
