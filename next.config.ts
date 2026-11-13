import type { NextConfig } from "next";

// 'unsafe-eval' is only needed by the development server; production pages run without it.
const dev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://www.googletagmanager.com https://app.cal.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com https://*.supabase.co https://images.pexels.com https://www.google-analytics.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://challenges.cloudflare.com",
  "frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com https://app.cal.com https://cal.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const config: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  // IndexNow wants the key file at the site root as /<key>.txt
  async rewrites() { return [{ source: "/:key([0-9a-f]{32}).txt", destination: "/api/indexnow-key" }]; },
  async redirects() {
    // these three moved out of the Website group into their own menu items
    return [
      { source: "/admin/website/reviews", destination: "/admin/reviews", permanent: false },
      { source: "/admin/website/videos", destination: "/admin/videos", permanent: false },
      { source: "/admin/website/visitors", destination: "/admin/visitors", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        // the email logo: Gmail shows pictures through its own proxy, so these files must allow cross-origin embedding
        source: "/brand/:path*",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default config;
