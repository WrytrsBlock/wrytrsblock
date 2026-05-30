"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // lock scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = {
    sm: "max-w-[400px]",
    md: "max-w-[520px]",
    lg: "max-w-[680px]",
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-start justify-center pt-[12vh] px-4">
      <div
        className="absolute inset-0 bg-bg/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full rounded-2xl border border-line-strong bg-surface shadow-pop overflow-hidden animate-fade-up",
          widths[size]
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line">
            <div>
              {title && (
                <h2 className="font-display text-2xl text-ink tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-[12.5px] text-muted leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 -mr-1.5 -mt-0.5 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-line bg-surface-2/40 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
