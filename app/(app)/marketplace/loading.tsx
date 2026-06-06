import { TopBar } from "@/components/shell/topbar";

// Skeleton shown while the Block Market loads — mirrors the real layout (header,
// search, filters, and the frosted-glass card grid) for a premium first paint.
export default function Loading() {
  return (
    <>
      <TopBar
        crumbs={[{ label: "The CR8TV Collectv" }, { label: "Block Market" }]}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 md:px-8 py-6 md:py-7 max-w-[1280px] w-full space-y-5 animate-pulse">
          {/* Header */}
          <div className="space-y-2.5">
            <div className="h-3 w-40 rounded bg-white/[0.06]" />
            <div className="h-8 w-52 rounded-lg bg-white/[0.07]" />
            <div className="h-3.5 w-64 rounded bg-white/[0.05]" />
          </div>

          {/* Search */}
          <div className="h-12 w-full rounded-2xl bg-white/[0.04] border border-white/10" />

          {/* Filter pills */}
          <div className="flex gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-24 rounded-full bg-white/[0.04] border border-white/10"
              />
            ))}
          </div>

          <div className="h-3 w-28 rounded bg-white/[0.05]" />

          {/* Card grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="relative aspect-[4/5] rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden"
              >
                {/* frosted glass band placeholder */}
                <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-white/[0.06] to-white/[0.02] border-t border-white/10 p-3.5 flex flex-col justify-start gap-2">
                  <div className="h-4 w-3/4 rounded bg-white/[0.08]" />
                  <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
                  <div className="mt-auto h-8 w-full rounded-lg bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
