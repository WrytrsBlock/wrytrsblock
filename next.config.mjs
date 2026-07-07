// Supabase project host (for connect-src/img-src) — derived from the same env
// var the app itself reads (lib/env.ts), so the CSP always matches whatever
// project this deployment actually points at instead of a hardcoded value.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();
const supabaseWsOrigin = supabaseOrigin.replace(/^http/, "ws");
const isDev = process.env.NODE_ENV !== "production";

// No nonce/strict-dynamic setup exists yet, so script-src/style-src need
// 'unsafe-inline' for Next's own bootstrap + Tailwind; 'unsafe-eval' is dev-only
// (webpack HMR). Everything else is a real allow-list: no other origin can
// load a script, frame, or submit a form, which is what actually matters for
// blocking injected third-party payloads and clickjacking.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `img-src 'self' data: blob: https:`,
  `media-src 'self' blob: https:`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `connect-src 'self' https: ${supabaseOrigin} ${supabaseWsOrigin}`.trim(),
  `frame-src 'self' https://www.youtube-nocookie.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'self'`,
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  // The home page reads /public/home-heroes at request time to pick a random
  // hero. public/ files are served by the CDN but are NOT in the serverless
  // function bundle by default, so include them so fs.readdirSync works in prod.
  experimental: {
    outputFileTracingIncludes: {
      "/home": ["./public/home-heroes/**/*"],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // microphone=(self) — voice notes (components/block/threads-panel.tsx)
            // record audio via getUserMedia and must keep working.
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
