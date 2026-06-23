"use client";

import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/primitives";
import { openCommandPalette } from "@/lib/ui-events";
import { NotificationsMenu } from "@/components/shell/notifications-menu";

// The global top bar: a centered, floating liquid-glass search pill (Apple
// Liquid Glass treatment) plus the notifications bell on the right. Clicking the
// pill — or ⌘K — opens the command palette. The bell turns yellow when there's
// something new. Navigation lives in the left sidebar / bottom dock.
export function TopBar(_props: {
  crumbs?: { label: string; href?: string }[];
  onToggleContext?: () => void;
}) {
  return (
    <header className="relative z-40 flex shrink-0 items-center gap-2 px-5 pt-5 md:pt-7">
      {/* Spacer balances the bell so the pill stays truly centered. */}
      <span aria-hidden className="w-8 shrink-0" />
      <button
        type="button"
        onClick={() => openCommandPalette()}
        aria-label="Search creators, blocks, services, skills, genres"
        className="lg-nav group mx-auto flex w-full max-w-[620px] flex-1 items-center gap-3 rounded-full px-5 py-[11px] text-left transition-colors hover:bg-white/[0.13]"
        style={{
          boxShadow:
            "0 8px 24px rgba(0,0,0,0.4), 0 0 42px rgba(59,102,246,0.16)",
        }}
      >
        <Search
          size={15}
          strokeWidth={1.9}
          className="shrink-0 text-white/60 transition-colors group-hover:text-white"
        />
        <span className="min-w-0 flex-1 truncate text-[13px] text-white/60 transition-colors group-hover:text-white/80">
          Search creators, blocks, services, skills, genres…
        </span>
        <Kbd>⌘K</Kbd>
      </button>
      <div className="flex w-8 shrink-0 justify-end">
        <NotificationsMenu />
      </div>
    </header>
  );
}
