"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ContentType } from "@/types";

// Opens the Block Showcase add/edit modal (which lives inside the BlockShowcase
// component in the banner) from anywhere on the page via a window event, with an
// optional pre-selected content type. Owner-only triggers use this.
export function ShowcaseAddButton({
  type,
  label,
  className,
  variant = "outline",
}: {
  type?: ContentType;
  label: string;
  className?: string;
  variant?: "outline" | "primary" | "ghost";
}) {
  // Liquid-glass pills (mockup): primary = blue glass, default = white glass.
  const styles =
    variant === "primary"
      ? "lg-btn lg-btn-p"
      : variant === "ghost"
        ? "inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-medium border border-transparent text-[#A9BEFF] hover:bg-white/[0.08] transition-colors"
        : "lg-btn";
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("wb:showcase-add", { detail: { type } })
        )
      }
      style={variant === "primary" ? { color: "#FFFFFF" } : undefined}
      className={cn(styles, className)}
    >
      <Plus size={14} /> {label}
    </button>
  );
}
