import { NextResponse, type NextRequest } from "next/server";

// English lives at "/..." (no prefix), Urdu at "/ur/...". Internally both are served by app/[locale].
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/ur" || pathname.startsWith("/ur/")) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next|admin|.*\\..*).*)"],
};
