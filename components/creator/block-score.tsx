"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, Star } from "lucide-react";
import { Badge, Progress } from "@/components/ui/primitives";
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

// Compact Block Score card — a supporting credibility signal, not the headline.
// The score is small, the bar is thin, and the breakdown is tucked behind a
// "How it's calculated" disclosure. New creators see an encouraging state.
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
  const pct = Math.round((score / MAX_BLOCK_SCORE) * 100);

  if (isNew) {
    return (
      <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
        <span className="h-9 w-9 shrink-0 rounded-xl bg-accent/12 border border-accent/30 flex items-center justify-center text-accent">
          <Sparkles size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink leading-tight">
            Building Reputation
          </p>
          <p className="mt-0.5 text-[11px] text-muted leading-snug">
            Complete Blocks and earn ratings to grow your Block Score.
          </p>
        </div>
        <Badge tone="soft" dot>
          New Creator
        </Badge>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      {/* Header — compact: label, value, percentage, rank */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink min-w-0">
          <Star size={12} className="text-warning fill-warning shrink-0" />
          Block Score
          <span className="text-muted font-medium tabular-nums">{score}</span>
          <span className="text-muted/70 font-normal tabular-nums">
            · {pct}%
          </span>
        </span>
        <Badge tone={level.tone as LevelTone} dot>
          {level.label}
        </Badge>
      </div>

      {/* Thin progress bar */}
      <Progress value={pct} size="thin" className="mt-2.5" />

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10.5px] text-muted">
          Earned through completed Blocks &amp; ratings
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="shrink-0 inline-flex items-center gap-1 text-[10.5px] font-medium text-accent hover:underline"
        >
          How it&apos;s calculated
          <ChevronDown
            size={11}
            className={cn("transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-white/[0.08] animate-fade-up">
          <ul className="space-y-2">
            {factors.map((f) => (
              <li key={f.label} className="flex items-center gap-3">
                <span className="text-[11px] text-ink/80 flex-1 min-w-0 truncate">
                  {f.label}
                </span>
                <span className="w-16 shrink-0">
                  <Progress value={f.pct * 100} size="thin" tone="accent" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
