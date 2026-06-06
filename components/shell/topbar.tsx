"use client";

import Link from "next/link";
import { ChevronRight, MessageSquare, Search } from "lucide-react";
import { Avatar, Kbd } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationsMenu } from "./notifications-menu";
import { useCurrentProfile } from "./profile-context";
import { openCommandPalette } from "@/lib/ui-events";

export function TopBar({
  crumbs,
  onToggleContext,
}: {
  crumbs: { label: string; href?: string }[];
  onToggleContext?: () => void;
}) {
  const me = useCurrentProfile();
  return (
    <header className="h-12 shrink-0 glass-strong border-b border-line flex items-center gap-2 px-4 md:px-5 z-30">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-[12px] min-w-0">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1 min-w-0">
            <span
              className={
                i === crumbs.length - 1
                  ? "text-ink font-medium truncate"
                  : "text-muted hover:text-ink cursor-pointer truncate transition-colors"
              }
            >
              {c.label}
            </span>
            {i < crumbs.length - 1 && (
              <ChevronRight
                size={11}
                className="text-muted/60 shrink-0"
                strokeWidth={2}
              />
            )}
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Global search */}
      <button
        onClick={() => openCommandPalette()}
        className="hidden md:flex items-center gap-2 h-7 px-2.5 rounded-md bg-surface-2 border border-line text-muted hover:text-ink hover:border-line-strong transition-all duration-200"
      >
        <Search size={12} strokeWidth={1.75} />
        <span className="text-[11.5px]">Search creators…</span>
        <Kbd>⌘K</Kbd>
      </button>

      {/* Secondary: Messages (always reachable) */}
      <Link
        href="/messages"
        aria-label="Messages"
        title="Messages"
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-ink hover:bg-surface-2 transition-colors"
      >
        <MessageSquare size={15} strokeWidth={1.75} />
      </Link>

      <NotificationsMenu />

      <ThemeToggle />

      {/* My Profile — one click from anywhere */}
      {me && (
        <Link
          href="/profile"
          title="My Profile"
          aria-label="My Profile"
          className="ml-1 rounded-full hover:ring-2 hover:ring-accent/40 transition-shadow"
        >
          <Avatar src={me.avatar} name={me.name} size={26} online />
        </Link>
      )}
    </header>
  );
}
