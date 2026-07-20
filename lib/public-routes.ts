// Routes a signed-out visitor may browse read-only (Marketplace / Discovery,
// and any individual creator's profile page) — kept in one place so
// middleware (which decides whether to redirect to /sign-in) and the (app)
// shell layout (which decides whether to render the authenticated chrome)
// never drift out of sync. Bare "/profile" (the signed-in user's own
// redirect-to-my-handle route) is intentionally excluded — it still requires
// a session.
export function isPublicBrowsePath(pathname: string): boolean {
  return pathname === "/marketplace" || /^\/profile\/[^/]+$/.test(pathname);
}
