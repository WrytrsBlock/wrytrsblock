"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import {
  getCreatorProfileById,
  saveCreator,
  unsaveCreator,
  upsertCreatorProfile,
} from "@/services/creator-profiles.service";
import type { FeaturedContentItem } from "@/types";

export type ToggleSaveResult = { ok: boolean; error?: string };

export type UpdateProfileInput = {
  bio: string;
  country: string;
  city: string;
  creatorTypes: string[];
  genres: string[];
  lookingFor: string[];
  availability: string[];
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  // Featured Work (legacy)
  portfolio?: string[];
  youtube?: string;
  // Featured Content — curated showcase items
  featuredContent?: FeaturedContentItem[];
};
export type UpdateProfileResult =
  | { ok: true; handle: string | null }
  | { ok: false; error: string };

// Save edits from the Edit Profile page to creator_profiles (and sync the
// display fields on profiles). Real-mode only; surfaces the actual error.
export async function updateCreatorProfileAction(
  input: UpdateProfileInput
): Promise<UpdateProfileResult> {
  if (!supabaseConfigured) return { ok: true, handle: null };
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You need to be signed in." };

    // Merge YouTube into the existing socials map (preserve other links).
    let socialsUpdate: Record<string, string> | undefined;
    if (input.youtube !== undefined) {
      const current = await getCreatorProfileById(supabase, user.id).catch(
        () => null
      );
      const socials = { ...(current?.socials ?? {}) };
      const yt = input.youtube.trim();
      if (yt) socials.youtube = yt;
      else delete socials.youtube;
      socialsUpdate = socials;
    }

    const row = await upsertCreatorProfile(supabase, {
      id: user.id,
      bio: input.bio || null,
      country: input.country || null,
      city: input.city || null,
      creator_types: input.creatorTypes,
      genres: input.genres,
      looking_for: input.lookingFor,
      availability: input.availability,
      ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
      ...(input.bannerUrl !== undefined ? { banner_url: input.bannerUrl } : {}),
      ...(input.portfolio !== undefined ? { portfolio: input.portfolio } : {}),
      ...(socialsUpdate !== undefined ? { socials: socialsUpdate } : {}),
      ...(input.featuredContent !== undefined
        ? { featured_content: input.featuredContent }
        : {}),
    });

    // Keep the sidebar/topbar avatar + bio in sync (those read from profiles).
    await supabase
      .from("profiles")
      .update({
        bio: input.bio || null,
        ...(input.avatarUrl ? { avatar_url: input.avatarUrl } : {}),
      })
      .eq("id", user.id)
      .then(() => {});

    revalidatePath("/marketplace");
    revalidatePath("/profile");
    if (row.handle) revalidatePath(`/profile/${row.handle}`);
    return { ok: true, handle: row.handle ?? null };
  } catch (e) {
    console.error("updateCreatorProfileAction failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't save your profile.",
    };
  }
}

// Persist a "Save"/bookmark on a creator. No-op success in demo mode (the
// marketplace also keeps a local bookmark for instant feedback there).
export async function toggleSaveCreatorAction(
  creatorId: string,
  save: boolean
): Promise<ToggleSaveResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sign in to save creators." };

    if (save) await saveCreator(supabase, user.id, creatorId);
    else await unsaveCreator(supabase, user.id, creatorId);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't update saved creators.",
    };
  }
}
