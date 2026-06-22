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
  // Identity
  displayName?: string;
  handle?: string;
  website?: string;
  // All social links keyed by platform; replaces the stored socials map.
  socials?: Record<string, string>;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  // Featured Work (legacy)
  portfolio?: string[];
  youtube?: string;
  // Block Showcase — curated showcase items
  featuredContent?: FeaturedContentItem[];
};
export type UpdateProfileResult =
  | { ok: true; handle: string | null; warning?: string }
  | { ok: false; error: string };

// Columns that come from later migrations. If a deployment hasn't applied those
// migrations yet, an upsert that includes them fails with a "schema cache" /
// "column does not exist" error — which historically nuked the WHOLE save,
// including avatar_url + banner_url. We strip any such column and retry so core
// profile fields (photo, cover, bio) ALWAYS persist. Returns the saved row plus
// the list of columns that had to be dropped.
const OPTIONAL_COLUMNS = ["featured_content", "portfolio"] as const;

async function upsertProfileResilient(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  fullRow: Record<string, unknown> & { id: string }
): Promise<{ row: Awaited<ReturnType<typeof upsertCreatorProfile>>; dropped: string[] }> {
  let payload: Record<string, unknown> & { id: string } = { ...fullRow };
  const dropped: string[] = [];

  // At most one retry per optional column.
  for (let attempt = 0; attempt <= OPTIONAL_COLUMNS.length; attempt++) {
    try {
      const row = await upsertCreatorProfile(
        supabase,
        payload as Parameters<typeof upsertCreatorProfile>[1]
      );
      return { row, dropped };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Find an optional column the DB is complaining about and still in payload.
      const offending = OPTIONAL_COLUMNS.find(
        (c) => c in payload && msg.toLowerCase().includes(c)
      );
      if (!offending) throw e; // a real error — surface it
      const next = { ...payload };
      delete next[offending];
      payload = next;
      dropped.push(offending);
    }
  }
  // Exhausted retries — make a final attempt so a genuine error propagates.
  const row = await upsertCreatorProfile(
    supabase,
    payload as Parameters<typeof upsertCreatorProfile>[1]
  );
  return { row, dropped };
}

// Save edits from the Edit Profile page to creator_profiles (and sync the
// display fields on profiles). Real-mode only; surfaces the actual error.
// Persist the hero cover's vertical focal point (0–100). Tolerant of the
// pre-migration state: if the column doesn't exist yet, it returns ok with a
// warning rather than surfacing an error to the creator.
export async function updateCoverPositionAction(
  position: number
): Promise<{ ok: boolean; error?: string; warning?: string }> {
  if (!supabaseConfigured) return { ok: true };
  const y = Math.round(Math.min(100, Math.max(0, position)));
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You need to be signed in." };

    const { error } = await supabase
      .from("creator_profiles")
      .update({ cover_position: y })
      .eq("id", user.id);

    if (error) {
      // Column missing (migration 0020 not applied) — don't hard-fail.
      if (/cover_position|column|schema cache/i.test(error.message)) {
        return { ok: true, warning: "Reposition needs a quick database update." };
      }
      return { ok: false, error: error.message };
    }

    revalidatePath("/profile");
    revalidatePath(`/profile/${user.id}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't save the position.",
    };
  }
}

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

    // Socials: a full map from the form replaces the stored one (empty values
    // dropped); otherwise fall back to merging the legacy single youtube field.
    let socialsUpdate: Record<string, string> | undefined;
    if (input.socials !== undefined) {
      socialsUpdate = Object.fromEntries(
        Object.entries(input.socials)
          .map(([k, v]) => [k, (v ?? "").trim()] as const)
          .filter(([, v]) => v.length > 0)
      );
    } else if (input.youtube !== undefined) {
      const current = await getCreatorProfileById(supabase, user.id).catch(
        () => null
      );
      const socials = { ...(current?.socials ?? {}) };
      const yt = input.youtube.trim();
      if (yt) socials.youtube = yt;
      else delete socials.youtube;
      socialsUpdate = socials;
    }

    // Identity: normalize the username (lowercase, url-safe). An empty handle is
    // ignored so a creator never accidentally blanks their profile URL.
    const handle =
      input.handle !== undefined
        ? input.handle
            .trim()
            .toLowerCase()
            .replace(/^@+/, "")
            .replace(/[^a-z0-9_.-]/g, "")
        : undefined;
    const displayName =
      input.displayName !== undefined ? input.displayName.trim() : undefined;
    const website =
      input.website !== undefined ? input.website.trim() : undefined;

    const { row, dropped } = await upsertProfileResilient(supabase, {
      id: user.id,
      bio: input.bio || null,
      country: input.country || null,
      city: input.city || null,
      creator_types: input.creatorTypes,
      genres: input.genres,
      looking_for: input.lookingFor,
      availability: input.availability,
      ...(displayName !== undefined ? { display_name: displayName || null } : {}),
      ...(handle ? { handle } : {}),
      ...(website !== undefined ? { website: website || null } : {}),
      ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
      ...(input.bannerUrl !== undefined ? { banner_url: input.bannerUrl } : {}),
      ...(input.portfolio !== undefined ? { portfolio: input.portfolio } : {}),
      ...(socialsUpdate !== undefined ? { socials: socialsUpdate } : {}),
      ...(input.featuredContent !== undefined
        ? { featured_content: input.featuredContent }
        : {}),
    });

    // Keep the sidebar/topbar avatar + bio in sync (those read from profiles).
    // Mirror avatar changes including removal (null), so the shell never shows a
    // stale photo.
    await supabase
      .from("profiles")
      .update({
        bio: input.bio || null,
        ...(input.avatarUrl !== undefined
          ? { avatar_url: input.avatarUrl }
          : {}),
        ...(displayName !== undefined
          ? { display_name: displayName || null }
          : {}),
        ...(handle ? { handle } : {}),
      })
      .eq("id", user.id)
      .then(() => {});

    revalidatePath("/marketplace");
    revalidatePath("/profile");
    revalidatePath("/", "layout"); // refresh the sidebar/topbar user card
    if (row.handle) revalidatePath(`/profile/${row.handle}`);

    // If Featured Content couldn't be saved because its column isn't in the DB
    // yet (migration 0011 not applied), the photo/cover/bio still saved — tell
    // the user precisely what didn't, rather than failing the whole save.
    const warning = dropped.includes("featured_content")
      ? "Your photo and cover were saved. Featured Content couldn't be saved yet — the database migration (0011_featured_content) hasn't been applied."
      : undefined;

    return { ok: true, handle: row.handle ?? null, warning };
  } catch (e) {
    console.error("updateCreatorProfileAction failed:", e);
    const msg = e instanceof Error ? e.message : "";
    // A unique-constraint hit here is almost always the handle/username.
    if (/duplicate key|already exists|unique constraint/i.test(msg)) {
      return {
        ok: false,
        error: "That username is already taken — please choose another.",
      };
    }
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
