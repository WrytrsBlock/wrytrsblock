import { Skeleton } from "@/components/ui/skeleton";

export default function BlockLoading() {
  return (
    <>
      {/* Topbar */}
      <div className="h-12 shrink-0 border-b border-line flex items-center gap-3 pl-14 pr-3 md:px-5">
        <Skeleton className="h-3 w-48" />
        <div className="flex-1" />
        <Skeleton className="h-7 w-28 rounded-md" />
      </div>

      {/* Header */}
      <div className="px-8 pt-10 pb-7 border-b border-line">
        <Skeleton className="h-2.5 w-32" />
        <Skeleton className="mt-3 h-11 w-80" />
        <Skeleton className="mt-3 h-3 w-[28rem] max-w-full" />
        <div className="mt-5 flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      </div>

      {/* Tabs */}
      <div className="h-11 border-b border-line flex items-center gap-4 px-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>

      {/* Board-ish content */}
      <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, c) => (
          <div key={c} className="rounded-2xl border border-line bg-surface/40 p-2.5">
            <Skeleton className="h-3 w-20 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 2 + (c % 2) }).map((_, i) => (
                <div key={i} className="rounded-xl border border-line bg-surface p-3">
                  <Skeleton className="h-3 w-full" />
                  <div className="mt-3 flex items-center justify-between">
                    <Skeleton className="h-4 w-12 rounded-md" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
