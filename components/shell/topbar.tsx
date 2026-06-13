"use client";

import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/primitives";
import { openCommandPalette } from "@/lib/ui-events";

// The single global search experience: a centered, floating liquid-glass pill
// at the top of the content area (Apple Liquid Glass treatment). Clicking — or
// ⌘K from anywhere — opens the command palette. Navigation lives in the left
// sidebar; this component deliberately carries no nav, bell, or avatar. The
// old breadcrumb props are accepted but unused so call sites keep working.
export function TopBar(_props: {
  crumbs?: { label: string; href?: string }[];
  onToggleContext?: () => void;
}) {
  return (
    <header className="shrink-0 z-40 flex justify-center px-5 pt-5 md:pt-7">
      <button
        type="button"
        onClick={() => openCommandPalette()}
        aria-label="Search creators, blocks, services, skills, genres"
        className="lg-nav group flex w-full max-w-[620px] items-center gap-3 rounded-full px-5 py-[11px] text-left transition-colors hover:bg-white/[0.13]"
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
    </header>
  );
}
