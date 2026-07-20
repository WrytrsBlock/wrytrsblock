// Static routes under /profile/ that are NOT creator handles — must be
// excluded from the "/profile/<handle>" pattern below, or e.g. /profile/edit
// (the signed-in user's own editor) would be misclassified as a public
// creator-profile page.
const RESERVED_PROFILE_SUBPATHS = new Set(["edit"]);

// Routes a signed-out visitor may browse read-only (Marketplace / Discovery,
// and any individual creator's profile page) — kept in one place so
// middleware (which decides whether to redirect to /sign-in) and the (app)
// shell layout (which decides whether to render the authenticated chrome)
// never drift out of sync. Bare "/profile" (the signed-in user's own
// redirect-to-my-handle route) is intentionally excluded — it still requires
// a session.
export function isPublicBrowsePath(pathname: string): boolean {
  if (pathname === "/marketplace") return true;
  const match = pathname.match(/^\/profile\/([^/]+)$/);
  return Boolean(match && !RESERVED_PROFILE_SUBPATHS.has(match[1]));
}

// Extracts the handle from a "/profile/<handle>" pathname, or null if the
// path isn't a creator-profile route (including the reserved subpaths above).
export function matchProfileHandle(pathname: string): string | null {
  const match = pathname.match(/^\/profile\/([^/]+)$/);
  if (!match || RESERVED_PROFILE_SUBPATHS.has(match[1])) return null;
  return match[1];
}
