"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Move, X } from "lucide-react";
import { updateCoverPositionAction } from "@/app/actions/creators";

// The profile hero image + a "Reposition Cover Photo" tool. Owners can drag the
// image vertically within the fixed hero frame to choose the focal point; the
// Y-position (0–100, 50 = centered) is saved and re-applied on every render.
export function HeroCover({
  image,
  alt,
  position,
  editable,
}: {
  image: string;
  alt: string;
  position: number;
  editable: boolean;
}) {
  const router = useRouter();
  const frameRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(clamp(position));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const drag = useRef<{ startY: number; startPos: number; h: number } | null>(
    null
  );
  const original = useRef(clamp(position));

  function onPointerDown(e: React.PointerEvent) {
    if (!editing) return;
    const h = frameRef.current?.offsetHeight ?? 1;
    drag.current = { startY: e.clientY, startPos: pos, h };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* pointer may not be capturable */
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    // Dragging down reveals the top of the image → lower object-position %.
    setPos(clamp(d.startPos - (dy / d.h) * 100));
  }

  function onPointerUp(e: React.PointerEvent) {
    drag.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* capture may already be released */
    }
  }

  async function save() {
    setSaving(true);
    setNote(null);
    const res = await updateCoverPositionAction(pos);
    setSaving(false);
    if (res.ok) {
      original.current = pos;
      setEditing(false);
      if (res.warning) setNote(res.warning);
      else router.refresh();
    } else {
      setNote(res.error ?? "Couldn't save. Try again.");
    }
  }

  function cancel() {
    setPos(original.current);
    setEditing(false);
    setNote(null);
  }

  return (
    <div ref={frameRef} className="absolute inset-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={alt}
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover"
        style={{ objectPosition: `50% ${pos}%` }}
      />

      {/* Reposition entry point (owner only) */}
      {editable && !editing && (
        <button
          type="button"
          onClick={() => {
            original.current = pos;
            setEditing(true);
          }}
          className="absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <Move size={13} /> Reposition Cover Photo
        </button>
      )}

      {/* Edit mode — full-frame drag surface + controls */}
      {editing && (
        <>
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="absolute inset-0 z-30 cursor-grab touch-none active:cursor-grabbing"
            style={{ background: "rgba(0,0,0,0.18)" }}
          />
          <div className="pointer-events-none absolute left-4 top-4 z-40">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/55 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm">
              <Move size={13} /> Drag to reposition
            </span>
          </div>
          <div className="absolute right-4 top-4 z-40 flex items-center gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60 disabled:opacity-60"
            >
              <X size={13} /> Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{ color: "#FFFFFF" }}
              className="inline-flex items-center gap-1.5 rounded-full bg-grad-accent px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-glow transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Save
            </button>
          </div>
        </>
      )}

      {note && (
        <span className="absolute bottom-4 right-4 z-40 rounded-lg bg-black/60 px-2.5 py-1 text-[11.5px] text-white">
          {note}
        </span>
      )}
    </div>
  );
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 25;
  return Math.min(100, Math.max(0, n));
}
