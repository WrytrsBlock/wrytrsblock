"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AtSign,
  Bell,
  BellOff,
  Check,
  GitBranch,
  MessageSquare,
  Trash2,
  Upload,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  addDismissed,
  addRead,
  getDismissed,
  getRead,
} from "@/lib/notifications-local";
import {
  getMyNotificationsAction,
  markAllNotificationsReadAction,
} from "@/app/actions/notifications";
import type { NotificationView } from "@/lib/data";

// kind → icon + tone for real notifications written by the request RPCs.
const KIND: Record<string, { icon: LucideIcon; tone: string }> = {
  block_request: { icon: UserPlus, tone: "text-accent bg-accent/10 border-accent/30" },
  block_accepted: { icon: Check, tone: "text-success bg-success/10 border-success/30" },
  block_declined: { icon: X, tone: "text-danger bg-danger/10 border-danger/30" },
  mention: { icon: AtSign, tone: "text-accent bg-accent/10 border-accent/30" },
  message: { icon: MessageSquare, tone: "text-accent bg-accent/10 border-accent/30" },
  upload: { icon: Upload, tone: "text-success bg-success/10 border-success/30" },
};

function toNotif(n: NotificationView): Notif {
  const k = KIND[n.kind] ?? { icon: Bell, tone: "text-muted bg-white/[0.06] border-white/15" };
  return {
    id: n.id,
    icon: k.icon,
    tone: k.tone,
    title: n.title,
    body: n.body ?? "",
    at: n.at,
    unread: n.unread,
    href: n.link || "/notifications",
  };
}

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
    title: "Jude updated a Block",
    body: "Ep.2 picture lock → Review",
    at: "1h",
    unread: true,
    href: "/blocks/midnight-press?tab=messages",
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

  const unreadCount = items.filter((i) => i.unread).length;

  // Load real notifications (block requests / accepts / declines / mentions),
  // then apply persisted "cleared" / "read" state so the bell stays in sync with
  // the /notifications page. Falls back to seed data in demo mode.
  useEffect(() => {
    let active = true;
    (async () => {
      let source = SEED;
      try {
        const { demo, items: real } = await getMyNotificationsAction();
        if (!demo) source = real.map(toNotif);
      } catch {
        /* keep seed */
      }
      if (!active) return;
      const dismissed = getDismissed();
      const read = getRead();
      setItems(
        source
          .filter((n) => !dismissed.has(n.id))
          .map((n) => (read.has(n.id) ? { ...n, unread: false } : n))
      );
    })();
    return () => {
      active = false;
    };
  }, []);

  // Escape closes the panel. Tap/click-outside is handled by the backdrop,
  // which (because the panel is portaled to <body>) is the only reliable
  // dismissal surface across Safari and Chrome.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function markAllRead() {
    addRead(items.map((i) => i.id));
    setItems((prev) => prev.map((i) => ({ ...i, unread: false })));
    void markAllNotificationsReadAction();
  }

  function clearAll() {
    addDismissed(items.map((i) => i.id));
    setItems([]);
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-ink hover:bg-surface-2 border border-transparent transition-colors"
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="relative">
          <Bell
            size={14}
            strokeWidth={1.75}
            className={unreadCount > 0 ? "text-[#F5B642]" : ""}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#F5B642] ring-2 ring-[#0d0f14] animate-slow-pulse" />
          )}
        </span>
      </button>

      {/* Portaled to <body> so the panel's fixed positioning is always
          viewport-relative — never trapped by the top bar's backdrop-filter
          containing block (a real iOS Safari / Chrome gotcha). */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Backdrop / click-catcher: a dim tap-to-dismiss sheet on mobile;
                an invisible full-screen catcher on desktop. */}
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-none"
            />

            {/* Panel — pinned to the viewport so it can never overflow the
                screen edges. Mobile (<768px): a full-width sheet with 12px of
                side padding (inset-x-3 → width = 100vw − 24px). Desktop: a
                compact panel anchored top-right, under the bell. */}
            <div
              role="dialog"
              aria-label="Notifications"
              className="fixed inset-x-3 top-[56px] z-[61] rounded-2xl border border-line-strong bg-surface shadow-pop overflow-hidden animate-fade-up md:inset-x-auto md:right-5 md:top-[52px] md:w-[360px]"
            >
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
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink transition-colors"
                    >
                      <Check size={11} /> Mark all read
                    </button>
                  )}
                  {items.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-danger"
                    >
                      <Trash2 size={11} /> Clear all
                    </button>
                  )}
                </div>
              </div>

              <ul className="max-h-[55vh] overflow-y-auto overscroll-contain md:max-h-[420px]">
                {items.length === 0 && (
                  <li className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-muted">
                      <BellOff size={18} />
                    </span>
                    <p className="text-[12.5px] font-medium text-ink">
                      No notifications
                    </p>
                    <p className="text-[11px] text-muted">You&apos;re all caught up.</p>
                  </li>
                )}
                {items.map((n) => {
                  const Icon = n.icon;
                  return (
                    <li key={n.id}>
                      <a
                        href={n.href}
                        onClick={() => setOpen(false)}
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
                          <p className="text-[11.5px] text-muted leading-snug mt-0.5 break-words">
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
                <a
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-full items-center justify-center rounded-lg text-[12.5px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  View all activity
                </a>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
