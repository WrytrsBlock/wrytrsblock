"use client";

import { useMemo } from "react";
import { AvatarStack } from "@/components/ui/primitives";
import { usePresence, type PresenceUser } from "@/hooks/use-presence";
import { useUser } from "@/hooks/use-user";
import { supabaseConfigured } from "@/lib/env";

const avatarFor = (id: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${id}&backgroundColor=transparent`;

// Who else is currently on the Songwriter tab, right now — an ephemeral
// presence indicator (spec: "Presence indicators"), never persisted.
export function PresenceRow({ docId }: { docId: string }) {
  const { user } = useUser();

  const me: PresenceUser | null = useMemo(() => {
    if (!supabaseConfigured || !user) return null;
    return {
      user_id: user.id,
      display_name:
        (user.user_metadata?.display_name as string) ?? user.email?.split("@")[0],
      avatar_url: user.user_metadata?.avatar_url as string | undefined,
      activity: "writing lyrics",
    };
  }, [user]);

  const live = usePresence(`presence:songwriter:${docId}`, me);
  if (!supabaseConfigured || live.length === 0) return null;

  const map = new Map(live.map((p) => [p.user_id, p]));
  return (
    <div className="flex items-center gap-2">
      <AvatarStack
        ids={live.map((p) => p.user_id)}
        size={22}
        resolve={(id) => {
          const p = map.get(id);
          if (!p) return undefined;
          return { name: p.display_name ?? "Member", avatar: p.avatar_url ?? avatarFor(id) };
        }}
      />
      <span className="text-[10.5px] text-muted font-mono">
        {live.length} here now
      </span>
    </div>
  );
}
