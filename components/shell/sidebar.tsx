"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CircleDot,
  House,
  LayoutGrid,
  MessageSquare,
  Plus,
  Settings,
  Store,
  User,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Block, Person } from "@/lib/mock";
import { Wordmark } from "@/components/marketing/wordmark";
import { UserMenu } from "@/components/shell/user-menu";
import { openNewBlock } from "@/lib/ui-events";

type Props = {
  profile: Person;
  blocks: Block[];
  unreadMessages?: number;
};

export function Sidebar({ profile, blocks, unreadMessages = 0 }: Props) {
  const path = usePathname();
  // Decided server-side: completed profile → /profile/[handle]; else onboarding.
  const profileHref = "/profile";

  const isActive = (href: string) =>
    path === href || (href !== "/" && path?.startsWith(href));

  // Primary destinations.
  const primary = [
    { href: "/home", label: "Home", icon: House },
    { href: "/marketplace", label: "Block Market", icon: Store },
    { href: "/blocks", label: "My Blocks", icon: LayoutGrid },
    { href: profileHref, label: "Profile", icon: User },
  ];

  // Secondary actions.
  const secondary = [
    {
      href: "/messages",
      label: "Messages",
      icon: MessageSquare,
      badge: unreadMessages,
    },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[264px] shrink-0 relative isolate overflow-hidden border-r border-white/[0.07] bg-surface/45 backdrop-blur-2xl shadow-[inset_-1px_0_0_rgb(255_255_255/0.04)]">
      {/* Ghosted glass "W" — a huge, faint, cropped watermark embedded into the
          sidebar around the lower-middle. Sits behind all nav content (-z-10
          inside an isolated, clipped stacking context) and never intercepts
          clicks. Lives inside the lg-only <aside>, so it hides with the sidebar
          on mobile. */}
      <img
        src="/brand/wrytrsblock-symbol.svg"
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute left-[44%] top-[63%] -z-10 w-[616px] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.11] blur-[1.5px] dark:invert"
      />

      {/* Brand */}
      <div className="px-4 pt-4 pb-2">
        <Wordmark href="/home" variant="horizontal" />
      </div>

      {/* Start a Block — the hero action */}
      <button
        onClick={() => openNewBlock()}
        // Force the label + icon pure white (#FFFFFF) in every state. The base
        // `text-bg` resolved to black on the blue gradient; inline color wins
        // over any cascade and the icon inherits it via currentColor.
        className="mx-3 mt-3 inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-grad-accent text-[#FFFFFF] [&_svg]:text-[#FFFFFF] text-[13px] font-semibold shadow-glow hover:opacity-95 transition-opacity"
        style={{ color: "#FFFFFF" }}
      >
        <Plus size={15} strokeWidth={2.5} /> Start a Block
      </button>

      {/* Primary nav — search lives in the centered glass pill, not here */}
      <nav className="px-3 mt-5 space-y-1">
        {primary.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 h-11 rounded-xl text-[13.5px] transition-colors duration-200",
                active
                  ? "bg-surface-2 text-ink font-semibold"
                  : "text-muted hover:text-ink hover:bg-surface-2/60"
              )}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.2 : 1.75}
                className={active ? "text-accent" : ""}
              />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Pinned Blocks */}
      {blocks.length > 0 && (
        <div className="mt-6 px-3">
          <div className="px-1 pb-2 text-[10px] uppercase tracking-[0.18em] font-medium text-muted/70">
            Your Blocks
          </div>
          <ul className="space-y-0.5">
            {blocks.slice(0, 4).map((b) => {
              const active = path?.includes(`/blocks/${b.slug}`);
              return (
                <li key={b.id}>
                  <Link
                    href={`/blocks/${b.slug}`}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 h-8 rounded-md text-[12.5px] transition-colors duration-200",
                      active
                        ? "bg-surface-2 text-ink font-medium"
                        : "text-muted hover:text-ink hover:bg-surface-2/60"
                    )}
                  >
                    <CircleDot
                      size={10}
                      className={
                        b.blockType === "service"
                          ? "text-accent-2"
                          : "text-accent"
                      }
                    />
                    <span className="truncate flex-1">{b.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex-1" />

      {/* Secondary actions */}
      <nav className="px-3 pb-2 space-y-0.5">
        {secondary.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 h-9 rounded-lg text-[12.5px] transition-colors duration-200",
                active
                  ? "bg-surface-2 text-ink font-medium"
                  : "text-muted hover:text-ink hover:bg-surface-2/60"
              )}
            >
              <Icon size={15} strokeWidth={1.75} />
              <span className="flex-1">{item.label}</span>
              {"badge" in item && (item.badge ?? 0) > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-semibold tabular-nums">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User menu — account, legal, support, log out */}
      <UserMenu
        name={profile.name}
        handle={profile.handle}
        avatar={profile.avatar}
        profileHref={profileHref}
      />
    </aside>
  );
}
