"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUser, House, LayoutGrid, Plus, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { openNewBlock } from "@/lib/ui-events";

// Mobile-first primary navigation — an Apple-inspired floating liquid-glass dock.
// Iconography is strictly monochrome (white / light gray); selection is conveyed
// by a rounded glass pill + brighter icon + brighter label, never by color.
// Hidden on desktop (the sidebar takes over).

const ITEM =
  "flex flex-1 flex-col items-center justify-center gap-1 py-0.5 transition-transform duration-200 active:scale-[0.92]";
const LABEL = "text-[10px] font-semibold tracking-tight transition-colors duration-200";

export function BottomTabBar({ profileHref }: { profileHref: string }) {
  const path = usePathname();

  const isActive = (href: string) =>
    path === href || (href !== "/" && path?.startsWith(href));

  const NavTab = ({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: LucideIcon;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={ITEM}
      >
        {/* Glass pill — the sole selection affordance (no colored icons) */}
        <span
          className={cn(
            "flex h-9 w-[52px] items-center justify-center rounded-2xl transition-all duration-200",
            active &&
              "bg-white/[0.13] border border-white/[0.1] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]"
          )}
        >
          <Icon
            size={22}
            strokeWidth={active ? 2.2 : 1.9}
            className={cn(
              "transition-colors duration-200",
              active ? "text-white" : "text-white/55"
            )}
          />
        </span>
        <span className={cn(LABEL, active ? "text-white" : "text-white/50")}>
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className="lg:hidden shrink-0 px-3 pt-2"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
    >
      {/* Floating liquid-glass dock */}
      <div className="mx-auto flex max-w-md items-stretch gap-0.5 rounded-[26px] glass-strong border border-white/[0.1] px-1.5 py-1.5 shadow-[0_12px_36px_-8px_rgb(0_0_0/0.7),inset_0_1px_0_rgb(255_255_255/0.08)]">
        <NavTab href="/home" label="Home" icon={House} />
        <NavTab href="/marketplace" label="Market" icon={Search} />

        {/* Create — primary action, distinguished by a circular glass affordance
            (monochrome), not color. Never shows an "active" state. */}
        <button
          type="button"
          onClick={() => openNewBlock()}
          aria-label="Create a Block"
          className={ITEM}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.1] border border-white/[0.14] shadow-[inset_0_1px_0_rgb(255_255_255/0.16)]">
            <Plus size={20} strokeWidth={2.3} className="text-white" />
          </span>
          <span className={cn(LABEL, "text-white/60")}>Create</span>
        </button>

        <NavTab href="/blocks" label="Blocks" icon={LayoutGrid} />
        <NavTab href={profileHref} label="Profile" icon={CircleUser} />
      </div>
    </nav>
  );
}
