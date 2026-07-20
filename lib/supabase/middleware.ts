import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/env";
import { isPublicBrowsePath, matchProfileHandle } from "@/lib/public-routes";
import { creatorHandleExists, notFoundResponse } from "@/lib/profile-not-found";

const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  // Creator setup must be reachable right after signup even before email
  // confirmation (no session yet) — it never blocks on auth.
  "/onboarding",
  "/auth/callback",
  "/auth/sign-out",
  // Password reset must render so it can handle the recovery session itself
  // (show the form, or an "expired link" message) — never bounce it to sign-in.
  "/reset-password",
  // Legal pages are public so they can be shared anywhere, signed in or not.
  "/terms",
  "/privacy",
  "/community-guidelines",
  // Vercel Cron calls these with no user session — they authenticate
  // themselves via CRON_SECRET (see lib/env.ts), not cookies, so the
  // sign-in redirect below must not intercept them.
  "/api/cron",
];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  // Marketplace/Discovery and individual creator profiles are browsable
  // read-only without a session (see lib/public-routes.ts) — everything else
  // still requires sign-in.
  if (isPublicBrowsePath(pathname)) return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

// Forward the request pathname to Server Components (the (app) shell layout
// needs it to tell a signed-out "browsing the public Marketplace/profile
// pages" request apart from one that should redirect to sign-in) — Next.js
// layouts don't otherwise receive the current pathname as a prop.
function withPathnameHeader(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function updateSession(request: NextRequest) {
  let response = withPathnameHeader(request);

  // If Supabase isn't configured (local dev w/o env), let everything through
  // and let pages fall back to mock data.
  if (!supabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        // Write the refreshed session back onto BOTH the request (so this pass
        // sees it) and the response (so the browser persists it). Using getAll/
        // setAll keeps chunked auth-token cookies intact.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = withPathnameHeader(request);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Real 404 for a creator handle that doesn't exist (SEO fix — see
  // lib/profile-not-found.ts for why this can't be done in the page itself).
  // Anonymous only: a signed-in owner previewing their own unpublished
  // profile must still see it, and that check would need their session, not
  // just the anon-visible rows this fetch can see.
  if (!user) {
    const handle = matchProfileHandle(pathname);
    if (handle) {
      const exists = await creatorHandleExists(handle).catch(() => true);
      if (!exists) return notFoundResponse(handle);
    }
  }

  if (user && (pathname === "/sign-in" || pathname === "/sign-up")) {
    const url = request.nextUrl.clone();
    url.pathname = "/marketplace";
    return NextResponse.redirect(url);
  }

  return response;
}
