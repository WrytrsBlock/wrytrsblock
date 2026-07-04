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

// Home page placeholder — shown in the mini player before the visitor has
// picked anything (see components/player/music-player-bar.tsx). Swap this out
// once there's a real source (e.g. a getTrendingTracksAction/genre radio call
// like getGenreRadioAction) for actual featured/trending creator tracks; every
// call site already just wants a PlayerTrack[], so nothing else needs to change.
export function getHomeDemoTracks(): PlayerTrack[] {
  return [
    {
      id: "demo-home-1",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      title: "Neon Rain (Demo)",
      creatorName: "Sasha Reyes",
      creatorHandle: "sashareyes",
      creatorType: "Producer",
      artwork:
        "https://images.unsplash.com/photo-1490971588422-52f6262a237a?auto=format&fit=crop&w=300&q=80",
      genre: "Pop",
    },
  ];
}

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
