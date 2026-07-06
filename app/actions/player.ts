"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { getCreator, getCreators } from "@/lib/data";
import { getProfile } from "@/services/profiles.service";
import { tracksFromFeatured, type PlayerTrack } from "@/lib/player";

// Home's mini player shows the signed-in listener's own featured track while
// idle (see components/player/music-player-bar.tsx) instead of a generic
// placeholder — it's their own showcase, so tapping play previews their own
// music. Returns [] for a signed-out visitor or a creator with no direct-
// audio featured item; the bar simply doesn't render in that case.
export async function getMyFeaturedTrackAction(): Promise<PlayerTrack[]> {
  if (!supabaseConfigured) return [];
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const profile = await getProfile(supabase, user.id);
    if (!profile?.handle) return [];

    const creator = await getCreator(profile.handle);
    if (!creator) return [];

    return tracksFromFeatured(creator.profile.featuredContent, {
      name: creator.person.name,
      handle: creator.person.handle,
      type: creator.profile.roles?.[0] ?? "Creator",
      genre: creator.profile.skills?.[0],
    }).slice(0, 1);
  } catch {
    return [];
  }
}

// "Radio": once a creator's tracks finish, keep the listener in flow by serving
// more tracks from OTHER creators in the same genre (discovery, not streaming).
export async function getGenreRadioAction(
  genre: string | undefined,
  excludeHandle: string,
  limit = 10
): Promise<PlayerTrack[]> {
  try {
    const creators = await getCreators();
    const g = genre?.toLowerCase();
    const pool: PlayerTrack[] = [];
    for (const c of creators) {
      if (c.person.handle === excludeHandle) continue;
      const genres = (c.profile.skills ?? []).map((x) => x.toLowerCase());
      // When we know the genre, require a match; otherwise take anything.
      if (g && !genres.includes(g)) continue;
      pool.push(
        ...tracksFromFeatured(c.profile.featuredContent, {
          name: c.person.name,
          handle: c.person.handle,
          type: c.profile.roles?.[0] ?? "Creator",
          genre: c.profile.skills?.[0],
        })
      );
    }
    // Light shuffle so the radio isn't identical every time.
    return pool.sort(() => Math.random() - 0.5).slice(0, limit);
  } catch {
    return [];
  }
}
