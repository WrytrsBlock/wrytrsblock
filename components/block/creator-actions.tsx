"use client";

import { useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Handshake,
  MessageCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { openNewBlock } from "@/lib/ui-events";

// Actions on another creator's profile. Start Block is the hero action;
// Message / Hire send a request; Save bookmarks the creator.
export function CreatorActions({ handle }: { handle: string }) {
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2600);
  }

  return (
    <div className="flex flex-col items-stretch gap-2 w-full md:w-auto">
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="md"
          onClick={() => openNewBlock("collaboration")}
        >
          <Plus size={13} /> Start Block
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={() => flash(`Message request sent to @${handle} (demo)`)}
        >
          <MessageCircle size={13} /> Message
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={() => flash(`Hire request sent to @${handle} (demo)`)}
        >
          <Handshake size={13} /> Hire
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
      {notice && (
        <p className="text-[11.5px] text-success inline-flex items-center gap-1.5">
          <Check size={12} /> {notice}
        </p>
      )}
    </div>
  );
}
