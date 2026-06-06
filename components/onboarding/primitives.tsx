"use client";

import { useRef, useState, type ReactNode } from "react";
import { Camera, Check, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar, Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  IMAGE_ACCEPT,
  IMAGE_FORMATS_HINT,
  uploadToAvatars,
  validateImageFile,
} from "@/lib/upload-image";
import { supabaseConfigured } from "@/lib/env";

// Large selectable card — the workhorse of the onboarding flow (creator type,
// collaboration style, experience, goals). Selected = accent border + glow + a
// check. Disabled (e.g. goal cap reached) dims and blocks input.
export function SelectableCard({
  icon: Icon,
  label,
  desc,
  selected,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  desc?: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !selected}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col items-start text-left rounded-2xl border p-4 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        selected
          ? "border-accent/60 bg-accent/10 shadow-glow"
          : "border-line bg-surface hover:border-line-strong hover:bg-surface-2",
        disabled && !selected && "opacity-40 pointer-events-none"
      )}
    >
      <span
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
          selected
            ? "border-accent/40 bg-accent/15 text-accent"
            : "border-line bg-surface-2 text-muted group-hover:text-ink"
        )}
      >
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="mt-3 text-[13.5px] font-semibold text-ink leading-tight">
        {label}
      </span>
      {desc && (
        <span className="mt-1 text-[11.5px] text-muted leading-snug">
          {desc}
        </span>
      )}
      <span
        className={cn(
          "absolute top-3 right-3 inline-flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-200",
          selected
            ? "border-accent bg-accent text-white scale-100"
            : "border-line bg-surface-2 text-transparent scale-90"
        )}
      >
        <Check size={12} strokeWidth={3} />
      </span>
    </button>
  );
}

// Chip / tag for fast multi-select (genres, looking-for).
export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-4 rounded-full border text-[13px] font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        selected
          ? "border-accent/60 bg-accent/10 text-accent shadow-glow"
          : "border-line bg-surface text-muted hover:text-ink hover:border-line-strong"
      )}
    >
      {selected && <Check size={13} strokeWidth={3} />}
      {label}
    </button>
  );
}

// Profile photo picker — circular preview with a camera affordance. Selection
// is a local object URL (no upload), so it works fully in demo mode.
export function PhotoPicker({
  value,
  name,
  onChange,
}: {
  value: string | null;
  name: string;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate, then upload to Supabase Storage (avatars/<uid>/...). In demo mode
  // (no Supabase) we use a local object URL. Real upload failures surface the
  // actual error instead of failing silently.
  async function handleFile(file: File) {
    setError(null);

    const invalid = validateImageFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }

    if (!supabaseConfigured) {
      onChange(URL.createObjectURL(file));
      return;
    }

    setUploading(true);
    try {
      const url = await uploadToAvatars(file, "avatar");
      if (url) onChange(url);
    } catch (e) {
      console.error("Avatar upload failed:", e);
      setError(
        e instanceof Error ? e.message : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          aria-label="Add profile photo"
        >
          <Avatar
            src={value ?? undefined}
            name={name || "You"}
            size={104}
            className="border-2 border-line"
          />
          <span className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-grad-accent text-white border-2 border-bg shadow-glow">
            <Camera size={15} strokeWidth={2} />
          </span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove photo"
            className="absolute -top-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 border border-line text-muted hover:text-ink"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-[12px] font-medium text-accent hover:underline disabled:opacity-60"
      >
        {uploading ? "Uploading…" : value ? "Change photo" : "Add a photo"}
      </button>
      {error ? (
        <p className="text-[11.5px] text-danger text-center max-w-[220px]">
          {error}
        </p>
      ) : (
        <p className="text-[11px] text-muted/70 text-center">
          {IMAGE_FORMATS_HINT}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// Top progress indicator — "Step X of N — Label" + a percentage + the bar.
export function ProgressHeader({
  step,
  total,
  percent,
  label,
}: {
  step: number; // 1-based
  total: number;
  percent: number;
  label?: string; // current step name, shown beside the count
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold tracking-tight text-ink">
          Step {step} of {total}
          {label && <span className="text-accent"> — {label}</span>}
        </span>
        <span className="shrink-0 text-[11px] font-medium tracking-[0.04em] text-muted/80 uppercase">
          {percent}% complete
        </span>
      </div>
      <div className="mt-2">
        <Progress value={percent} size="thin" />
      </div>
    </div>
  );
}

// Consistent step header (kicker + title + subtitle) above each step's content.
export function StepHeading({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      {kicker && (
        <p className="text-[10.5px] uppercase tracking-[0.2em] text-accent font-semibold">
          {kicker}
        </p>
      )}
      <h1 className="mt-2 font-display text-2xl md:text-[30px] text-ink tracking-tight leading-[1.1]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-[13.5px] text-muted leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Labeled field wrapper. `size="sm"` (default) is the compact form-field label
// used for inputs; `size="lg"` is a scannable section header (large, bold, pure
// white) for grouping multi-select sections.
export function Field({
  label,
  hint,
  size = "sm",
  children,
}: {
  label: string;
  hint?: ReactNode;
  size?: "sm" | "lg";
  children: ReactNode;
}) {
  const lg = size === "lg";
  return (
    <div>
      <div
        className={cn(
          "flex items-baseline justify-between",
          lg ? "mb-3.5" : "mb-1.5"
        )}
      >
        <span
          className={cn(
            lg
              ? "text-[19px] font-extrabold text-[#FFFFFF] tracking-tight leading-tight"
              : "text-[11.5px] font-medium text-muted tracking-[0.02em]"
          )}
        >
          {label}
        </span>
        {hint && <span className="text-[11px] text-muted/70">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
