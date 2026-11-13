import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { BOT_RE, isLocale, localeForCountry, lp, splitLocale } from "./config/locales";

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
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, { ...options, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" }));
      },
    },
  });
  try { await client.auth.getUser(); } catch { /* the page itself will send them to sign in */ }
  return res;
}

/** The visitor's country from the hosting edge (no IP address is read or stored). */
function countryOf(req: NextRequest): string | null {
  const raw = (req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "").toUpperCase();
  return /^[A-Z]{2}$/.test(raw) && raw !== "XX" && raw !== "T1" ? raw : null;
}

/** Remembers the country in a small cookie, so the browser can show the visitor's language button and local currency. */
function withCountry(req: NextRequest, res: NextResponse): NextResponse {
  const country = countryOf(req);
  if (country && req.cookies.get("vf_cc")?.value !== country) res.cookies.set("vf_cc", country, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
  return res;
}

/**
 * Which language to open an address without a language prefix in. A visitor's own choice (the vf_lang cookie) always wins,
 * then their country. Search engines are never redirected: each language has its own address they can index.
 */
function autoLocale(req: NextRequest) {
  if (req.method !== "GET") return "en";
  if (BOT_RE.test(req.headers.get("user-agent") || "")) return "en";
  const chosen = req.cookies.get("vf_lang")?.value;
  if (isLocale(chosen)) return chosen;
  return localeForCountry(countryOf(req), req.headers.get("accept-language"));
}

// English lives at "/..." (no prefix), other languages at "/de/...", "/ur/..." etc. Internally all are served by app/[locale].
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const next = () => NextResponse.next({ request: req });

  // One address for the whole site: visafeast.com -> www.visafeast.com. The vercel.app address follows once the domain is live.
  const host = (req.headers.get("host") || "").toLowerCase();
  if (host === "visafeast.com" || (host === "visafeast.vercel.app" && process.env.CANONICAL_REDIRECT === "1")) {
    return NextResponse.redirect(`https://www.visafeast.com${pathname}${req.nextUrl.search}`, 308);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) return withSession(req, next);

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const { locale, path } = splitLocale(pathname);
  if (locale) return withCountry(req, path.startsWith("/portal") ? await withSession(req, next) : next());

  const target = autoLocale(req);
  if (target !== "en") {
    const url = req.nextUrl.clone();
    url.pathname = lp(target, pathname);
    const res = NextResponse.redirect(url, 307);
    res.headers.set("Cache-Control", "private, no-store");
    return withCountry(req, res);
  }

  const url = req.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  const rewrite = () => NextResponse.rewrite(url, { request: req });
  return withCountry(req, pathname.startsWith("/portal") ? await withSession(req, rewrite) : NextResponse.rewrite(url));
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
