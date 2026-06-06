import { Target } from "lucide-react";
import { cn } from "@/lib/cn";
import { matchTier } from "@/lib/block-match";

// Inline Block Match badge — a creator's match strength (0–100). Royal-blue +
// target, deliberately distinct from the gold-star Block Score. `overlay` reads
// on top of imagery (marketplace cover); `solid` for light surfaces.
export function BlockMatch({
  score,
  variant = "solid",
  size = "sm",
  showLabel = false,
  className,
}: {
  score: number;
  variant?: "solid" | "overlay";
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}) {
  const icon = size === "md" ? 13 : 12;
  return (
    <span
      title={`Block Match ${score} · ${matchTier(score).label}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold tabular-nums",
        size === "md" ? "h-7 px-2.5 text-[13px]" : "h-6 px-2.5 text-[11.5px]",
        variant === "overlay"
          ? "bg-black/55 backdrop-blur-sm text-white border border-white/15"
          : "bg-accent/15 text-accent border border-accent/30",
        className
      )}
    >
      <Target size={icon} className={variant === "overlay" ? "" : "text-accent"} />
      {score}
      {showLabel && (
        <span className="font-medium opacity-80">Match</span>
      )}
    </span>
  );
}

// Large circular Block Match gauge — the hero of the onboarding completion
// screen ("Profile Complete"). Pure SVG, no deps.
export function BlockMatchRing({
  score,
  size = 160,
}: {
  score: number;
  size?: number;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  const tier = matchTier(score);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="bm-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent))" />
            <stop offset="100%" stopColor="rgb(var(--accent-2))" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--surface-3))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#bm-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-muted">
          <Target size={11} className="text-accent" /> Block Match
        </span>
        <span className="font-display text-[40px] leading-none text-ink tabular-nums mt-1">
          {score}
        </span>
        <span className="mt-1 text-[11px] font-medium text-accent">
          {tier.label}
        </span>
      </div>
    </div>
  );
}
