import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

// Cinematic empty state — a soft, centered prompt used wherever a Block has no
// content yet. Keeps new Blocks feeling intentional rather than broken.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-line overflow-hidden",
        compact ? "py-10 px-6" : "py-16 px-8",
        className
      )}
    >
      <div className="absolute inset-0 bg-grad-mesh opacity-40 pointer-events-none" />
      <div className="relative">
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-2xl border border-line bg-surface-2 text-muted shadow-soft",
            compact ? "h-11 w-11" : "h-14 w-14"
          )}
        >
          <Icon size={compact ? 18 : 22} strokeWidth={1.5} className="text-accent" />
        </span>
        <h3
          className={cn(
            "mt-4 font-display text-ink tracking-tight",
            compact ? "text-xl" : "text-2xl"
          )}
        >
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 text-[12.5px] text-muted max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
        {action && <div className="mt-5 flex items-center justify-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
