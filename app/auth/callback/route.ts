import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

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
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
