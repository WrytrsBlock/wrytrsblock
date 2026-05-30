"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "./use-supabase";

export type PresenceUser = {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  activity?: string;
};

// Presence channel per Block. Each member joins with a payload describing
// what they're currently doing, and receives the live roster.
export function usePresence(channelKey: string, me: PresenceUser | null) {
  const supabase = useSupabase();
  const [members, setMembers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!supabase || !me) return;
    const channel = supabase.channel(channelKey, {
      config: { presence: { key: me.user_id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, PresenceUser[]>;
        const list: PresenceUser[] = [];
        Object.values(state).forEach((arr) => list.push(...arr));
        setMembers(list);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(me);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, channelKey, me]);

  return members;
}
