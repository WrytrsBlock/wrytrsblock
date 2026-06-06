"use client";

import { useEffect, useState } from "react";
import { Music2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Track } from "@/lib/mock";

function lengthToSeconds(len?: string): number {
  if (!len) return 200;
  const [m, s] = len.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(m)) return 200;
  return m * 60 + (s || 0);
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// The creator's demo player — gradient transport, animated progress, track
// list. Audio is simulated (the demo reel is illustrative), but the transport
// behaves: play/pause, prev/next, click-to-select, auto-advance.
export function MediaPlayer({ tracks }: { tracks: Track[] }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0); // elapsed seconds

  const total = lengthToSeconds(tracks[idx]?.length);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setPos((p) => {
        const next = p + 0.5;
        if (next >= total) {
          // auto-advance
          setIdx((i) => (i + 1) % tracks.length);
          return 0;
        }
        return next;
      });
    }, 120);
    return () => clearInterval(id);
  }, [playing, total, tracks.length]);

  function select(i: number) {
    setIdx(i);
    setPos(0);
    setPlaying(true);
  }
  function step(dir: 1 | -1) {
    setIdx((i) => (i + dir + tracks.length) % tracks.length);
    setPos(0);
  }

  if (!tracks || tracks.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface-2 p-5 text-center">
        <Music2 size={18} className="mx-auto text-muted" />
        <p className="mt-2 text-[12.5px] text-muted">No demos yet</p>
      </div>
    );
  }

  const cur = tracks[idx];
  const pct = Math.min(100, (pos / total) * 100);

  return (
    <div className="space-y-3">
      {/* Transport */}
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
          className="shrink-0 h-10 w-10 rounded-full bg-grad-accent flex items-center justify-center shadow-glow hover:opacity-95 transition-opacity"
        >
          {playing ? (
            <Pause size={15} className="text-bg fill-bg" />
          ) : (
            <Play size={15} className="text-bg fill-bg translate-x-[1px]" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[13px] font-semibold text-ink truncate">
              {cur.name}
            </p>
            <span className="text-[10.5px] text-muted tabular-nums shrink-0">
              {fmt(pos)} / {cur.length ?? fmt(total)}
            </span>
          </div>
          {cur.source && (
            <p className="text-[11px] text-muted truncate mt-0.5">
              {cur.source}
            </p>
          )}
          <div className="mt-2 h-1 rounded-full bg-surface-3 overflow-hidden">
            <div
              className="h-full bg-grad-accent transition-[width] duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => step(-1)}
            aria-label="Previous"
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-ink hover:bg-surface-3 transition-colors"
          >
            <SkipBack size={14} className="fill-current" />
          </button>
          <button
            onClick={() => step(1)}
            aria-label="Next"
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-ink hover:bg-surface-3 transition-colors"
          >
            <SkipForward size={14} className="fill-current" />
          </button>
        </div>
      </div>

      {/* Track list */}
      {tracks.length > 1 && (
        <ul className="space-y-0.5">
          {tracks.map((t, i) => {
            const active = i === idx;
            return (
              <li key={`${t.name}-${i}`}>
                <button
                  onClick={() => select(i)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 h-11 rounded-lg text-left transition-colors",
                    active
                      ? "bg-surface-2 border border-line"
                      : "hover:bg-surface-2/60 border border-transparent"
                  )}
                >
                  <span
                    className={cn(
                      "h-7 w-7 rounded-md flex items-center justify-center shrink-0 text-[11px] tabular-nums",
                      active
                        ? "bg-grad-accent text-bg"
                        : "bg-surface-3 text-muted"
                    )}
                  >
                    {active && playing ? (
                      <Pause size={12} className="fill-current" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "block text-[12.5px] truncate",
                        active ? "text-ink font-medium" : "text-ink/90"
                      )}
                    >
                      {t.name}
                    </span>
                    {t.source && (
                      <span className="block text-[10.5px] text-muted truncate">
                        {t.source}
                      </span>
                    )}
                  </span>
                  {t.length && (
                    <span className="text-[10.5px] text-muted tabular-nums shrink-0">
                      {t.length}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
