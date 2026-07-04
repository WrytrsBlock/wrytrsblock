"use client";

import { useEffect } from "react";
import { useSupabase } from "./use-supabase";

const HEARTBEAT_MS = 20_000;

// Mirrors "I'm currently looking at this Block" into block_viewers so Server
// Actions — which can't read the ephemeral Realtime presence channel
// (hooks/use-presence.ts) — can tell whether to skip an activity-notification
// email for someone already viewing it in-app. See
// supabase/migrations/0027_block_viewers.sql. Best-effort throughout: a failed
// heartbeat just means the recipient gets an email they didn't strictly need.
export function useBlockViewerHeartbeat(blockId: string | null, userId: string | null) {
  const supabase = useSupabase();

  useEffect(() => {
    if (!supabase || !blockId || !userId) return;
    const sb = supabase; // narrow once for the closures below
    let cancelled = false;

    function beat() {
      if (cancelled) return;
      sb
        .from("block_viewers")
        .upsert(
          { block_id: blockId, user_id: userId, last_seen_at: new Date().toISOString() },
          { onConflict: "block_id,user_id" }
        )
        .then(
          () => {},
          () => {}
        );
    }

    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      sb
        .from("block_viewers")
        .delete()
        .eq("block_id", blockId)
        .eq("user_id", userId)
        .then(
          () => {},
          () => {}
        );
    };
  }, [supabase, blockId, userId]);
}
