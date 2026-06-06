"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { updateProfile } from "@/services/profiles.service";

export type ProfileInput = {
  display_name: string;
  handle: string;
  role: string;
  bio: string;
  // Creator fields. Persisted as profile columns get added; accepted now so the
  // settings form is complete and forward-compatible.
  roles?: string[];
  location?: string;
  website?: string;
  skills?: string[];
  avatar_url?: string;
  banner_url?: string;
  socials?: Record<string, string>;
};

export type ProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfileAction(
  input: ProfileInput
): Promise<ProfileResult> {
  if (!input.display_name?.trim())
    return { ok: false, error: "Display name is required." };

  // Demo mode: accept and no-op so the form is exercisable without a backend.
  if (!supabaseConfigured) return { ok: true };

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You need to be signed in." };

    // Core profile columns that exist today. Extended creator fields
    // (roles/location/website/skills/banner/socials) persist once their
    // columns are added to the profiles table.
    await updateProfile(supabase, user.id, {
      display_name: input.display_name.trim(),
      handle: input.handle.trim() || null,
      role: input.role.trim() || null,
      bio: input.bio.trim() || null,
      ...(input.avatar_url ? { avatar_url: input.avatar_url } : {}),
    });

    revalidatePath("/settings");
    revalidatePath("/marketplace");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save profile.",
    };
  }
}
