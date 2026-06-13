import { cn } from "@/lib/cn";
import type { Block } from "@/lib/mock";

// The Block journey, reduced to its essence: a thin progress bar + the percent
// and a one-word status. No stage diagram — it lives inline in the Block header
// so the workspace reads as one Block, not a stack of partitions.
const STATUS_LABEL: Record<Block["completion"]["status"], string> = {
  open: "Recruiting",
  active: "In progress",
  in_review: "In review",
  completed: "Completed",
};

export function BlockProgress({
  block,
  className,
}: {
  block: Block;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, block.completion.percent));
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="lg-prog w-24 sm:w-36">
        <div style={{ width: `${pct}%` }} />
      </div>
      <span className="whitespace-nowrap text-[11px] tabular-nums text-white/65">
        {pct}% · {STATUS_LABEL[block.completion.status]}
      </span>
    </div>
  );
}
