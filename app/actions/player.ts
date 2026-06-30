"use server";

import { getCreators } from "@/lib/data";
import { tracksFromFeatured, type PlayerTrack } from "@/lib/player";

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
