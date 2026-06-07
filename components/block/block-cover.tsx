"use client";

import { useState } from "react";
import { Briefcase, PartyPopper, Users } from "lucide-react";
import type { BlockType } from "@/types";

// A Block cover image with a branded, type-tinted fallback. Covers the two ways
// a card's image area can go black: no cover set, or a cover URL that fails to
// load. Client component so it can catch the image's onError.
export function BlockCover({
  src,
  type,
}: {
  src?: string | null;
  type: BlockType;
}) {
  const [failed, setFailed] = useState(false);
  const usable = !!src && src.trim().length > 0 && !failed;

  if (usable) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
      />
    );
  }

  const Icon =
    type === "block_party"
      ? PartyPopper
      : type === "service"
        ? Briefcase
        : Users;

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-accent/35 via-surface-2 to-accent-2/25">
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-white/15">
        <Icon size={56} strokeWidth={1.25} />
      </span>
    </div>
  );
}
