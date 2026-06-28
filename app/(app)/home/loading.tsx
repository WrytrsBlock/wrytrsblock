import { TopBar } from "@/components/shell/topbar";

// Instant skeleton for Home — mirrors the real layout (hero + suggested rail) so
// navigation never flashes a black screen or the wrong-shaped placeholder.
export default function HomeLoading() {
  return (
    <>
      <TopBar />
      <div className="flex-1 overflow-y-auto">
        <div className="page-fluid pb-16">
          <div className="mt-5 h-3 w-32 rounded bg-white/[0.06]" />
          {/* Hero placeholder (square, matches the artwork hero) */}
          <div className="mt-4 aspect-square w-full rounded-[24px] border border-white/10 bg-white/[0.04]" />
          {/* Suggested rail placeholder */}
          <div className="mt-8 h-6 w-52 rounded-lg bg-white/[0.06]" />
          <div className="mt-3 flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] w-[150px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] sm:w-[168px]"
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
