import { Star, TrendingUp } from "lucide-react";
import { Badge, Card, Progress, SectionLabel } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  levelForScore,
  MAX_BLOCK_SCORE,
  type LevelTone,
} from "@/lib/block-score";

// Inline Block Score — the headline trust signal. Used on cards and profiles.
export function BlockScore({
  score,
  size = "sm",
  showLevel = true,
  showLabel = false,
  className,
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  showLevel?: boolean;
  showLabel?: boolean;
  className?: string;
}) {
  const level = levelForScore(score);
  const starSize = size === "lg" ? 16 : size === "md" ? 14 : 12;
  const numClass =
    size === "lg"
      ? "text-[20px]"
      : size === "md"
      ? "text-[15px]"
      : "text-[13px]";

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={`Block Score ${score} · ${level.label}`}
    >
      <Star size={starSize} className="text-warning fill-warning shrink-0" />
      <span className={cn("font-semibold text-ink tabular-nums", numClass)}>
        {score}
      </span>
      {showLabel && (
        <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
          Block Score
        </span>
      )}
      {showLevel && (
        <Badge tone={level.tone as LevelTone}>{level.label}</Badge>
      )}
    </span>
  );
}

// Full Block Score card with the level and the factor breakdown — communicates
// the reputation system and the (future) inputs that move it.
export function BlockScoreCard({
  score,
  factors,
}: {
  score: number;
  factors: { label: string; pct: number }[];
}) {
  const level = levelForScore(score);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <SectionLabel className="flex items-center gap-1.5">
          <Star size={11} className="text-warning fill-warning" /> Block Score
        </SectionLabel>
        <Badge tone={level.tone as LevelTone} dot>
          {level.label}
        </Badge>
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        <span className="font-display text-5xl text-ink tracking-tight leading-none tabular-nums">
          {score}
        </span>
        <span className="text-[11px] text-muted mb-1.5">
          / {MAX_BLOCK_SCORE}
        </span>
      </div>
      <Progress value={(score / MAX_BLOCK_SCORE) * 100} className="mt-3" />

      <div className="mt-5 pt-4 border-t border-line">
        <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-muted/80">
          <TrendingUp size={11} /> What moves it
        </div>
        <ul className="mt-3 space-y-2">
          {factors.map((f) => (
            <li key={f.label} className="flex items-center gap-3">
              <span className="text-[11.5px] text-ink/80 flex-1 min-w-0 truncate">
                {f.label}
              </span>
              <span className="w-20 shrink-0">
                <Progress value={f.pct * 100} size="thin" tone="accent" />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[10.5px] text-muted leading-relaxed">
          Earned through completed Blocks, ratings, and reliable collaboration.
        </p>
      </div>
    </Card>
  );
}
