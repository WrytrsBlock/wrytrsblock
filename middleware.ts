import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Expired/invalid auth links (e.g. a used password-reset link) bounce back to
  // the Site URL *root* with ?error_code=... rather than to /auth/callback. Catch
  // that anywhere it lands and route it to sign-in with a readable message so the
  // user never ends up confused on the marketing page.
  const { searchParams, pathname } = request.nextUrl;
  const errorCode = searchParams.get("error_code");
  const error = searchParams.get("error");
  if ((errorCode || error) && pathname !== "/sign-in") {
    const desc = searchParams.get("error_description");
    const msg =
      errorCode === "otp_expired"
        ? "That link has expired. Request a new password reset email below."
        : desc
          ? desc.replace(/\+/g, " ")
          : "That link is invalid or has expired. Please try again.";
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?autherror=${encodeURIComponent(msg)}`;
    return NextResponse.redirect(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image, favicon
     * - the PWA manifest, sitemap, and robots file (must be publicly
     *   fetchable — search crawlers never carry a session cookie, so if
     *   these ran through updateSession() below they'd get redirected to
     *   /sign-in instead of served, same as any other protected route)
     * - any file with a static extension (images, fonts, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|webmanifest)$).*)",
  ],
};
