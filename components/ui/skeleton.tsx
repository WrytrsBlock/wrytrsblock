import { cn } from "@/lib/cn";

// Pulsing placeholder block. Compose into route-level loading skeletons.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-md bg-surface-2 animate-pulse", className)} />
  );
}
