"use client";

import { Music2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { useMusicPlayer } from "@/components/player/music-player";
import type { PlayerTrack } from "@/lib/player";

// Featured Tracks — a creator's showcase reel (up to 3). Tapping a track loads
// it into the global player so it keeps playing as the visitor explores.
export function FeaturedTracks({ tracks }: { tracks: PlayerTrack[] }) {
  const { current, playing, playTracks, toggle } = useMusicPlayer();

  if (!tracks.length) return null;

  return (
    <section className="mb-6">
      <h2 className="mb-2.5 text-[15px] font-semibold tracking-tight text-ink">
        Featured Tracks
      </h2>
      <ul className="space-y-1.5">
        {tracks.map((t, i) => {
          const isCurrent = current?.id === t.id;
          const isPlaying = isCurrent && playing;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => (isCurrent ? toggle() : playTracks(tracks, i))}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  isCurrent
                    ? "border-accent/40 bg-accent/[0.07]"
                    : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg",
                    isCurrent ? "bg-grad-accent text-bg" : "bg-white/[0.06] text-[#FFD98A]"
                  )}
                >
                  {t.artwork && !isCurrent ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.artwork} alt="" className="h-full w-full object-cover" />
                  ) : isPlaying ? (
                    <Pause size={16} className="fill-current" />
                  ) : isCurrent ? (
                    <Play size={16} className="translate-x-[1px] fill-current" />
                  ) : (
                    <Music2 size={16} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">
                    {t.title}
                  </span>
                  <span className="block truncate text-[11.5px] text-muted">
                    {t.creatorType}
                  </span>
                </span>
                {isPlaying && (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    Playing
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
