"use client";

import { useEffect, useRef, useState } from "react";
import {
  AtSign,
  Bell,
  Check,
  GitBranch,
  MessageSquare,
  Upload,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/primitives";

type Notif = {
  id: string;
  icon: LucideIcon;
  tone: string;
  title: string;
  body: string;
  at: string;
  unread: boolean;
  href?: string;
};

const SEED: Notif[] = [
  {
    id: "n1",
    icon: AtSign,
    tone: "text-accent bg-accent/10 border-accent/30",
    title: "Sasha mentioned you",
    body: "“@aria can you sign off before EOD?” in Ep.2 picture-lock",
    at: "8m",
    unread: true,
    href: "/blocks/midnight-press?tab=files",
  },
  {
    id: "n2",
    icon: Upload,
    tone: "text-success bg-success/10 border-success/30",
    title: "Theo uploaded a file",
    body: "newsroom-theme-v4.wav · Midnight Press",
    at: "38m",
    unread: true,
    href: "/blocks/midnight-press?tab=files",
  },
  {
    id: "n3",
    icon: GitBranch,
    tone: "text-warning bg-warning/10 border-warning/30",
    title: "Jude moved a task",
    body: "Ep.2 picture lock → Review",
    at: "1h",
    unread: true,
    href: "/blocks/midnight-press?tab=tasks",
  },
  {
    id: "n4",
    icon: MessageSquare,
    tone: "text-accent bg-accent/10 border-accent/30",
    title: "New messages in #writers-room",
    body: "3 unread from Milo and Aria",
    at: "2h",
    unread: true,
    href: "/blocks/midnight-press?tab=messages",
  },
  {
    id: "n5",
    icon: UserPlus,
    tone: "text-accent-2 bg-accent-2/10 border-accent-2/30",
    title: "Imani joined Midnight Press",
    body: "as Talent",
    at: "Yesterday",
    unread: false,
    href: "/blocks/midnight-press",
  },
];

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(SEED);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((i) => i.unread).length;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function markAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, unread: false })));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-ink hover:bg-surface-2 border border-transparent transition-colors"
        aria-label="Notifications"
      >
        <span className="relative">
          <Bell size={14} strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-accent animate-slow-pulse" />
          )}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-[360px] rounded-2xl border border-line-strong bg-surface shadow-pop overflow-hidden z-50 animate-fade-up">
          <div className="flex items-center justify-between px-4 h-11 border-b border-line">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-ink">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono text-accent">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink transition-colors"
            >
              <Check size={11} /> Mark all read
            </button>
          </div>

          <ul className="max-h-[400px] overflow-y-auto">
            {items.map((n) => {
              const Icon = n.icon;
              return (
                <li key={n.id}>
                  <a
                    href={n.href}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-surface-2 border-b border-line/60 last:border-0",
                      n.unread && "bg-accent/[0.04]"
                    )}
                  >
                    <span
                      className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 mt-0.5",
                        n.tone
                      )}
                    >
                      <Icon size={12} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12.5px] font-medium text-ink leading-snug">
                          {n.title}
                        </p>
                        <span className="text-[10px] text-muted font-mono shrink-0 mt-0.5">
                          {n.at}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-muted leading-snug mt-0.5">
                        {n.body}
                      </p>
                    </div>
                    {n.unread && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="p-2 border-t border-line">
            <Button variant="ghost" size="md" className="w-full">
              View all activity
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
