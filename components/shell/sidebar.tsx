"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleDot,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Store,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Block, Person, Workspace } from "@/lib/mock";
import { Avatar, Badge, Kbd, SectionLabel } from "@/components/ui/primitives";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { openCommandPalette } from "@/lib/ui-events";
import { FEATURES } from "@/lib/flags";

type Props = {
  profile: Person;
  workspaces: Workspace[];
  blocks: Block[];
};

export function Sidebar({ profile, workspaces, blocks }: Props) {
  const path = usePathname();
  const profileHref = `/profile/${profile.handle}`;

  // Core journey nav. My Profile sits under Home. Community / global Messages /
  // global Media are gated by feature flags (kept in code, hidden from nav).
  const primary = [
    { href: "/home", label: "Home", icon: Home },
    { href: profileHref, label: "My Profile", icon: User },
    { href: "/marketplace", label: "Marketplace", icon: Store },
    { href: "/blocks", label: "Blocks", icon: LayoutGrid },
    ...(FEATURES.globalMessages
      ? [{ href: "/messages", label: "Messages", icon: MessageSquare, badge: 4 }]
      : []),
    ...(FEATURES.globalMedia
      ? [{ href: "/media", label: "Media", icon: ImageIcon }]
      : []),
    ...(FEATURES.community
      ? [{ href: "/community", label: "Community", icon: Users }]
      : []),
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[252px] shrink-0 border-r border-line bg-bg/40 backdrop-blur-sm">
      {/* Workspace switcher */}
      <WorkspaceSwitcher workspaces={workspaces} />

      {/* Quick search */}
      <button
        onClick={() => openCommandPalette()}
        className="mx-3 mt-2 flex items-center gap-2 px-2.5 h-8 rounded-lg bg-surface-2 border border-line text-muted hover:border-line-strong hover:text-ink transition-all duration-200 group"
      >
        <Search size={12.5} strokeWidth={1.75} />
        <span className="text-[12px] flex-1 text-left">Search or jump</span>
        <Kbd>⌘K</Kbd>
      </button>

      {/* Primary nav */}
      <nav className="px-2 mt-5 space-y-px">
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
                "flex items-center gap-2.5 px-2.5 h-8 rounded-lg text-[12.5px] transition-colors duration-200",
                active
                  ? "bg-surface-2 text-ink font-medium"
                  : "text-muted hover:text-ink hover:bg-surface-2/60"
              )}
            >
              <Icon
                size={14}
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
      <div className="mt-6 px-2">
        <div className="flex items-center justify-between px-2 pb-1.5">
          <SectionLabel>Pinned</SectionLabel>
          <button
            className="text-muted hover:text-ink p-0.5 rounded transition-colors"
            aria-label="Add pinned"
          >
            <Plus size={11} />
          </button>
        </div>
        <ul className="space-y-px">
          {blocks.map((b) => {
            const active = path?.includes(`/blocks/${b.slug}`);
            return (
              <li key={b.id}>
                <Link
                  href={`/blocks/${b.slug}`}
                  className={cn(
                    "flex items-center gap-2 px-2 h-7 rounded-md text-[12px] transition-colors duration-200",
                    active
                      ? "bg-surface-2 text-ink font-medium"
                      : "text-muted hover:text-ink hover:bg-surface-2/60"
                  )}
                >
                  <CircleDot
                    size={9}
                    className={
                      b.status === "Producing"
                        ? "text-accent"
                        : b.status === "In Review"
                        ? "text-warning"
                        : b.status === "Shipped"
                        ? "text-success"
                        : "text-muted"
                    }
                  />
                  <span className="truncate flex-1">{b.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Spaces */}
      <div className="mt-6 px-2">
        <SectionLabel className="px-2 pb-1.5 block">Spaces</SectionLabel>
        <ul className="space-y-px">
          {["Writers' Room", "Post · Picture", "Cast & Talent", "Marketing"].map(
            (s) => (
              <li key={s}>
                <button className="w-full flex items-center gap-2 px-2 h-7 rounded-md text-[12px] text-muted hover:text-ink hover:bg-surface-2/60 transition-colors">
                  <span className="h-1 w-1 rounded-full bg-line-strong" />
                  <span className="truncate flex-1 text-left">{s}</span>
                </button>
              </li>
            )
          )}
        </ul>
      </div>

      <div className="flex-1" />

      {/* User footer */}
      <div className="m-3 p-2 rounded-xl border border-line bg-surface-2 flex items-center gap-2.5 group">
        <Link
          href={profileHref}
          title="View my profile"
          className="flex items-center gap-2.5 flex-1 min-w-0 rounded-lg -m-0.5 p-0.5 hover:opacity-90 transition-opacity"
        >
          <Avatar src={profile.avatar} name={profile.name} size={28} online />
          <span className="flex-1 min-w-0">
            <span className="block text-[12px] font-medium leading-tight truncate">
              {profile.name}
            </span>
            <span className="block text-[10.5px] text-muted leading-tight truncate mt-0.5">
              {profile.role} · @{profile.handle}
            </span>
          </span>
        </Link>
        <Link
          href="/settings"
          className="p-1.5 rounded hover:bg-surface-3 text-muted hover:text-ink transition-colors"
          aria-label="Settings"
          title="Settings"
        >
          <Settings size={13} />
        </Link>
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="p-1.5 rounded hover:bg-surface-3 text-muted hover:text-ink transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        </form>
      </div>
    </aside>
  );
}
