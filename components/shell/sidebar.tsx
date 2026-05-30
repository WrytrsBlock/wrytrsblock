"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CircleDot,
  Home,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Store,
  User,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Block, Person, Workspace } from "@/lib/mock";
import { Avatar, Badge, Kbd, SectionLabel } from "@/components/ui/primitives";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { openCommandPalette } from "@/lib/ui-events";

type Props = {
  profile: Person;
  workspaces: Workspace[];
  blocks: Block[];
};

export function Sidebar({ profile, workspaces, blocks }: Props) {
  const path = usePathname();
  const profileHref = `/profile/${profile.handle}`;

  // Clear, always-labeled primary navigation.
  const primary = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/marketplace", label: "Marketplace", icon: Store },
    { href: "/blocks", label: "Blocks", icon: LayoutGrid },
    { href: "/messages", label: "Messages", icon: MessageSquare, badge: 4 },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: profileHref, label: "Profile", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[272px] shrink-0 border-r border-line bg-bg/40 backdrop-blur-sm">
      {/* Workspace switcher */}
      <WorkspaceSwitcher workspaces={workspaces} />

      {/* Quick search */}
      <button
        onClick={() => openCommandPalette()}
        className="mx-3 mt-2 flex items-center gap-2 px-3 h-9 rounded-lg bg-surface-2 border border-line text-muted hover:border-line-strong hover:text-ink transition-all duration-200"
      >
        <Search size={13} strokeWidth={1.75} />
        <span className="text-[12.5px] flex-1 text-left">Search or jump</span>
        <Kbd>⌘K</Kbd>
      </button>

      {/* Primary nav */}
      <nav className="px-3 mt-5 space-y-0.5">
        {primary.map((item) => {
          const Icon = item.icon;
          const active =
            path === item.href ||
            (item.href !== "/home" && path?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] transition-colors duration-200",
                active
                  ? "bg-surface-2 text-ink font-medium"
                  : "text-muted hover:text-ink hover:bg-surface-2/60"
              )}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2 : 1.75}
                className={active ? "text-ink" : ""}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <Badge tone="accent" className="!h-4 !px-1.5 !text-[10px]">
                  {item.badge}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Pinned Blocks */}
      <div className="mt-7 px-3">
        <div className="flex items-center justify-between px-1 pb-2">
          <SectionLabel>Pinned Blocks</SectionLabel>
          <button
            className="text-muted hover:text-ink p-0.5 rounded transition-colors"
            aria-label="Add pinned"
          >
            <Plus size={12} />
          </button>
        </div>
        <ul className="space-y-0.5">
          {blocks.map((b) => {
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
                      b.blockType === "service" ? "text-accent-2" : "text-accent"
                    }
                  />
                  <span className="truncate flex-1">{b.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex-1" />

      {/* User footer */}
      <div className="m-3 p-2.5 rounded-xl border border-line bg-surface-2 flex items-center gap-2.5">
        <Link
          href={profileHref}
          title="View my profile"
          className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-90 transition-opacity"
        >
          <Avatar src={profile.avatar} name={profile.name} size={30} online />
          <span className="flex-1 min-w-0">
            <span className="block text-[12.5px] font-medium leading-tight truncate">
              {profile.name}
            </span>
            <span className="block text-[10.5px] text-muted leading-tight truncate mt-0.5">
              {profile.role} · @{profile.handle}
            </span>
          </span>
        </Link>
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="p-1.5 rounded hover:bg-surface-3 text-muted hover:text-ink transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </form>
      </div>
    </aside>
  );
}
