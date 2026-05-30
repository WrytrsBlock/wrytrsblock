"use client";

import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { openInvite } from "@/lib/ui-events";

export function InviteButton({
  blockSlug,
  className,
  label = "Invite collaborator",
}: {
  blockSlug: string;
  className?: string;
  label?: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => openInvite(blockSlug)}
    >
      <UserPlus size={12} /> {label}
    </Button>
  );
}
