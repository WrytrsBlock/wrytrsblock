import { isDirectAudio } from "@/lib/featured-content";
import type { FeaturedContentItem } from "@/types";

// A track as the global music player understands it. The player is for creator
// discovery — every track carries the creator's identity so a listener can jump
// to the profile and Start a Block.
export type PlayerTrack = {
  id: string;
  src: string;
  title: string;
  creatorName: string;
  creatorHandle: string;
  creatorType: string;
  artwork?: string;
  genre?: string;
};

// Up to `limit` directly-playable audio tracks from a creator's showcase items,
// tagged with that creator's identity + primary genre.
export function tracksFromFeatured(
  featured: FeaturedContentItem[] | undefined,
  meta: { name: string; handle: string; type: string; genre?: string },
  limit = 3
): PlayerTrack[] {
  const out: PlayerTrack[] = [];
  for (const it of featured ?? []) {
    if (out.length >= limit) break;
    if (!(it.type === "audio" || it.type === "song")) continue;
    if (!it.url || !isDirectAudio(it.url)) continue;
    out.push({
      id: it.id,
      src: it.url,
      title: it.title?.trim() || "Untitled",
      creatorName: meta.name,
      creatorHandle: meta.handle,
      creatorType: meta.type,
      artwork: it.thumbnail,
      genre: meta.genre,
    });
  }
  return out;
}
