"use client";

import { useMemo } from "react";
import { MessageCircle } from "lucide-react";
import { Avatar, SectionLabel } from "@/components/ui/primitives";
import { usePresence, type PresenceUser } from "@/hooks/use-presence";
import { useUser } from "@/hooks/use-user";
import { supabaseConfigured } from "@/lib/env";

export type SeedPresence = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  activity: string;
};

// Renders the "Now Active" roster. When Supabase + an authed user are present,
// it joins a Block-scoped presence channel and shows the live roster. Without
// them (local/preview), it renders the seeded mock roster so the panel never
// looks empty.
export function LivePresence({
  blockId,
  seed,
}: {
  blockId: string;
  seed: SeedPresence[];
}) {
  const { user } = useUser();

  // Memoized so the presence channel only re-subscribes when identity changes,
  // not on every render.
  const me: PresenceUser | null = useMemo(() => {
    if (!supabaseConfigured || !user) return null;
    return {
      user_id: user.id,
      display_name:
        (user.user_metadata?.display_name as string) ??
        user.email?.split("@")[0],
      avatar_url: user.user_metadata?.avatar_url as string | undefined,
      activity: "viewing this Block",
    };
  }, [user]);

  const live = usePresence(`presence:block:${blockId}`, me);

  const useLive = supabaseConfigured && me && live.length > 0;

  const roster = useLive
    ? live.map((m) => ({
        id: m.user_id,
        name: m.display_name ?? "Member",
        avatar:
          m.avatar_url ??
          `https://api.dicebear.com/9.x/notionists/svg?seed=${m.user_id}&backgroundColor=transparent`,
        role: "",
        activity: m.activity ?? "online",
      }))
    : seed;

  return (
    <div className="px-5 pt-5">
      <div className="flex items-center justify-between">
        <SectionLabel>Now Active</SectionLabel>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-muted font-mono">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success/60 animate-pulse-ring" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
          </span>
          {useLive ? `${roster.length} LIVE` : "LIVE"}
        </span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {roster.map((p) => (
          <li key={p.id} className="flex items-center gap-2.5 group">
            <Avatar src={p.avatar} name={p.name} size={26} online />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-ink leading-tight truncate font-medium">
                {p.name}
              </p>
              <p className="text-[10.5px] text-muted leading-tight truncate mt-0.5">
                {p.activity}
              </p>
            </div>
            <button
              className="p-1 rounded-md hover:bg-surface-2 text-muted hover:text-ink opacity-0 group-hover:opacity-100 transition-all"
              title="DM"
            >
              <MessageCircle size={12} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
