import { NextResponse } from "next/server";

/** IndexNow ownership proof: returns the key as plain text. */
export function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return new NextResponse("Not set", { status: 404 });
  return new NextResponse(key, { headers: { "content-type": "text/plain" } });
}
