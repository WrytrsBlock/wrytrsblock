"use client";

import { useRef, useState } from "react";
import { Pause, Play, Repeat, Upload, Volume1, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { fmtTime } from "./format";
import type { SongPlayer } from "./use-song-player";

export function SongPlayerBar({
  player,
  instrumentalName,
  onAttach,
  onRemove,
  attaching,
}: {
  player: SongPlayer;
  instrumentalName: string | null;
  onAttach: (file: File) => void;
  onRemove: () => void;
  attaching: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const hasInstrumental = Boolean(instrumentalName);

  if (!hasInstrumental) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-surface-2/60 px-4 py-3">
        <Upload size={14} className="text-muted shrink-0" />
        <p className="text-[12.5px] text-muted flex-1">
          No instrumental attached yet — add one so everyone can write along
          to the beat.
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={attaching}
          onClick={() => fileRef.current?.click()}
        >
          {attaching ? "Uploading…" : "Attach instrumental"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onAttach(f);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 px-3 py-2.5">
      <audio ref={player.audioRef} preload="metadata" />

      <Button variant="accent" size="icon" onClick={player.toggle} aria-label={player.playing ? "Pause" : "Play"}>
        {player.playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </Button>

      <div className="flex-1 min-w-0 relative">
        <div className="relative h-1.5 flex items-center">
          {player.loopA != null && player.loopB != null && player.duration > 0 && (
            <div
              aria-hidden
              className="absolute h-1.5 rounded-full bg-accent/25"
              style={{
                left: `${(player.loopA / player.duration) * 100}%`,
                width: `${((player.loopB - player.loopA) / player.duration) * 100}%`,
              }}
            />
          )}
          <input
            type="range"
            aria-label="Seek"
            min={0}
            max={player.duration || 0}
            step={0.1}
            value={player.time}
            onChange={(e) => player.seek(Number(e.target.value))}
            className="relative z-10 w-full h-1.5 appearance-none bg-transparent accent-accent cursor-pointer [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-line-strong"
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10.5px] font-mono tabular-nums text-muted">
          <span>{fmtTime(player.time)}</span>
          <span className="truncate max-w-[40%] text-muted/70">{instrumentalName}</span>
          <span>{fmtTime(player.duration)}</span>
        </div>
      </div>

      <VolumeControl player={player} />

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="outline" size="sm" onClick={player.setA} title="Set loop point A">
          Set A
        </Button>
        <Button variant="outline" size="sm" onClick={player.setB} title="Set loop point B">
          Set B
        </Button>
        <Button
          variant={player.loopOn ? "accent" : "ghost"}
          size="icon"
          onClick={player.toggleLoop}
          disabled={player.loopA == null || player.loopB == null}
          aria-pressed={player.loopOn}
          aria-label={player.loopOn ? "Loop on" : "Loop off"}
          title={player.loopOn ? "Loop on" : "Loop off"}
        >
          <Repeat size={13} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label="Remove instrumental"
          title="Remove instrumental"
        >
          <X size={13} className="text-muted hover:text-danger" />
        </Button>
      </div>
    </div>
  );
}

function VolumeControl({ player }: { player: SongPlayer }) {
  const [open, setOpen] = useState(false);
  const Icon = player.volume === 0 ? VolumeX : player.volume < 0.5 ? Volume1 : Volume2;
  return (
    <div
      className="relative flex items-center shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Hover alone never fires on touch — without a tap toggle here, the
          slider (and therefore Volume, one of the required compact-player
          controls) would be permanently unreachable on mobile. */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Volume"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon size={14} />
      </Button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-150 ease-out",
          open ? "w-16 opacity-100" : "w-0 opacity-0"
        )}
      >
        <input
          type="range"
          aria-label="Volume"
          min={0}
          max={1}
          step={0.01}
          value={player.volume}
          onChange={(e) => player.setVolume(Number(e.target.value))}
          className="w-16 accent-accent cursor-pointer"
        />
      </div>
    </div>
  );
}
