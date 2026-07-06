"use client";

import { useState } from "react";
import { Bookmark, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import type { SongwriterLoopMarkerView } from "@/app/actions/songwriter";
import { fmtTime } from "./format";
import type { SongPlayer } from "./use-song-player";

// Saved A/B loops ("Verse 1", "Chorus", ...) — synced to every collaborator;
// clicking one only jumps the local playhead (doesn't touch loop A/B/on, per
// the plan's explicit "keep simple" call).
export function LoopMarkersList({
  markers,
  player,
  onSave,
  onRemove,
}: {
  markers: SongwriterLoopMarkerView[];
  player: SongPlayer;
  onSave: (name: string, startSeconds: number, endSeconds: number) => void;
  onRemove: (markerId: string) => void;
}) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const canSave = player.loopA != null && player.loopB != null;

  function submit() {
    if (!canSave || !name.trim()) return;
    onSave(name.trim(), player.loopA as number, player.loopB as number);
    setName("");
    setNaming(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-wide text-muted font-medium">
          Loop markers
        </span>
        {!naming ? (
          <Button variant="ghost" size="sm" disabled={!canSave} onClick={() => setNaming(true)}>
            <Plus size={11} /> Save loop
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. Chorus"
              className="w-28 bg-surface-2 border border-line rounded-md px-2 py-1 text-[11.5px] text-ink focus:outline-none focus:border-accent/50"
            />
            <Button variant="primary" size="sm" onClick={submit}>
              Save
            </Button>
          </span>
        )}
      </div>

      {markers.length === 0 ? (
        <p className="text-[11.5px] text-muted/70">
          Set A and B on the player, then save the loop to name it.
        </p>
      ) : (
        <ul className="space-y-1">
          {markers.map((m) => (
            <li key={m.id} className="group flex items-center gap-2">
              <button
                onClick={() => player.jumpTo(m.startSeconds)}
                className="flex-1 min-w-0 flex items-center gap-1.5 text-left rounded-md px-2 py-1.5 hover:bg-surface-2 transition-colors"
              >
                <Bookmark size={11} className="text-accent shrink-0" />
                <span className="text-[12px] text-ink truncate">{m.name}</span>
                <span className="ml-auto text-[10.5px] font-mono text-muted shrink-0">
                  {fmtTime(m.startSeconds)}–{fmtTime(m.endSeconds)}
                </span>
              </button>
              <button
                onClick={() => onRemove(m.id)}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-opacity shrink-0"
                aria-label={`Remove ${m.name}`}
              >
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
