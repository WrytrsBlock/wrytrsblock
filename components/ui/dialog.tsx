"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);

  // Show a bottom fade whenever the scroll area has more content below — a clear
  // cue that additional fields can be scrolled to.
  const recompute = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 6);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // lock background scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Recompute the fade on open, on resize, and whenever the content height
  // changes (e.g. the Block Request form switches type and grows/shrinks).
  useEffect(() => {
    if (!open) return;
    recompute();
    const scroll = scrollRef.current;
    const content = contentRef.current;
    const ro = new ResizeObserver(recompute);
    if (scroll) ro.observe(scroll);
    if (content) ro.observe(content);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [open, recompute]);

  if (!open) return null;

  const widths = {
    sm: "max-w-[400px]",
    md: "max-w-[520px]",
    lg: "max-w-[680px]",
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center sm:items-start sm:pt-[7vh] px-0 sm:px-4">
      <div
        className="absolute inset-0 bg-bg/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          // Mobile: bottom sheet. Desktop: centered modal. Always capped to the
          // viewport with a fixed header + footer and an internal scroll area.
          "glass-overlay relative w-full flex flex-col max-h-[92vh] sm:max-h-[86vh] overflow-hidden animate-fade-up rounded-t-2xl sm:rounded-2xl pb-[env(safe-area-inset-bottom)] sm:pb-0",
          widths[size]
        )}
      >
        {/* Mobile grabber */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="h-1 w-9 rounded-full bg-line-strong" />
        </div>

        {/* Fixed header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-line shrink-0">
            <div>
              {title && (
                <h2 className="font-display text-xl sm:text-2xl text-ink tracking-tight">
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

        {/* Scrollable body — min-h-0 lets the flex child actually shrink + scroll
            instead of pushing the footer out of view. */}
        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            onScroll={recompute}
            className="h-full overflow-y-auto overscroll-contain px-5 sm:px-6 py-5"
          >
            <div ref={contentRef}>{children}</div>
          </div>
          {/* Scroll cue — subtle fade when more content sits below */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface via-surface/60 to-transparent transition-opacity duration-200",
              moreBelow ? "opacity-100" : "opacity-0"
            )}
          />
        </div>

        {/* Fixed footer — the primary action is always visible */}
        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-line bg-surface-2/40 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
