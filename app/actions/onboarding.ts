"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_NOTIFICATION_EMAIL, supabaseConfigured } from "@/lib/env";
import {
  blockMatchScore,
  creatorTypeLabel,
  type OnboardingProfile,
} from "@/lib/onboarding";
import {
  countPublishedCreatorProfiles,
  upsertCreatorProfile,
} from "@/services/creator-profiles.service";
import { sendEmail } from "@/lib/email";
import { newCreatorAdminEmail, welcomeCreatorEmail } from "@/lib/email-templates";
import type { DB } from "@/services/types";

// Best-effort — fires once a creator's profile is actually published (the
// real "joined WrytrsBlock" moment: full name/creator type/city/country are
// all known by then, and a signup that never finished onboarding was never
// counted as a Creator). Awaited by the caller — matches this codebase's
// existing notify-then-await convention (e.g. notifyFileUpload,
// notifySplitSheetChanged) rather than firing-and-forgetting, since an
// unawaited call risks being cut off mid-flight once a serverless function
// returns. Both emails are independently try/caught so a failure in one
// (or in the creator-count lookup) can never surface as an onboarding error.
async function notifyNewCreator(
  supabase: DB,
  input: {
    userEmail: string;
    fullName: string;
    creatorType: string;
    city: string | null;
    country: string | null;
  }
) {
  const welcome = welcomeCreatorEmail({ name: input.fullName });
  const welcomePromise = sendEmail({
    to: input.userEmail,
    subject: welcome.subject,
    html: welcome.html,
  }).catch((e) => {
    console.error("[onboarding] welcome email failed:", e);
  });

  const adminPromise = (async () => {
    if (!ADMIN_NOTIFICATION_EMAIL) return;
    try {
      let totalCreators: number | null = null;
      try {
        totalCreators = await countPublishedCreatorProfiles(supabase);
      } catch (e) {
        console.error("[onboarding] creator count failed:", e);
      }
      const admin = newCreatorAdminEmail({
        fullName: input.fullName,
        email: input.userEmail,
        creatorType: input.creatorType,
        city: input.city,
        country: input.country,
        signupAt: new Date().toISOString(),
        totalCreators,
      });
      await sendEmail({ to: ADMIN_NOTIFICATION_EMAIL, subject: admin.subject, html: admin.html });
    } catch (e) {
      console.error("[onboarding] admin notification email failed:", e);
    }
  })();

  await Promise.all([welcomePromise, adminPromise]);
}

// Persists the completed onboarding profile. In demo mode (no Supabase) the flow
// keeps everything client-side (localStorage) and this is a no-op success, so
// "Enter WrytrsBlock" always works. With Supabase configured, it writes the
// display name + bio to their columns and the full typed payload to
// profiles.onboarding (jsonb) for discovery, filters, and Block Match.
export type CompleteOnboardingResult =
  | { ok: true }
  | { ok: false; error: string };

export async function completeOnboardingAction(
  profile: Omit<OnboardingProfile, "photo">,
  // The uploaded avatar URL (Supabase Storage public URL), or null.
  avatarUrl?: string | null
): Promise<CompleteOnboardingResult> {
  if (!supabaseConfigured) return { ok: true };

  // Mandatory profile photo — mirrors the client-side gate in
  // lib/onboarding.ts's isStepComplete, so a direct call can't bypass it.
  if (!avatarUrl || !avatarUrl.trim()) {
    return { ok: false, error: "Add a profile photo before finishing setup." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You need to be signed in." };

    const primaryRole = profile.creatorTypes[0]
      ? creatorTypeLabel(profile.creatorTypes[0])
      : null;

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.name || undefined,
        bio: profile.bio || null,
        role: primaryRole,
        avatar_url: avatarUrl ?? undefined,
        onboarding: profile,
      })
      .eq("id", user.id);

    if (error) return { ok: false, error: error.message };
    console.log(`[onboarding] profile saved + onboarding flag set for ${user.id}`);

    // Structured marketplace profile — the queryable source for Creator
    // Discovery, search/filters, and Block Match. Best-effort: a username
    // collision shouldn't block entering the app.
    // Structured marketplace profile — the queryable source for Creator
    // Discovery, search/filters, and Block Match. This MUST be created so the
    // creator appears in Discovery once onboarding completes. Previously the
    // error was swallowed (best-effort), which silently left onboarded users
    // with NO creator_profiles row — the cause of "more auth users than
    // marketplace profiles".
    const match = blockMatchScore({ ...profile, photo: null }).score;
    const baseRow = {
      id: user.id,
      handle: profile.username?.trim() || null,
      display_name: profile.name || null,
      tagline: profile.bio ? profile.bio.slice(0, 140) : null,
      bio: profile.bio || null,
      country: profile.country || null,
      city: profile.city || null,
      avatar_url: avatarUrl ?? null,
      creator_types: profile.creatorTypes,
      genres: profile.interests,
      looking_for: profile.lookingFor,
      availability: profile.availability,
      experience: profile.experience,
      gender: profile.gender,
      age_group: profile.ageGroup,
      block_match: match,
      is_published: true,
    };

    // A taken username (unique lower(handle)) is the common failure. Rather than
    // drop the whole row, fall back to a disambiguated handle, then to no handle
    // — a discoverable profile always beats a missing one. Genuine errors are
    // surfaced so onboarding can be retried instead of silently half-completing.
    const isHandleCollision = (e: unknown) => {
      const err = e as { code?: string; message?: string } | null;
      return (
        err?.code === "23505" ||
        /handle|duplicate key/i.test(err?.message ?? "")
      );
    };
    try {
      await upsertCreatorProfile(supabase, baseRow);
    } catch (e1) {
      if (baseRow.handle && isHandleCollision(e1)) {
        const alt = `${baseRow.handle}-${user.id.slice(0, 4)}`;
        try {
          await upsertCreatorProfile(supabase, { ...baseRow, handle: alt });
        } catch (e2) {
          if (isHandleCollision(e2)) {
            await upsertCreatorProfile(supabase, { ...baseRow, handle: null });
          } else {
            console.error("creator_profiles upsert failed:", e2);
            return {
              ok: false,
              error: "Couldn't publish your profile. Please try again.",
            };
          }
        }
      } else {
        console.error("creator_profiles upsert failed:", e1);
        return {
          ok: false,
          error: "Couldn't publish your profile. Please try again.",
        };
      }
    }

    console.log(`[onboarding] creator profile PUBLISHED (in Block Market) for ${user.id}`);
    revalidatePath("/marketplace");
    revalidatePath("/profile");
    revalidatePath("/home");

    if (user.email) {
      await notifyNewCreator(supabase, {
        userEmail: user.email,
        fullName: profile.name || "there",
        creatorType: primaryRole ?? "Not specified",
        city: profile.city || null,
        country: profile.country || null,
      });
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't save your profile.",
    };
  }
}
