import { cn } from "@/lib/cn";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "accent";
  size?: "sm" | "md" | "lg" | "icon" | "icon-lg";
} & ComponentPropsWithoutRef<"button">) {
  const base =
    "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap select-none";
  const variants: Record<string, string> = {
    primary:
      "bg-ink text-bg hover:bg-ink/92 shadow-soft border border-ink",
    accent:
      "bg-grad-accent text-bg shadow-glow border border-accent/40 hover:shadow-elevated",
    secondary:
      "bg-surface-2 text-ink hover:bg-surface-3 border border-line",
    ghost: "text-ink hover:bg-surface-2 border border-transparent",
    outline:
      "border border-line text-ink hover:bg-surface-2 hover:border-line-strong bg-transparent",
  };
  const sizes: Record<string, string> = {
    sm: "h-7 px-2.5 text-[12px]",
    md: "h-8 px-3 text-[12.5px]",
    lg: "h-10 px-4 text-[13px]",
    icon: "h-8 w-8 p-0",
    "icon-lg": "h-10 w-10 p-0",
  };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
  hover,
  ...props
}: { hover?: boolean } & ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "bg-surface border border-line rounded-2xl shadow-soft",
        hover && "transition-all duration-300 ease hover:border-line-strong hover:shadow-elevated",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  tone = "default",
  className,
  children,
  dot,
}: {
  tone?:
    | "default"
    | "accent"
    | "accent-2"
    | "success"
    | "warning"
    | "danger"
    | "soft"
    | "ghost";
  className?: string;
  children: ReactNode;
  dot?: boolean;
}) {
  const tones: Record<string, string> = {
    default: "bg-surface-2 text-muted border border-line",
    accent: "bg-accent/15 text-accent border border-accent/30",
    "accent-2": "bg-accent-2/15 text-accent-2 border border-accent-2/30",
    success: "bg-success/15 text-success border border-success/30",
    warning: "bg-warning/15 text-warning border border-warning/30",
    danger: "bg-danger/15 text-danger border border-danger/30",
    soft: "bg-surface-3 text-ink/80 border border-line",
    ghost: "text-muted border border-transparent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 h-5 text-[10.5px] font-medium rounded-md tracking-[0.02em]",
        tones[tone],
        className
      )}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-slow-pulse" />
      )}
      {children}
    </span>
  );
}

export function Avatar({
  src,
  name,
  size = 28,
  online,
  className,
  ring,
}: {
  src?: string;
  name: string;
  size?: number;
  online?: boolean;
  className?: string;
  ring?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-surface-3 text-ink/80 font-medium overflow-hidden border border-line shrink-0",
        ring && "ring-2 ring-bg",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.floor(size * 0.38) }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute right-0 bottom-0 block rounded-full ring-2 ring-bg",
            online ? "bg-success" : "bg-muted/50"
          )}
          style={{ width: Math.max(8, size * 0.28), height: Math.max(8, size * 0.28) }}
        />
      )}
    </span>
  );
}

export function AvatarStack({
  ids,
  size = 24,
  max = 5,
  resolve,
}: {
  ids: string[];
  size?: number;
  max?: number;
  resolve: (id: string) => { name: string; avatar: string } | undefined;
}) {
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((id) => {
        const p = resolve(id);
        if (!p) return null;
        return (
          <Avatar
            key={id}
            src={p.avatar}
            name={p.name}
            size={size}
            ring
          />
        );
      })}
      {extra > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-surface-3 text-muted text-[10px] font-medium ring-2 ring-bg border border-line"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

export function Progress({
  value,
  className,
  tone = "accent",
  size = "default",
}: {
  value: number;
  className?: string;
  tone?: "accent" | "success" | "warning" | "ink";
  size?: "thin" | "default";
}) {
  const tones: Record<string, string> = {
    accent: "bg-grad-accent",
    success: "bg-success",
    warning: "bg-warning",
    ink: "bg-ink",
  };
  return (
    <div
      className={cn(
        size === "thin" ? "h-1" : "h-1.5",
        "w-full rounded-full bg-surface-3 overflow-hidden",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500 ease", tones[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-line bg-surface-2 text-[10px] font-mono text-muted">
      {children}
    </kbd>
  );
}

export function Divider({
  className,
  vertical,
}: {
  className?: string;
  vertical?: boolean;
}) {
  return (
    <div
      className={cn(
        vertical ? "w-px h-full" : "h-px w-full",
        "bg-line",
        className
      )}
    />
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[10px] uppercase tracking-[0.18em] font-medium text-muted/80",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Input({
  className,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={cn(
        "w-full h-9 px-3 rounded-lg bg-surface-2 border border-line text-ink text-[13px] placeholder:text-muted/70 transition-colors duration-200",
        "focus:outline-none focus:border-accent/50 focus:bg-surface",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block text-[11.5px] font-medium text-muted mb-1.5 tracking-[0.02em]",
        className
      )}
    >
      {children}
    </label>
  );
}
