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
  const styles =
    variant === "primary"
      ? "bg-grad-accent text-white border border-accent/40 shadow-glow hover:opacity-95"
      : variant === "ghost"
        ? "border border-transparent text-accent hover:bg-accent/10"
        : "border border-line bg-transparent text-ink hover:bg-surface-2 hover:border-line-strong";
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("wb:showcase-add", { detail: { type } })
        )
      }
      style={variant === "primary" ? { color: "#FFFFFF" } : undefined}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-[13px] font-medium transition-colors",
        styles,
        className
      )}
    >
      <Plus size={14} /> {label}
    </button>
  );
}
