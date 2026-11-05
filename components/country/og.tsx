import { ImageResponse } from "next/og";
import { getCountry } from "@/lib/data";

export const ogSize = { width: 1200, height: 630 };

/** Generated Open Graph image per country: navy background, boarding-pass route, country name (brief §14.2). */
export async function countryOg(slug: string) {
  const c = await getCountry(slug);
  const route = c ? `${c.from_code}  ✈  ${c.to_code}` : "KHI ✈ WORLD";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0A1A33", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64 }}>
        <div style={{ display: "flex", fontSize: 30, color: "#F2A93B", letterSpacing: 4 }}>VISAFEAST</div>
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
