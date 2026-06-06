"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  LifeBuoy,
  LogOut,
  MoreHorizontal,
  Settings,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/primitives";

// The desktop user menu — opens upward from the sidebar footer with account,
// legal, support, and log-out links.
export function UserMenu({
  name,
  handle,
  avatar,
  profileHref,
}: {
  name: string;
  handle: string;
  avatar: string;
  profileHref: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative m-3 mt-1" ref={ref}>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full inset-x-0 mb-2 rounded-xl border border-line-strong bg-surface shadow-pop overflow-hidden z-50 animate-fade-up py-1"
        >
          <MenuLink href={profileHref} icon={User} label="View profile" onClose={() => setOpen(false)} />
          <MenuLink href="/settings" icon={Settings} label="Settings" onClose={() => setOpen(false)} />

          <div className="my-1 h-px bg-line" />

          <MenuLink href="/privacy" icon={Shield} label="Privacy Policy" onClose={() => setOpen(false)} />
          <MenuLink href="/terms" icon={FileText} label="Terms of Service" onClose={() => setOpen(false)} />
          <MenuLink
            href="/community-guidelines"
            icon={BookOpen}
            label="Community Guidelines"
            onClose={() => setOpen(false)}
          />
          <a
            href="mailto:support@wrytrsblock.com"
            role="menuitem"
            className="flex items-center gap-2.5 px-3 h-9 text-[12.5px] text-ink hover:bg-surface-2 transition-colors"
          >
            <LifeBuoy size={15} className="text-muted shrink-0" />
            Contact Support
          </a>

          <div className="my-1 h-px bg-line" />

          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-3 h-9 text-[12.5px] text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut size={15} className="shrink-0" /> Log out
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-full glass-card p-2.5 rounded-xl flex items-center gap-2.5 text-left hover:border-white/15 transition-colors"
      >
        <Avatar src={avatar} name={name} size={30} online />
        <span className="flex-1 min-w-0">
          <span className="block text-[12.5px] font-medium leading-tight truncate">
            {name}
          </span>
          <span className="block text-[10.5px] text-muted leading-tight truncate mt-0.5">
            @{handle}
          </span>
        </span>
        <MoreHorizontal size={16} className="text-muted shrink-0" />
      </button>
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClose,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClose}
      className="flex items-center gap-2.5 px-3 h-9 text-[12.5px] text-ink hover:bg-surface-2 transition-colors"
    >
      <Icon size={15} className="text-muted shrink-0" />
      {label}
    </Link>
  );
}
