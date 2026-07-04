"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AtSign,
  AudioLines,
  Bell,
  BellOff,
  Check,
  GitBranch,
  MessageSquare,
  PieChart,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Avatar, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { getPerson } from "@/lib/mock";
import type { NotificationView } from "@/lib/data";
import { addDismissed, addRead, getDismissed, getRead } from "@/lib/notifications-local";

type Item = {
  id: string;
  icon: LucideIcon;
  tone: string;
  actorId?: string;
  title: string;
  body: string | null;
  at: string;
  unread: boolean;
  href: string;
};

// kind → icon + tone for real notifications written by the request RPCs.
const KIND: Record<string, { icon: LucideIcon; tone: string }> = {
  block_request: { icon: UserPlus, tone: "text-accent bg-accent/10 border-accent/30" },
  block_accepted: { icon: Check, tone: "text-success bg-success/10 border-success/30" },
  block_declined: { icon: X, tone: "text-danger bg-danger/10 border-danger/30" },
  block_deleted: { icon: Trash2, tone: "text-danger bg-danger/10 border-danger/30" },
  mention: { icon: AtSign, tone: "text-accent bg-accent/10 border-accent/30" },
  message: { icon: MessageSquare, tone: "text-accent bg-accent/10 border-accent/30" },
  upload: { icon: Upload, tone: "text-success bg-success/10 border-success/30" },
  voice_note: { icon: AudioLines, tone: "text-accent bg-accent/10 border-accent/30" },
  block_member_joined: { icon: Users, tone: "text-success bg-success/10 border-success/30" },
  split_sheet_updated: { icon: PieChart, tone: "text-warning bg-warning/10 border-warning/30" },
};
const DEFAULT_KIND = { icon: Bell, tone: "text-muted bg-white/[0.06] border-white/15" };

// Illustrative demo data when Supabase isn't configured.
const SEED: Item[] = [
  { id: "n1", icon: AtSign, tone: KIND.mention.tone, actorId: "p3", title: "Sasha Reyes mentioned you", body: "“@aria can you sign off before EOD?”", at: "8m", unread: true, href: "/blocks/midnight-press?tab=files" },
  { id: "n2", icon: Upload, tone: KIND.upload.tone, actorId: "p6", title: "Theo Lin uploaded a file", body: "newsroom-theme-v4.wav · Midnight Press", at: "38m", unread: true, href: "/blocks/midnight-press?tab=files" },
  { id: "n4", icon: MessageSquare, tone: KIND.message.tone, actorId: "p2", title: "New messages in Midnight Press", body: "3 unread from Milo and Aria", at: "2h", unread: true, href: "/blocks/midnight-press?tab=messages" },
  { id: "n5", icon: UserPlus, tone: KIND.block_request.tone, actorId: "p7", title: "Imani Ross joined Midnight Press", body: "as Talent", at: "Yesterday", unread: false, href: "/blocks/midnight-press?tab=team" },
];

function toItems(real: NotificationView[]): Item[] {
  return real.map((n) => {
    const k = KIND[n.kind] ?? DEFAULT_KIND;
    return {
      id: n.id,
      icon: k.icon,
      tone: k.tone,
      title: n.title,
      body: n.body,
      at: n.at,
      unread: n.unread,
      href: n.link || "/notifications",
    };
  });
}

export function NotificationsList({
  initial,
  demo,
}: {
  initial: NotificationView[];
  demo: boolean;
}) {
  const base = demo ? SEED : toItems(initial);
  const [items, setItems] = useState<Item[]>(base);

  // Re-apply persisted "cleared" / "read" state on mount.
  useEffect(() => {
    const dismissed = getDismissed();
    const read = getRead();
    setItems(
      base
        .filter((n) => !dismissed.has(n.id))
        .map((n) => (read.has(n.id) ? { ...n, unread: false } : n))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unread = items.filter((n) => n.unread).length;

  function markAllRead() {
    addRead(items.map((n) => n.id));
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  }
  function clearAll() {
    addDismissed(items.map((n) => n.id));
    setItems([]);
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        {unread > 0 ? (
          <span className="lg-pill lg-pill-b">{unread} new</span>
        ) : (
          <span className="text-[12px] text-white/45">You&apos;re all caught up</span>
        )}
        <span className="flex-1" />
        {items.length > 0 && (
          <>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/60 transition-colors hover:text-white"
              >
                <Check size={13} /> Mark all read
              </button>
            )}
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-[12px] font-medium text-white/70 transition-colors hover:border-danger/40 hover:bg-danger/15 hover:text-white"
            >
              <Trash2 size={13} /> Clear all
            </button>
          </>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="flex flex-col items-center gap-2.5 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/40">
            <BellOff size={22} />
          </span>
          <p className="text-[13.5px] font-medium text-white">No notifications</p>
          <p className="text-[12px] text-white/50">
            You&apos;re all caught up — new activity will show up here.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-white/[0.08]">
            {items.map((n) => {
              const actor = n.actorId ? getPerson(n.actorId) : null;
              const Icon = n.icon;
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    className={cn(
                      "flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-white/[0.06]",
                      n.unread && "bg-white/[0.03]"
                    )}
                  >
                    <span className="relative shrink-0">
                      {actor ? (
                        <Avatar src={actor.avatar} name={actor.name} size={38} />
                      ) : (
                        <span
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl border",
                            n.tone
                          )}
                        >
                          <Icon size={15} strokeWidth={2} />
                        </span>
                      )}
                      {actor && (
                        <span
                          className={cn(
                            "absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-[#15161c] border",
                            n.tone
                          )}
                        >
                          <Icon size={10} strokeWidth={2.25} />
                        </span>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] font-medium text-ink">{n.title}</p>
                        <span className="text-[10.5px] text-muted font-mono shrink-0">
                          {n.at}
                        </span>
                      </div>
                      {n.body && (
                        <p className="text-[12px] text-muted leading-snug mt-0.5">
                          {n.body}
                        </p>
                      )}
                    </div>
                    {n.unread && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-2" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
