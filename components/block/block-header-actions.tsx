"use client";

import Link from "next/link";
import { Eye, Inbox, MessageSquare, Pencil, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { openEditService, openInvite } from "@/lib/ui-events";
import type { BlockType } from "@/lib/mock";

// Primary actions, always shown top-right of the Block header.
//   Collaboration → Invite Collaborator (primary) + Message Team
//   Service       → View Service · Edit Service · Manage Requests
export function BlockHeaderActions({
  slug,
  blockType,
}: {
  slug: string;
  blockType: BlockType;
}) {
  if (blockType === "service") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Link href={`/blocks/${slug}`}>
          <Button variant="outline" size="md">
            <Eye size={13} /> View Service
          </Button>
        </Link>
        <Button variant="outline" size="md" onClick={() => openEditService()}>
          <Pencil size={13} /> Edit Service
        </Button>
        <Link href={`/blocks/${slug}?tab=requests`}>
          <Button variant="primary" size="md">
            <Inbox size={13} /> Manage Requests
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Link href={`/blocks/${slug}?tab=messages`}>
        <Button variant="outline" size="md">
          <MessageSquare size={13} /> Message Team
        </Button>
      </Link>
      <Button variant="primary" size="md" onClick={() => openInvite(slug)}>
        <UserPlus size={13} /> Invite Collaborator
      </Button>
    </div>
  );
}
