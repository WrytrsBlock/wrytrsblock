"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Check,
  Info,
  Megaphone,
  Send,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button, Input, Label } from "@/components/ui/primitives";
import { cn, slugify } from "@/lib/cn";
import { onUIEvent } from "@/lib/ui-events";
import { createBlockAction } from "@/app/actions/blocks";
import { sendBlockRequestAction } from "@/app/actions/block-requests";
import type { BlockType } from "@/types";

// One screen, three choices. "Open Block" is a public collaboration anyone can
// join (the "Open Block" collaboration category); Collaboration is a private
// invite, Service is paid work. Kept deliberately minimal.
type Tile = "collaboration" | "service" | "open";

const tiles: { id: Tile; label: string; icon: LucideIcon }[] = [
  { id: "collaboration", label: "Collaboration", icon: Users },
  { id: "service", label: "Service", icon: Briefcase },
  { id: "open", label: "Open Block", icon: Megaphone },
];

export function NewBlockDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tile, setTile] = useState<Tile>("collaboration");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [invited, setInvited] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Track the visual viewport so the sheet covers exactly the area *above* the
  // on-screen keyboard. Header / scroll / footer then divide that area, which
  // docks the footer above the keyboard on every iPhone — no JS layout math
  // beyond reading the inset. Null on desktop / when VisualViewport is absent.
  const [vp, setVp] = useState<{ top: number; height: number } | null>(null);

  useEffect(
    () =>
      onUIEvent("wb:new-block", (detail) => {
        reset();
        if (detail?.handle) setInvited(detail.handle);
        if (detail?.type === "service") setTile("service");
        else setTile("collaboration");
        setOpen(true);
      }),
    []
  );

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const v = window.visualViewport;
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => {
      if (v && mq.matches) setVp({ top: v.offsetTop, height: v.height });
      else setVp(null);
    };
    apply();
    v?.addEventListener("resize", apply);
    v?.addEventListener("scroll", apply);
    mq.addEventListener("change", apply);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      v?.removeEventListener("resize", apply);
      v?.removeEventListener("scroll", apply);
      mq.removeEventListener("change", apply);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function reset() {
    setTile("collaboration");
    setTitle("");
    setMessage("");
    setInvited(null);
    setError(null);
    setSentTo(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  // A Block Request is only sent when starting a private/open collaboration WITH
  // someone; Service Blocks (and any block with no invitee) are created directly.
  const willSendRequest = !!invited && tile !== "service";

  function submit() {
    if (!title.trim()) return;
    setError(null);

    if (willSendRequest) {
      const recipient = invited!;
      startTransition(async () => {
        const res = await sendBlockRequestAction({
          recipientHandle: recipient,
          blockTitle: title.trim(),
          blockType: "collaboration",
          introMessage: message.trim() || "Let's collaborate.",
        });
        if (res.ok) setSentTo(recipient);
        else setError(res.error);
      });
      return;
    }

    const blockType: BlockType = tile === "service" ? "service" : "collaboration";
    startTransition(async () => {
      const res = await createBlockAction({
        title,
        tagline: message,
        kind: "Music",
        blockType,
        category:
          tile === "open"
            ? "Open Block"
            : tile === "collaboration"
            ? "Project"
            : undefined,
        price: null,
        visibility: "Public",
      });
      if (res.ok) {
        setOpen(false);
        reset();
        router.push(`/blocks/${res.slug}?type=${res.blockType}`);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[65]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-bg/60 backdrop-blur-md animate-fade-in"
      />

      {/* Viewport-bound layer: on mobile it's sized to the visible area above
          the keyboard (so the sheet's footer docks right above it); on desktop
          it's a top-anchored centered card. pointer-events pass through to the
          backdrop everywhere except the panel. */}
      <div
        className={cn(
          "pointer-events-none absolute left-0 right-0 flex justify-center px-0",
          "sm:items-start sm:px-4 sm:pt-[7vh]"
        )}
        style={
          vp
            ? { top: vp.top, height: vp.height }
            : { top: 0, height: "100dvh" }
        }
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="New Block"
          className={cn(
            "glass-overlay pointer-events-auto relative flex w-full flex-col overflow-hidden rounded-t-2xl shadow-pop animate-fade-up",
            "h-full sm:h-auto sm:max-h-[86vh] sm:max-w-[520px] sm:rounded-2xl"
          )}
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 pb-4 pt-5 sm:px-6">
            <h2 className="font-display text-xl tracking-tight text-ink sm:text-2xl">
              New Block
            </h2>
            <button
              onClick={close}
              aria-label="Close"
              className="-mr-1.5 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X size={15} />
            </button>
          </div>

          {/* Scrollable content — bottom padding clears the focused field above
              the keyboard and the safe-area inset. */}
          <div
            onFocusCapture={(e) => {
              const t = e.target as HTMLElement;
              if (t.matches("input, textarea")) {
                setTimeout(
                  () => t.scrollIntoView({ block: "center", behavior: "smooth" }),
                  80
                );
              }
            }}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5 pt-5 sm:px-6"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
          >
            {sentTo ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
                  <Check size={22} />
                </span>
                <p className="text-[14px] font-semibold text-ink">
                  Block Request sent to @{sentTo}
                </p>
                <p className="max-w-xs text-[12.5px] text-muted">
                  When they accept, your shared Block opens for both of you.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {invited && (
                  <div className="flex items-center gap-2 border-b border-line pb-4 text-[13px] text-ink">
                    <Users size={15} className="shrink-0 text-accent" />
                    <span>
                      Starting this Block with{" "}
                      <span className="font-semibold text-accent">
                        @{invited}
                      </span>
                    </span>
                  </div>
                )}

                <div>
                  <Label htmlFor="nb-title">Block Title</Label>
                  <Input
                    id="nb-title"
                    autoFocus
                    placeholder="e.g. Neon Rain — Single"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && title.trim()) submit();
                    }}
                  />
                  {title.trim() && (
                    <p className="mt-1.5 font-mono text-[11px] text-muted">
                      /blocks/{slugify(title)}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Block Type</Label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {tiles.map((t) => {
                      const Icon = t.icon;
                      const active = tile === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTile(t.id)}
                          className={cn(
                            "flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border px-1 py-4 transition-all duration-200",
                            active
                              ? "border-accent bg-accent/10"
                              : "border-line bg-surface hover:border-line-strong"
                          )}
                        >
                          <Icon
                            size={22}
                            strokeWidth={1.8}
                            className={active ? "text-accent" : "text-muted"}
                          />
                          <span
                            className={cn(
                              "max-w-full truncate text-[11.5px] leading-tight sm:text-[12.5px]",
                              active
                                ? "font-medium text-accent"
                                : "text-muted"
                            )}
                          >
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label htmlFor="nb-message">Message (optional)</Label>
                  <div className="relative">
                    <textarea
                      id="nb-message"
                      rows={4}
                      maxLength={250}
                      placeholder="Add a quick note..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2.5 text-[14px] text-ink placeholder:text-muted/70 transition-colors focus:border-accent/50 focus:outline-none"
                    />
                    <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-muted/70">
                      {message.length}/250
                    </span>
                  </div>
                </div>

                {willSendRequest && (
                  <p className="flex items-center gap-1.5 text-[12px] text-muted">
                    <Info size={13} className="shrink-0" />
                    They&apos;ll get a Block Request to accept.
                  </p>
                )}

                {error && (
                  <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sticky footer — single action, pinned above the keyboard + home
              indicator. */}
          <div
            className="flex shrink-0 items-center border-t border-line bg-surface-2/40 px-5 pt-3 sm:px-6"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {sentTo ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={close}
              >
                Done
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={submit}
                disabled={pending || !title.trim()}
              >
                {pending ? (
                  "Sending…"
                ) : (
                  <>
                    <Send size={14} />
                    {willSendRequest ? "Send Block Request" : "Create Block"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
