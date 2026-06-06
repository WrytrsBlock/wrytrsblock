"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, Star, TrendingUp } from "lucide-react";
import { Badge, Progress, SectionLabel } from "@/components/ui/primitives";
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

// Full Block Score card. Default state shows score + rank + progress; the factor
// breakdown is tucked behind "View Breakdown". New creators are never shown a
// bleak "0 / 1000" — they see an encouraging "Building Reputation" state instead.
export function BlockScoreCard({
  score,
  factors,
  isNew = false,
}: {
  score: number;
  factors: { label: string; pct: number }[];
  isNew?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const level = levelForScore(score);

  return (
    <div className="glass-card glass-glow rounded-2xl p-6">
      {/* Header — label + rank */}
      <div className="flex items-center justify-between">
        <SectionLabel className="flex items-center gap-1.5">
          <Star size={11} className="text-warning fill-warning" /> Block Score
        </SectionLabel>
        <Badge tone={isNew ? "soft" : (level.tone as LevelTone)} dot>
          {isNew ? "New Creator" : level.label}
        </Badge>
      </div>

      {isNew ? (
        // New creators: positive, forward-looking state (no 0/1000).
        <div className="mt-4 flex items-start gap-3">
          <span className="h-10 w-10 shrink-0 rounded-xl bg-accent/12 border border-accent/30 flex items-center justify-center text-accent">
            <Sparkles size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink leading-tight">
              Building Reputation
            </p>
            <p className="mt-1 text-[12px] text-muted leading-relaxed">
              Complete Blocks and earn ratings to grow your Block Score.
            </p>
          </div>
        </div>
      ) : (
        // Established creators: score + rank + progress bar.
        <>
          <div className="mt-3 flex items-end gap-1.5">
            <span className="font-display text-6xl text-ink tracking-tight leading-none tabular-nums">
              {score}
            </span>
            <span className="text-[11px] text-muted mb-1.5">
              / {MAX_BLOCK_SCORE}
            </span>
          </div>
          <Progress value={(score / MAX_BLOCK_SCORE) * 100} className="mt-3" />
        </>
      )}

      {/* Analytics tucked behind a disclosure so the default view stays clean */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-4 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-muted hover:text-ink transition-colors"
      >
        <TrendingUp size={11} /> View Breakdown
        <ChevronDown
          size={13}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="mt-3 pt-4 border-t border-white/[0.08] animate-fade-up">
          <ul className="space-y-2">
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
            Earned through completed Blocks, ratings, and reliable
            collaboration.
          </p>
        </div>
      )}
    </div>
  );
}
