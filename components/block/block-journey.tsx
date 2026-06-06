import { Check, Layers, Trophy, Users } from "lucide-react";
import { Card, SectionLabel } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { Block } from "@/lib/mock";

// The product principle made literal: Connect → Collaborate → Complete.
// Stage is derived from the Block's completion status so the journey reflects
// where the work actually is.
const STAGES = [
  { id: "connect", label: "Connect", icon: Users, blurb: "Find collaborators" },
  { id: "collaborate", label: "Collaborate", icon: Layers, blurb: "Make the work" },
  { id: "complete", label: "Complete", icon: Trophy, blurb: "Ship & split" },
] as const;

const STATUS_LABEL: Record<Block["completion"]["status"], string> = {
  open: "Open — recruiting",
  active: "In progress",
  in_review: "In review",
  completed: "Completed",
};

function currentIndex(status: Block["completion"]["status"]): number {
  switch (status) {
    case "open":
      return 0;
    case "active":
      return 1;
    case "in_review":
      return 2;
    case "completed":
      return 3; // all stages done
    default:
      return 0;
  }
}

export function BlockJourney({ block }: { block: Block }) {
  const idx = currentIndex(block.completion.status);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>Block journey</SectionLabel>
        <span className="text-[11px] text-muted tabular-nums">
          {block.completion.percent}% · {STATUS_LABEL[block.completion.status]}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const done = i < idx;
          const active = i === idx;
          const leftFilled = idx >= i; // segment entering this stage
          const rightFilled = idx >= i + 1; // segment leaving this stage
          return (
            <div
              key={s.id}
              className="relative flex flex-col items-center text-center px-1"
            >
              {/* Connector — left half */}
              {i > 0 && (
                <span
                  className={cn(
                    "absolute top-5 right-1/2 left-0 h-0.5 -translate-y-1/2",
                    leftFilled ? "bg-grad-accent" : "bg-line"
                  )}
                />
              )}
              {/* Connector — right half */}
              {i < STAGES.length - 1 && (
                <span
                  className={cn(
                    "absolute top-5 left-1/2 right-0 h-0.5 -translate-y-1/2",
                    rightFilled ? "bg-grad-accent" : "bg-line"
                  )}
                />
              )}

              {/* Node */}
              <span
                className={cn(
                  "relative z-10 h-10 w-10 rounded-full flex items-center justify-center border transition-colors",
                  done
                    ? "bg-grad-accent border-transparent text-bg shadow-glow"
                    : active
                    ? "bg-accent/10 border-accent/60 text-accent"
                    : "bg-surface-2 border-line text-muted"
                )}
              >
                {done ? (
                  <Check size={17} strokeWidth={2.5} />
                ) : (
                  <Icon size={16} strokeWidth={1.9} />
                )}
              </span>

              <p
                className={cn(
                  "mt-2 text-[12px] font-semibold tracking-tight",
                  active || done ? "text-ink" : "text-muted"
                )}
              >
                {s.label}
              </p>
              <p className="text-[10px] text-muted leading-tight mt-0.5">
                {s.blurb}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
