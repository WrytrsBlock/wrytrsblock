import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";
import { SUPABASE_ANON_KEY, SUPABASE_URL, SITE_URL, supabaseConfigured } from "@/lib/env";
import { listPublishedCreatorHandlesForSitemap } from "@/services/creator-profiles.service";

// Regenerate hourly rather than per-request — new creators don't need to
// appear in the sitemap within seconds, and this lets the route be cached
// instead of rendered fresh on every crawl.
export const revalidate = 3600;

// Every public page (see lib/public-routes.ts + middleware.ts for what's
// actually crawlable) — static routes plus one entry per published creator
// profile. Pages that require a session (Home, Blocks, Notifications,
// Settings) are intentionally excluded, same as robots.ts's disallow list.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/marketplace`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/sign-in`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/sign-up`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    {
      url: `${SITE_URL}/community-guidelines`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  if (!supabaseConfigured) return staticRoutes;

  try {
    // No cookies needed: creator_profiles' "read published" RLS policy
    // (0006_creator_profiles.sql) already allows the anon role to read
    // published rows, so a plain anon-key client works here — and, unlike
    // the cookie-based client, doesn't force this route to skip static
    // generation/caching (see `revalidate` above).
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const creators = await listPublishedCreatorHandlesForSitemap(supabase);
    const profileRoutes: MetadataRoute.Sitemap = creators.map((c) => ({
      url: `${SITE_URL}/profile/${c.handle}`,
      lastModified: c.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...staticRoutes, ...profileRoutes];
  } catch (e) {
    console.error("sitemap: failed to load creator profiles:", e);
    return staticRoutes;
  }
}
