"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Film,
  Music,
  Newspaper,
  Radio,
  Tv,
  Users,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button, Input, Label } from "@/components/ui/primitives";
import { cn, slugify } from "@/lib/cn";
import { onUIEvent } from "@/lib/ui-events";
import { createBlockAction } from "@/app/actions/blocks";
import type { BlockKind, BlockType } from "@/types";

const kinds: { id: BlockKind; label: string; icon: typeof Film }[] = [
  { id: "Music", label: "Music", icon: Music },
  { id: "Audio Drama", label: "Audio", icon: Radio },
  { id: "Film", label: "Film", icon: Film },
  { id: "Series", label: "Series", icon: Tv },
  { id: "Editorial", label: "Editorial", icon: Newspaper },
];

export function NewBlockDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"type" | "details">("type");
  const [blockType, setBlockType] = useState<BlockType | null>(null);
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [kind, setKind] = useState<BlockKind>("Music");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(
    () =>
      onUIEvent("wb:new-block", (detail) => {
        reset();
        if (detail?.type) {
          setBlockType(detail.type);
          setStep("details");
        }
        setOpen(true);
      }),
    []
  );

  function reset() {
    setStep("type");
    setBlockType(null);
    setTitle("");
    setTagline("");
    setKind("Music");
    setError(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  function chooseType(t: BlockType) {
    setBlockType(t);
    setStep("details");
  }

  function submit() {
    if (!blockType) return;
    const type = blockType; // capture non-null for the async closure
    setError(null);
    startTransition(async () => {
      const res = await createBlockAction({
        title,
        tagline,
        kind,
        blockType: type,
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

  const isCollab = blockType === "collaboration";

  return (
    <Dialog
      open={open}
      onClose={close}
      title={step === "type" ? "Create a Block" : isCollab ? "New Collaboration Block" : "New Service Block"}
      description={
        step === "type"
          ? "Every opportunity on WrytrsBlock is a Block. What are you starting?"
          : isCollab
          ? "Recruit collaborators and complete a creative project together."
          : "Offer a service and deliver completed work through the Block."
      }
      footer={
        step === "details" ? (
          <>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setStep("type")}
              disabled={pending}
            >
              <ArrowLeft size={13} /> Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={submit}
              disabled={pending || !title.trim()}
            >
              {pending ? "Creating…" : "Create Block"}
              <ArrowRight size={13} />
            </Button>
          </>
        ) : undefined
      }
    >
      {step === "type" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => chooseType("collaboration")}
            className="text-left p-5 rounded-2xl border border-line bg-surface hover:border-accent/50 hover:shadow-glow transition-all duration-200 group"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 border border-line text-accent">
              <Users size={20} strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 text-[15px] font-semibold text-ink tracking-tight">
              Collaboration Block
            </h3>
            <p className="mt-1 text-[12px] text-muted leading-relaxed">
              I need talent for a project.
            </p>
            <p className="mt-3 text-[11px] text-muted/80 leading-relaxed">
              Recruit songwriters, producers, vocalists, videographers — build a
              team and finish the work.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium text-accent group-hover:gap-1.5 transition-all">
              Choose <ArrowRight size={11} />
            </span>
          </button>

          <button
            onClick={() => chooseType("service")}
            className="text-left p-5 rounded-2xl border border-line bg-surface hover:border-accent/50 hover:shadow-glow transition-all duration-200 group"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 border border-line text-accent">
              <Briefcase size={20} strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 text-[15px] font-semibold text-ink tracking-tight">
              Service Block
            </h3>
            <p className="mt-1 text-[12px] text-muted leading-relaxed">
              I am offering a service.
            </p>
            <p className="mt-3 text-[11px] text-muted/80 leading-relaxed">
              Sell mixing, mastering, songwriting, design, editing — and deliver
              completed work through the Block.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium text-accent group-hover:gap-1.5 transition-all">
              Choose <ArrowRight size={11} />
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="nb-title">
              {isCollab ? "Project title" : "Service title"}
            </Label>
            <Input
              id="nb-title"
              autoFocus
              placeholder={isCollab ? "Neon Rain — Single" : "Mix & Master — Singles"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim()) submit();
              }}
            />
            {title.trim() && (
              <p className="mt-1.5 text-[11px] text-muted font-mono">
                /blocks/{slugify(title)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="nb-tagline">
              {isCollab ? "What do you need?" : "One-line pitch"}
            </Label>
            <Input
              id="nb-tagline"
              placeholder={
                isCollab
                  ? "Need a producer and vocalist for an indie pop single."
                  : "Radio-ready mixes and masters, 5–7 day turnaround."
              }
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>

          <div>
            <Label>Category</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {kinds.map((k) => {
                const Icon = k.icon;
                const active = kind === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-200",
                      active
                        ? "border-accent/50 bg-accent/10 shadow-glow"
                        : "border-line bg-surface hover:border-line-strong"
                    )}
                  >
                    <Icon
                      size={16}
                      className={active ? "text-accent" : "text-muted"}
                      strokeWidth={1.75}
                    />
                    <span
                      className={cn(
                        "text-[10px] leading-tight text-center",
                        active ? "text-ink font-medium" : "text-muted"
                      )}
                    >
                      {k.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
