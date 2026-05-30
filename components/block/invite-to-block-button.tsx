"use client";

import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { openInvite } from "@/lib/ui-events";

// Marketplace creator-card action. Opens the invite dialog prefilled with this
// creator's handle, targeting the viewer's primary Collaboration Block.
export function InviteToBlockButton({
  handle,
  targetBlockSlug,
  className,
}: {
  handle: string;
  targetBlockSlug?: string;
  className?: string;
}) {
  const canInvite = Boolean(targetBlockSlug);
  return (
    <Button
      variant="primary"
      size="sm"
      className={className}
      disabled={!canInvite}
      onClick={() => targetBlockSlug && openInvite(targetBlockSlug, handle)}
      title={canInvite ? undefined : "Create a Collaboration Block first"}
    >
      <UserPlus size={12} /> Invite to Block
    </Button>
  );
}
