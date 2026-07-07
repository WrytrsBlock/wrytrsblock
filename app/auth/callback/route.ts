import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { sanitizeRedirectPath } from "@/lib/safe-url";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only ever a same-origin relative path — an absolute/attacker-controlled
  // value here (e.g. "@evil.com/x") would otherwise become an open redirect
  // once concatenated onto `origin` below.
  const next = sanitizeRedirectPath(searchParams.get("next"));

  // The auth provider can hand back an error instead of a code — most commonly
  // an expired or already-used password-reset / magic link (error_code=
  // otp_expired). Send the user back to sign-in with a readable message and
  // re-open the reset flow, rather than dropping them on a confusing page.
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  if (error || errorCode) {
    const desc = searchParams.get("error_description");
    const msg =
      errorCode === "otp_expired"
        ? "That link has expired. Request a new password reset email below."
        : desc
          ? desc.replace(/\+/g, " ")
          : "That link is invalid or has expired. Please try again.";
    return NextResponse.redirect(
      `${origin}/sign-in?autherror=${encodeURIComponent(msg)}`
    );
  }

  if (code && supabaseConfigured) {
    const supabase = createSupabaseServerClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    // A failed exchange (expired/used code, or a missing PKCE verifier when the
    // link is opened in a different browser) was previously swallowed — the user
    // then landed on a page with no session and a confusing "expired" message.
    // Surface the real reason on sign-in instead.
    if (exchangeError) {
      console.error("auth/callback exchange failed:", exchangeError);
      const msg = `${exchangeError.message}. Request a new reset email and open it right away in this browser.`;
      return NextResponse.redirect(
        `${origin}/sign-in?autherror=${encodeURIComponent(msg)}`
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
