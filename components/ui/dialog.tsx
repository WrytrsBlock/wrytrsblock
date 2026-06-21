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
  mobilePlacement = "sheet",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  // "sheet" (default) anchors to the bottom on mobile; "center" floats a
  // centered card in the middle of the screen on every breakpoint.
  mobilePlacement?: "sheet" | "center";
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);
  // On mobile, mirror the *visual* viewport so the on-screen keyboard never
  // clips the modal: the panel shrinks to the area above the keyboard and the
  // form scrolls within it. Null on desktop / when VisualViewport is absent.
  const [vp, setVp] = useState<{ h: number; top: number } | null>(null);

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

  // Track the visual viewport on mobile so the keyboard can't push the modal
  // off-screen. We only apply it under the `sm` breakpoint — desktop keeps the
  // normal layout-viewport sizing.
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const vvp = window.visualViewport;
    const mq = window.matchMedia("(max-width: 639px)");
    function apply() {
      if (vvp && mq.matches) {
        setVp({ h: vvp.height, top: vvp.offsetTop });
      } else {
        setVp(null);
      }
    }
    apply();
    vvp?.addEventListener("resize", apply);
    vvp?.addEventListener("scroll", apply);
    mq.addEventListener("change", apply);
    return () => {
      vvp?.removeEventListener("resize", apply);
      vvp?.removeEventListener("scroll", apply);
      mq.removeEventListener("change", apply);
    };
  }, [open]);

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

  const centered = mobilePlacement === "center";

  return (
    <>
      {/* Full-screen backdrop — stays put even when the panel shrinks to dodge
          the keyboard. */}
      <div
        className="fixed inset-0 z-[64] bg-bg/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-[65] flex justify-center overflow-hidden sm:items-start sm:pt-[7vh] sm:px-4",
          centered ? "items-center px-4 py-4 sm:py-0" : "items-end px-0"
        )}
        // Mobile: match the visible viewport so the modal never sits under the
        // keyboard. Desktop / no-VV: fall back to the full layout viewport.
        style={
          vp
            ? { height: vp.h, transform: `translateY(${vp.top}px)` }
            : { height: "100dvh" }
        }
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            // Capped to the *container* (visible viewport on mobile) with a fixed
            // header + footer and an internal scroll area.
            "glass-overlay relative w-full flex flex-col max-h-full sm:max-h-[86vh] overflow-hidden animate-fade-up sm:rounded-2xl sm:pb-0",
            centered
              ? "rounded-2xl pb-0"
              : "rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
            widths[size]
          )}
        >
        {/* Mobile grabber — only for the bottom-sheet variant */}
        {!centered && (
          <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
            <span className="h-1 w-9 rounded-full bg-line-strong" />
          </div>
        )}

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
            // Keep a focused field visible above the keyboard. Native browsers
            // try to, but inside a constrained modal we nudge it to center.
            onFocusCapture={(e) => {
              const t = e.target as HTMLElement;
              if (t.matches("input, textarea, select")) {
                setTimeout(
                  () => t.scrollIntoView({ block: "center", behavior: "smooth" }),
                  60
                );
              }
            }}
            className="h-full overflow-y-auto overflow-x-hidden overscroll-contain px-5 sm:px-6 py-5"
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

        {/* Sticky footer — the primary action stays pinned to the bottom of the
            visible area (above the keyboard) and clears the home indicator on
            installed PWAs via the safe-area inset. */}
        {footer && (
          <div className="px-5 sm:px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-line bg-surface-2/40 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
