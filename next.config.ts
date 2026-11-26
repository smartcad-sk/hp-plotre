import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Static CSP (no nonces) so pages stay statically prerendered.
 * Next.js injects inline bootstrap scripts, hence 'unsafe-inline' for scripts.
 * Third-party origins are limited to: YouTube (click-to-load embeds) and the
 * original WordPress host for PDFs/videos that were not migrated.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com",
  "font-src 'self'",
  "media-src 'self' https://hpplotre.sk",
  "frame-src https://www.youtube-nocookie.com",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // Old WordPress URLs that duplicated content or were artifacts.
    return [
      { source: "/feed", destination: "/blogy", permanent: true },
      { source: "/kontaktny-formular", destination: "/kontakt", permanent: true },
      { source: "/rady_tipy", destination: "/smart-sluzby/rady_tipy", permanent: true },
      { source: "/https-kancelaria-smartcad-sk-bazar-plotrov", destination: "https://kancelaria.smartcad.sk/bazar-plotrov/", permanent: true },
      { source: "/hp-plotre-2019", destination: "/velkoformatove-tlaciarne", permanent: true },
    ];
  },
};

export default nextConfig;
