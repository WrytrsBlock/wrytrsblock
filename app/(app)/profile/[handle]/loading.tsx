import { TopBar } from "@/components/shell/topbar";

// Skeleton for a creator profile while it loads — banner, glass identity hero,
// and content blocks.
export default function Loading() {
  return (
    <>
      <TopBar crumbs={[{ label: "Block Market", href: "/marketplace" }, { label: "Creator" }]} />
      <div className="flex-1 overflow-y-auto">
        <div className="animate-pulse">
          {/* Banner */}
          <div className="relative h-44 sm:h-60 md:h-72 w-full bg-white/[0.05]">
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-bg/5" />
          </div>

          {/* Identity hero */}
          <div className="px-4 md:px-8 max-w-[1100px]">
            <div className="glass-card relative -mt-16 md:-mt-20 rounded-3xl px-5 md:px-8 pb-7">
              <div className="-mt-14 md:-mt-16 h-[120px] w-[120px] rounded-full bg-white/[0.08] border-4 border-bg" />
              <div className="mt-4 space-y-3">
                <div className="h-9 w-64 rounded-lg bg-white/[0.08]" />
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-8 w-24 rounded-full bg-white/[0.05]" />
                  ))}
                </div>
                <div className="h-3.5 w-40 rounded bg-white/[0.05]" />
                <div className="h-3.5 w-full max-w-2xl rounded bg-white/[0.04]" />
                <div className="h-3.5 w-2/3 max-w-xl rounded bg-white/[0.04]" />
              </div>
              <div className="mt-6 h-[68px] w-full max-w-md rounded-2xl bg-white/[0.04] border border-white/10" />
            </div>
          </div>

          {/* Content blocks */}
          <div className="px-5 md:px-8 pt-7 max-w-[1100px] space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 w-full max-w-[820px] rounded-2xl bg-white/[0.03] border border-white/10"
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
