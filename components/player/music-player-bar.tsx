"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
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
import { getMyFeaturedTrackAction } from "@/app/actions/player";
import type { PlayerTrack } from "@/lib/player";
import { useMusicPlayer } from "./music-player";

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// The persistent discovery player. Sits just above the mobile dock (it's a
// shrink-0 row at the foot of <main>, not fixed), so it never overlaps content
// and stays put as the user navigates. Global: it shows on any page once a
// track is playing (started from e.g. a profile's Featured Tracks), so
// playback keeps going seamlessly as the visitor browses. On the Home page
// specifically, it also shows — with the signed-in listener's own featured
// track ready to press Play on — even before anything else has been picked,
// so Home showcases the listener's own music instead of sitting empty.
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
    playTracks,
  } = useMusicPlayer();
  const pathname = usePathname();
  const trackRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [myTrack, setMyTrack] = useState<PlayerTrack[]>([]);

  // Home-only: the signed-in listener's own featured track, fetched once
  // nothing else is already playing. Everything below only cares that it's a
  // PlayerTrack[], not where it came from.
  const wantsOwnTrack = !current && pathname === "/home";

  useEffect(() => {
    if (!wantsOwnTrack) return;
    let cancelled = false;
    getMyFeaturedTrackAction().then((tracks) => {
      if (!cancelled) setMyTrack(tracks);
    });
    return () => {
      cancelled = true;
    };
  }, [wantsOwnTrack]);

  const demoTracks = wantsOwnTrack ? myTrack : [];
  const demo = demoTracks[0] ?? null;

  if (!current && !demo) return null;

  const showingDemo = !current;
  const display = current ?? demo!;
  const pct = !showingDemo && duration > 0 ? Math.min(100, (time / duration) * 100) : 0;

  function onSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (showingDemo) return;
    const el = trackRef.current;
    if (!el || !duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  }

  // Pressing Play on the demo is the ONE moment audio actually starts — every
  // other render of this bar is either already-playing or paused-but-loaded.
  function onPlayPause() {
    if (showingDemo) playTracks(demoTracks, 0);
    else toggle();
  }

  return (
    <>
      <div className="shrink-0 px-3 pb-2 pt-1.5 lg:px-4">
        <div className="relative mx-auto flex max-w-3xl items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.1] glass-strong px-3 py-2.5 shadow-[0_12px_36px_-10px_rgb(0_0_0/0.7)]">
          {/* Seek bar pinned to the top edge of the dock */}
          <div
            ref={trackRef}
            onClick={onSeek}
            className={cn(
              "group absolute inset-x-0 top-0 z-10 h-3 -translate-y-1",
              showingDemo ? "cursor-default" : "cursor-pointer"
            )}
          >
            <div className="absolute inset-x-0 top-1 h-1 bg-white/10">
              <div
                className="h-full bg-grad-accent transition-[width] duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Artwork + title/creator — tap to expand (structure for the
              future full-screen player; not fully built out yet). */}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            {display.artwork ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={display.artwork}
                alt=""
                className="h-[52px] w-[52px] shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#FFD98A]">
                <Music2 size={20} />
              </span>
            )}

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-ink">
                {display.title}
              </span>
              <span className="block truncate text-[11.5px] text-muted">
                {showingDemo ? (
                  <span className="font-medium text-white/80">
                    {display.creatorName}
                  </span>
                ) : (
                  <Link
                    href={`/profile/${display.creatorHandle}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-white/80 hover:text-white hover:underline"
                  >
                    {display.creatorName}
                  </Link>
                )}
                <span className="text-muted"> · {display.creatorType}</span>
              </span>
            </span>
          </button>

          {/* Desktop: elapsed / total */}
          <span className="hidden shrink-0 text-[10.5px] tabular-nums text-muted sm:block">
            {showingDemo ? "Tap play to preview" : `${fmt(time)} / ${fmt(duration)}`}
          </span>

          {/* Transport */}
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={prev}
              disabled={showingDemo || !canPrev}
              aria-label="Previous"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:text-ink disabled:opacity-30"
            >
              <SkipBack size={16} className="fill-current" />
            </button>
            <button
              onClick={onPlayPause}
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
              disabled={showingDemo || !canNext}
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

          {/* Start a Block with this creator — only for a real track; the
              Home demo isn't a real, invitable creator. */}
          {!showingDemo && (
            <button
              onClick={() => openNewBlock(undefined, display.creatorHandle)}
              aria-label="Start a Block with this creator"
              title="Start a Block"
              className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-white/90 sm:inline-flex"
            >
              <Plus size={13} /> Block
            </button>
          )}

          {/* Close — nothing to close on the demo, so it's hidden there. */}
          {!showingDemo && (
            <button
              onClick={closePlayer}
              aria-label="Close player"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/10 hover:text-ink"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <ExpandedPlayer
          display={display}
          showingDemo={showingDemo}
          playing={playing}
          time={time}
          duration={duration}
          pct={pct}
          canPrev={canPrev}
          canNext={canNext}
          onPlayPause={onPlayPause}
          onPrev={prev}
          onNext={next}
          onSeek={onSeek}
          onClose={() => setExpanded(false)}
        />
      )}
    </>
  );
}

// Full-screen "Now Playing" placeholder — the structure the mini player
// expands into. Deliberately simple (reuses the same transport controls); a
// richer expanded design can replace this body without touching the mini bar
// or the playback context.
function ExpandedPlayer({
  display,
  showingDemo,
  playing,
  time,
  duration,
  pct,
  canPrev,
  canNext,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onClose,
}: {
  display: { title: string; creatorName: string; creatorType: string; artwork?: string };
  showingDemo: boolean;
  playing: boolean;
  time: number;
  duration: number;
  pct: number;
  canPrev: boolean;
  canNext: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-bg animate-fade-up"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <button
          onClick={onClose}
          aria-label="Collapse player"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-ink"
        >
          <ChevronDown size={20} />
        </button>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Now Playing
        </span>
        <span className="w-9" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8">
        {display.artwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={display.artwork}
            alt=""
            className="h-64 w-64 max-w-full rounded-2xl object-cover shadow-[0_24px_60px_-18px_rgb(0_0_0/0.7)]"
          />
        ) : (
          <span className="flex h-64 w-64 max-w-full items-center justify-center rounded-2xl bg-white/[0.06] text-[#FFD98A]">
            <Music2 size={48} />
          </span>
        )}

        <div className="text-center">
          <p className="font-display text-xl text-ink">{display.title}</p>
          <p className="mt-1 text-[13px] text-muted">
            {display.creatorName} · {display.creatorType}
          </p>
        </div>

        <div className="w-full max-w-sm space-y-2">
          <div onClick={onSeek} className={cn("h-1.5 w-full rounded-full bg-white/10", !showingDemo && "cursor-pointer")}>
            <div className="h-full rounded-full bg-grad-accent" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10.5px] tabular-nums text-muted">
            <span>{showingDemo ? "0:00" : fmt(time)}</span>
            <span>{showingDemo ? "" : fmt(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={onPrev}
            disabled={showingDemo || !canPrev}
            aria-label="Previous"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:text-ink disabled:opacity-30"
          >
            <SkipBack size={22} className="fill-current" />
          </button>
          <button
            onClick={onPlayPause}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-grad-accent shadow-glow transition-opacity hover:opacity-95"
          >
            {playing ? (
              <Pause size={26} className="fill-bg text-bg" />
            ) : (
              <Play size={26} className="translate-x-[2px] fill-bg text-bg" />
            )}
          </button>
          <button
            onClick={onNext}
            disabled={showingDemo || !canNext}
            aria-label="Next"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:text-ink disabled:opacity-30"
          >
            <SkipForward size={22} className="fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
