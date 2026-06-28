"use client";

import { openNewBlock } from "@/lib/ui-events";

// Home hero — the full "Who are you creating with today?" artwork (a random
// image chosen per visit, passed in as `src`). Tapping it opens the
// Start-a-Block flow (the artwork's own CTA).
export function HomeHero({ src }: { src: string }) {
  return (
    <button
      type="button"
      onClick={() => openNewBlock()}
      aria-label="Who are you creating with today? Start a Block."
      className="mt-4 block w-full overflow-hidden rounded-[24px] border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] transition-transform active:scale-[0.99]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Who are you creating with today? Connect. Collaborate. Complete. Start a Block."
        width={1254}
        height={1254}
        fetchPriority="high"
        decoding="async"
        className="block aspect-square h-auto w-full object-cover"
      />
    </button>
  );
}
