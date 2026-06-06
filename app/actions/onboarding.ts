"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import {
  blockMatchScore,
  creatorTypeLabel,
  type OnboardingProfile,
} from "@/lib/onboarding";
import { upsertCreatorProfile } from "@/services/creator-profiles.service";

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

    // Structured marketplace profile — the queryable source for Creator
    // Discovery, search/filters, and Block Match. Best-effort: a username
    // collision shouldn't block entering the app.
    const match = blockMatchScore({ ...profile, photo: null }).score;
    await upsertCreatorProfile(supabase, {
      id: user.id,
      handle: profile.username || null,
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
    }).catch((e) => {
      console.error("creator_profiles upsert failed:", e?.message ?? e);
    });

    revalidatePath("/marketplace");
    revalidatePath("/profile");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't save your profile.",
    };
  }
}
