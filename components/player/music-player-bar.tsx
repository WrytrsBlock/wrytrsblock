"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  Music2,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { openNewBlock } from "@/lib/ui-events";
import { useMusicPlayer } from "./music-player";

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// The persistent discovery player. Sits just above the mobile dock (it's a
// shrink-0 row at the foot of <main>, not fixed), so it never overlaps content
// and stays put as the user navigates.
export function MusicPlayerBar() {
  const {
    current,
    playing,
    time,
    duration,
    volume,
    canPrev,
    canNext,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    closePlayer,
  } = useMusicPlayer();
  const trackRef = useRef<HTMLDivElement>(null);

  if (!current) return null;

  const pct = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;

  function onSeek(e: React.MouseEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!el || !duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  }

  return (
    <div className="shrink-0 px-3 pb-2 pt-1.5 lg:px-4">
      <div className="relative mx-auto flex max-w-3xl items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.1] glass-strong px-3 py-2.5 shadow-[0_12px_36px_-10px_rgb(0_0_0/0.7)]">
        {/* Seek bar pinned to the top edge of the dock */}
        <div
          ref={trackRef}
          onClick={onSeek}
          className="group absolute inset-x-0 top-0 z-10 h-3 -translate-y-1 cursor-pointer"
        >
          <div className="absolute inset-x-0 top-1 h-1 bg-white/10">
            <div
              className="h-full bg-grad-accent"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Artwork */}
        {current.artwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.artwork}
            alt=""
            className="h-11 w-11 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#FFD98A]">
            <Music2 size={18} />
          </span>
        )}

        {/* Title + creator */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">
            {current.title}
          </p>
          <p className="truncate text-[11.5px] text-muted">
            <Link
              href={`/profile/${current.creatorHandle}`}
              className="font-medium text-white/80 hover:text-white hover:underline"
            >
              {current.creatorName}
            </Link>
            <span className="text-muted"> · {current.creatorType}</span>
          </p>
        </div>

        {/* Desktop: elapsed / total */}
        <span className="hidden shrink-0 text-[10.5px] tabular-nums text-muted sm:block">
          {fmt(time)} / {fmt(duration)}
        </span>

        {/* Transport */}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={prev}
            disabled={!canPrev}
            aria-label="Previous"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:text-ink disabled:opacity-30"
          >
            <SkipBack size={16} className="fill-current" />
          </button>
          <button
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-grad-accent shadow-glow transition-opacity hover:opacity-95"
          >
            {playing ? (
              <Pause size={15} className="fill-bg text-bg" />
            ) : (
              <Play size={15} className="translate-x-[1px] fill-bg text-bg" />
            )}
          </button>
          <button
            onClick={next}
            disabled={!canNext}
            aria-label="Next"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:text-ink disabled:opacity-30"
          >
            <SkipForward size={16} className="fill-current" />
          </button>
        </div>

        {/* Desktop: volume */}
        <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
          <Volume2 size={15} className="text-muted" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="Volume"
            className="h-1 w-20 cursor-pointer accent-[#6366f1]"
          />
        </div>

        {/* Start a Block with this creator — the whole point of discovery. */}
        <button
          onClick={() => openNewBlock(undefined, current.creatorHandle)}
          aria-label="Start a Block with this creator"
          title="Start a Block"
          className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-white/90 sm:inline-flex"
        >
          <Plus size={13} /> Block
        </button>

        {/* Close */}
        <button
          onClick={closePlayer}
          aria-label="Close player"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/10 hover:text-ink"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
