"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { openBlockRequest } from "@/lib/ui-events";

// Actions on another creator's profile. Start Block — the only way to reach a
// creator before a Block exists — sends a Block Request; Save bookmarks them.
// (No standalone messaging: communication on WrytrsBlock is tied to a Block.)
export function CreatorActions({
  handle,
  name,
}: {
  handle: string;
  name: string;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <Button
        variant="primary"
        size="md"
        className="text-[#FFFFFF] [&_svg]:text-[#FFFFFF]"
        style={{ color: "#FFFFFF" }}
        onClick={() => openBlockRequest(handle, name)}
      >
        <Plus size={13} /> Start Block
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={saved ? "Saved" : "Save creator"}
        title={saved ? "Saved" : "Save creator"}
        onClick={() => setSaved((s) => !s)}
      >
        {saved ? (
          <BookmarkCheck size={15} className="text-accent" />
        ) : (
          <Bookmark size={15} />
        )}
      </Button>
    </div>
  );
}
