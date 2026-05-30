import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <>
      {/* Topbar placeholder */}
      <div className="h-12 shrink-0 border-b border-line flex items-center gap-3 pl-14 pr-3 md:px-5">
        <Skeleton className="h-3 w-40" />
        <div className="flex-1" />
        <Skeleton className="h-7 w-32 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      {/* Content placeholder */}
      <div className="flex-1 overflow-hidden px-8 py-8 max-w-[1400px] w-full">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-9 w-64" />
        <Skeleton className="mt-2 h-3 w-80" />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-line bg-surface p-0 overflow-hidden"
            >
              <Skeleton className="h-32 w-full rounded-none" />
              <div className="p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-1.5 h-3 w-2/3" />
                <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
