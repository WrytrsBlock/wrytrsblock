"use client";

import { useEffect, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useSupabase } from "./use-supabase";

type Handler<T extends Record<string, unknown>> = (
  payload: RealtimePostgresChangesPayload<T>
) => void;

type ChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

// Subscribe to Postgres changes on a single table, optionally filtered.
//
// The handler is held in a ref so callers don't need to memoize it to avoid
// re-subscribing — the channel is recreated only when table/filter/event change.
//
// Example:
//   useRealtimeTable<Message>(
//     "messages",
//     (payload) => setRows((r) => [...r, payload.new]),
//     `channel_id=eq.${channelId}`,
//     "INSERT"
//   );
export function useRealtimeTable<T extends Record<string, unknown>>(
  table: string,
  handler: Handler<T>,
  filter?: string,
  event: ChangeEvent = "*",
  enabled: boolean = true
) {
  const supabase = useSupabase();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!supabase || !enabled) return;
    const channel = supabase.channel(`realtime:${table}:${filter ?? "all"}`);

    // supabase-js overloads for "postgres_changes" don't narrow a union
    // `event` cleanly (TS falls back to the "system" overload). Cast the
    // method to the precise signature we use to keep the call type-safe.
    // NB: bind to `channel` — extracting the method into a variable detaches
    // `this`, and RealtimeChannel.on reads `this._on`, so an unbound call throws
    // "Cannot read properties of undefined (reading '_on')".
    const onPostgres = channel.on.bind(channel) as unknown as (
      type: "postgres_changes",
      filter: {
        event: ChangeEvent;
        schema: string;
        table: string;
        filter?: string;
      },
      cb: (payload: RealtimePostgresChangesPayload<T>) => void
    ) => typeof channel;

    onPostgres(
      "postgres_changes",
      { event, schema: "public", table, filter },
      (payload) => handlerRef.current(payload)
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, table, filter, event, enabled]);
}
