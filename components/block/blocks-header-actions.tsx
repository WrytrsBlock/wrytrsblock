"use client";

import { Plus, Search } from "lucide-react";
import { openCommandPalette, openNewBlock } from "@/lib/ui-events";

// My Blocks header actions — search (opens the command palette) + the blue
// "+" New Block action, matching the Figma My Blocks header. No new behavior:
// both wire to existing global actions.
export function BlocksHeaderActions() {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={() => openCommandPalette()}
        aria-label="Search"
        className="h-10 w-10 rounded-xl border border-line bg-surface flex items-center justify-center text-ink hover:bg-surface-2 transition-colors"
      >
        <Search size={16} strokeWidth={1.9} />
      </button>
      <button
        type="button"
        onClick={() => openNewBlock()}
        className="h-10 px-4 rounded-xl bg-grad-accent text-white text-[13px] font-medium inline-flex items-center gap-1.5 shadow-glow hover:opacity-95 transition-opacity"
      >
        <Plus size={16} strokeWidth={2.4} /> New Block
      </button>
    </div>
  );
}
