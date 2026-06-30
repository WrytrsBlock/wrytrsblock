"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Check,
  Info,
  Megaphone,
  Send,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
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

  return (
    <Dialog
      open={open}
      onClose={close}
      mobilePlacement="center"
      title="New Block"
      footer={
        sentTo ? (
          <Button variant="primary" size="lg" className="w-full" onClick={close}>
            Done
          </Button>
        ) : (
          <div className="w-full">
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
            {willSendRequest && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-muted">
                <Info size={13} className="shrink-0" />
                They&apos;ll get a Block Request to accept.
              </p>
            )}
          </div>
        )
      }
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
                <span className="font-semibold text-accent">@{invited}</span>
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
            <div className="grid grid-cols-3 gap-2">
              {tiles.map((t) => {
                const Icon = t.icon;
                const active = tile === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTile(t.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-xl border py-4 transition-all duration-200",
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
                        "text-[12.5px]",
                        active ? "font-medium text-accent" : "text-muted"
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

          {error && (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
