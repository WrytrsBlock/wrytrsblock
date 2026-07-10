"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { ADMIN_NOTIFICATION_EMAIL } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { newSignupAdminEmail, welcomeCreatorEmail } from "@/lib/email-templates";

// How stale a user id can be and still be treated as "just signed up". Blocks
// replaying an old/foreign user id (e.g. from a stale client bundle or a
// crafted request) to re-trigger these emails long after the fact.
const MAX_SIGNUP_AGE_MS = 10 * 60 * 1000;

// Called from the sign-up form right after supabase.auth.signUp() succeeds —
// this is the ONLY place the welcome email is sent (the fuller admin alert
// fires again once onboarding completes; see app/actions/onboarding.ts's
// notifyNewCreator). Re-derives the user's email/name/created_at itself via
// the service-role client rather than trusting client-supplied values, and
// claims the send atomically via profiles.signup_email_sent_at so a retried
// or duplicated call can never send twice. Never throws — this must never
// block the signup redirect.
export async function notifySignupAction(userId: string): Promise<void> {
  const service = createSupabaseServiceClient();
  if (!service) return; // no service-role key configured — skip silently

  try {
    const { data, error } = await service.auth.admin.getUserById(userId);
    if (error || !data.user) return;
    const user = data.user;

    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
    if (!createdAt || Date.now() - createdAt > MAX_SIGNUP_AGE_MS) return;

    const email = user.email;
    if (!email) return;
    const fullName =
      (user.user_metadata?.display_name as string | undefined)?.trim() || "there";

    // Atomic claim: only the first call for this user actually sends.
    const { data: claimed } = await service
      .from("profiles")
      .update({ signup_email_sent_at: new Date().toISOString() })
      .eq("id", userId)
      .is("signup_email_sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) return; // already sent (or no profiles row yet)

    const welcome = welcomeCreatorEmail({ name: fullName });
    const welcomePromise = sendEmail({
      to: email,
      subject: welcome.subject,
      html: welcome.html,
    }).catch((e) => {
      console.error("[signup-notify] welcome email failed:", e);
    });

    const adminPromise = (async () => {
      if (!ADMIN_NOTIFICATION_EMAIL) return;
      try {
        const admin = newSignupAdminEmail({
          fullName,
          email,
          signupAt: user.created_at ?? new Date().toISOString(),
        });
        await sendEmail({ to: ADMIN_NOTIFICATION_EMAIL, subject: admin.subject, html: admin.html });
      } catch (e) {
        console.error("[signup-notify] admin email failed:", e);
      }
    })();

    await Promise.all([welcomePromise, adminPromise]);
  } catch (e) {
    console.error("[signup-notify] notifySignupAction threw:", e);
  }
}
