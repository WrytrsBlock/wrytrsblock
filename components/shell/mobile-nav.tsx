"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Menu,
  MessageSquare,
  Store,
  User,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Block, Person, Workspace } from "@/lib/mock";
import { Avatar, Badge } from "@/components/ui/primitives";
import { FEATURES } from "@/lib/flags";

export function MobileNav({
  profile,
  workspace,
  blocks,
}: {
  profile: Person;
  workspace: Workspace;
  blocks: Block[];
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const profileHref = `/profile/${profile.handle}`;

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

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <>
      {/* Trigger — fixed in the topbar's reserved left gutter on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-2 left-3 z-40 inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={16} />
      </button>

      {!open ? null : (
        <div className="lg:hidden fixed inset-0 z-[55]">
          <div
            className="absolute inset-0 bg-bg/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-surface border-r border-line shadow-pop flex flex-col animate-fade-up">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "h-7 w-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-bg text-[11px] font-semibold",
                    workspace.hue
                  )}
                >
                  {workspace.initials}
                </span>
                <span className="text-[13px] font-semibold">
                  {workspace.name}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2"
                aria-label="Close menu"
              >
                <X size={15} />
              </button>
            </div>

            <nav className="px-2 mt-2 space-y-px">
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
                      "flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-[13px] transition-colors",
                      active
                        ? "bg-surface-2 text-ink font-medium"
                        : "text-muted hover:text-ink hover:bg-surface-2/60"
                    )}
                  >
                    <Icon size={15} strokeWidth={active ? 2 : 1.75} />
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

            <div className="px-2 mt-5">
              <div className="px-2 pb-1.5 text-[10px] uppercase tracking-[0.16em] font-medium text-muted/70">
                Pinned
              </div>
              <ul className="space-y-px">
                {blocks.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/blocks/${b.slug}`}
                      className="flex items-center gap-2 px-2.5 h-8 rounded-md text-[12.5px] text-muted hover:text-ink hover:bg-surface-2/60 transition-colors"
                    >
                      <span className="truncate">{b.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1" />

            <div className="m-3 p-2 rounded-xl border border-line bg-surface-2 flex items-center gap-2.5">
              <Link
                href={profileHref}
                className="flex items-center gap-2.5 flex-1 min-w-0"
              >
                <Avatar src={profile.avatar} name={profile.name} size={28} online />
                <span className="flex-1 min-w-0">
                  <span className="block text-[12px] font-medium truncate">
                    {profile.name}
                  </span>
                  <span className="block text-[10.5px] text-muted truncate">
                    {profile.role}
                  </span>
                </span>
              </Link>
              <form action="/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="text-[11px] text-muted hover:text-ink px-2 py-1 rounded"
                >
                  Sign out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
