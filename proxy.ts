import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Keeps a login alive: refreshes the session cookie here, because pages themselves are not allowed to write cookies.
 *  `make` builds the response so that a refreshed token reaches both the browser and the page rendering this request. */
async function withSession(req: NextRequest, make: () => NextResponse): Promise<NextResponse> {
  let res = make();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return res;
  // only when a login cookie exists, so ordinary public visits stay fast
  if (!req.cookies.getAll().some((c) => c.name.startsWith("sb-"))) return res;
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = make();
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  try { await client.auth.getUser(); } catch { /* the page itself will send them to sign in */ }
  return res;
}

// English lives at "/..." (no prefix), Urdu at "/ur/...". Internally both are served by app/[locale].
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const next = () => NextResponse.next({ request: req });

  if (pathname === "/admin" || pathname.startsWith("/admin/")) return withSession(req, next);

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/ur" || pathname.startsWith("/ur/")) return pathname.startsWith("/ur/portal") ? withSession(req, next) : NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  const rewrite = () => NextResponse.rewrite(url, { request: req });
  return pathname.startsWith("/portal") ? withSession(req, rewrite) : NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
