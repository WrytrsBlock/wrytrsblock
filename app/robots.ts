import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

// Only routes that genuinely require a signed-in session (see
// middleware.ts/lib/public-routes.ts) or are pure utility flows with no
// indexable content are disallowed here — every public page (landing,
// Marketplace, creator profiles, legal, sign-in/up) stays crawlable.
// Note: a bare "/profile" (no handle) is intentionally NOT listed — a
// prefix-based Disallow would also match "/profile/<handle>" and block every
// creator profile, which must stay indexable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/home",
          "/blocks",
          "/notifications",
          "/settings",
          "/onboarding",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
