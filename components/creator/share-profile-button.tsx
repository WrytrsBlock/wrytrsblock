"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/cn";

// Share Profile — native share sheet where supported, else copy link to
// clipboard with inline confirmation. Styled for the dark banner overlay.
export function ShareProfileButton({
  handle,
  name,
  className,
}: {
  handle: string;
  name: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/profile/${handle}`
        : `/profile/${handle}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${name} · WrytrsBlock`, url });
        return;
      } catch {
        // user dismissed the share sheet — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 text-[13px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20",
        className
      )}
    >
      {copied ? (
        <>
          <Check size={14} /> Link copied
        </>
      ) : (
        <>
          <Share2 size={14} /> Share
        </>
      )}
    </button>
  );
}
