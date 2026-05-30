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

    await updateProfile(supabase, user.id, {
      display_name: input.display_name.trim(),
      handle: input.handle.trim() || null,
      role: input.role.trim() || null,
      bio: input.bio.trim() || null,
    });

    revalidatePath("/settings");
    revalidatePath("/home");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save profile.",
    };
  }
}
