"use client";

import { useRouter } from "next/navigation";
import { useRealtimeTable } from "@/hooks/use-realtime";
import { supabaseConfigured } from "@/lib/env";

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

// The Block header/roster (members list, avatar stack, "N creators" count) is
// rendered server-side from a snapshot fetched when the page loaded. Without
// this, a member who accepts a Block Request never shows up for someone
// already sitting on the Block page until they manually refresh. Renders
// nothing — on any block_members change for this Block, it asks Next.js to
// re-fetch the server-rendered data for the current route.
export function BlockMembershipLiveRefresh({ blockId }: { blockId: string }) {
  const router = useRouter();
  const enabled = supabaseConfigured && isUuid(blockId);

  useRealtimeTable<Record<string, unknown>>(
    "block_members",
    () => router.refresh(),
    `block_id=eq.${blockId}`,
    "*",
    enabled
  );

  return null;
}
