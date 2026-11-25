import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getRealityCheck } from "@/lib/server/reality";
import { VERDICT_LABEL, type Verdict } from "@/config/reality-check";

export const runtime = "nodejs";
const COLOUR: Record<Verdict, [string, string]> = { true: ["#0B2A4A", "#FFFFFF"], partly_true: ["#F2A93B", "#0B2A4A"], misleading: ["#FBE9C9", "#8A5300"], cannot_verify: ["#EEF2F8", "#4B5B70"] };

/** Share picture made from the verdict and title. Cached for a day; only published posts get one. */
export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get("slug") ?? "").slice(0, 100);
  const c = /^[a-z0-9-]+$/.test(slug) ? await getRealityCheck(slug) : null;
  const [bg, fg] = COLOUR[c?.verdict ?? "cannot_verify"];
  const title = (c?.title ?? "Visa Reality Check").slice(0, 110);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0B2A4A", color: "#fff", padding: 64 }}>
        <div style={{ display: "flex", fontSize: 32, color: "#F2A93B", fontWeight: 700 }}>Visafeast · Visa Reality Check</div>
        <div style={{ display: "flex", fontSize: title.length > 70 ? 54 : 66, fontWeight: 700, lineHeight: 1.15 }}>{title}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {c ? <div style={{ display: "flex", background: bg, color: fg, fontSize: 44, fontWeight: 700, padding: "12px 34px", borderRadius: 999 }}>{VERDICT_LABEL[c.verdict]}</div> : <div style={{ display: "flex" }} />}
          <div style={{ display: "flex", fontSize: 30, color: "#C9D6E8" }}>www.visafeast.com</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
