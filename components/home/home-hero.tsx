"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { openNewBlock } from "@/lib/ui-events";

export type HeroCreator = {
  id: string;
  name: string;
  role: string;
  img: string;
  handle: string;
};

// Home hero — "Who are you creating with today?" The headline + CTA are real
// (the button opens the Start-a-Block flow), with live creator cards on the
// right. A neon gradient + giant BLOCK watermark stand in for the art; drop a
// figure image into the center later to complete the look.
export function HomeHero({ creators }: { creators: HeroCreator[] }) {
  return (
    <section className="relative mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-[#140b22] p-6 sm:p-8 md:p-10">
      {/* Neon gradient washes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 18% 30%, rgba(124,58,237,0.45) 0%, transparent 55%), radial-gradient(110% 120% at 92% 80%, rgba(236,72,153,0.42) 0%, transparent 55%), radial-gradient(90% 90% at 60% 10%, rgba(59,102,246,0.30) 0%, transparent 60%)",
        }}
      />
      {/* Giant BLOCK watermark */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-2 top-1/2 -translate-y-1/2 select-none font-display text-[26vw] font-extrabold leading-none tracking-tighter text-white/[0.05] md:text-[180px]"
      >
        BLOCK
      </span>

      <div className="relative grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
        {/* Left — headline + CTA */}
        <div>
          <h2 className="font-display text-[34px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-[44px] md:text-[52px]">
            Who are you creating with{" "}
            <span className="text-[#ff3d8b]">today?</span>
          </h2>
          <p className="mt-4 text-[17px] font-semibold text-white sm:text-[19px]">
            Connect. Collaborate. Complete.
          </p>
          <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-white/60">
            Find collaborators and start a Block instantly.
          </p>

          <button
            type="button"
            onClick={() => openNewBlock()}
            className="mt-6 inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_30px_-6px_rgba(236,72,153,0.55)] transition-transform hover:scale-[1.02] active:scale-95"
            style={{ color: "#FFFFFF" }}
          >
            <Plus size={18} strokeWidth={2.6} /> Start a Block
          </button>
        </div>

        {/* Right — live creator cards */}
        {creators.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {creators.slice(0, 4).map((c, i) => (
              <Link
                key={c.id}
                href={`/profile/${c.handle}`}
                className={
                  "group relative aspect-[4/5] w-[150px] shrink-0 overflow-hidden rounded-2xl border border-[#ff3d8b]/40 shadow-[0_0_24px_-6px_rgba(236,72,153,0.5)] md:w-auto" +
                  (i % 2 === 1 ? " md:mt-7" : "")
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.img}
                  alt={c.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="truncate font-display text-[17px] font-bold leading-tight text-white drop-shadow">
                    {c.name}
                  </p>
                  <p className="truncate text-[13px] font-semibold leading-tight text-[#ff5b9c] drop-shadow">
                    {c.role}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
