"use client";

import { useUser } from "@/hooks/use-user";
import { useBlockViewerHeartbeat } from "@/hooks/use-block-viewer-heartbeat";
import { supabaseConfigured } from "@/lib/env";

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

// Renders nothing — just keeps this Block's block_viewers row alive for as
// long as the Block page is open, regardless of which tab is active, so
// Server Actions can tell "is this member actively viewing right now" when
// deciding whether to send an activity-notification email.
export function BlockViewerHeartbeat({ blockId }: { blockId: string }) {
  const { user } = useUser();
  useBlockViewerHeartbeat(
    supabaseConfigured && isUuid(blockId) ? blockId : null,
    user?.id ?? null
  );
  return null;
}
