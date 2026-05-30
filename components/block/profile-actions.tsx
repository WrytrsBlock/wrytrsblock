"use client";

import Link from "next/link";
import { MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { openInvite } from "@/lib/ui-events";

// Actions on a creator profile. "Invite to a Block" opens the global invite
// dialog prefilled with this creator's handle, targeting the viewer's primary
// collaboration Block. "Message" routes into that Block's conversation.
export function ProfileActions({
  handle,
  targetBlockSlug,
  layout = "row",
}: {
  handle: string;
  targetBlockSlug?: string;
  layout?: "row" | "stack";
}) {
  const canInvite = Boolean(targetBlockSlug);
  const wrap =
    layout === "stack" ? "flex flex-col gap-2" : "flex items-center gap-2";

  return (
    <div className={wrap}>
      <Button
        variant="primary"
        size="lg"
        onClick={() => targetBlockSlug && openInvite(targetBlockSlug, handle)}
        disabled={!canInvite}
        title={canInvite ? undefined : "Create a Collaboration Block first"}
      >
        <UserPlus size={14} /> Invite to a Block
      </Button>
      {canInvite ? (
        <Link href={`/blocks/${targetBlockSlug}?tab=messages`}>
          <Button variant="outline" size="md" className="w-full">
            <MessageCircle size={13} /> Message
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="md" disabled>
          <MessageCircle size={13} /> Message
        </Button>
      )}
    </div>
  );
}
