"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CalendarClock,
  Check,
  CreditCard,
  DollarSign,
  Disc3,
  Film,
  Globe,
  Layers,
  Lock,
  Megaphone,
  MessageSquare,
  Music,
  Newspaper,
  PartyPopper,
  Radio,
  Sparkles,
  Tv,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button, Input, Label } from "@/components/ui/primitives";
import { cn, slugify } from "@/lib/cn";
import { onUIEvent } from "@/lib/ui-events";
import { createBlockAction } from "@/app/actions/blocks";
import { BLOCK_VISIBILITIES } from "@/types";
import type {
  BlockCategory,
  BlockKind,
  BlockType,
  BlockVisibility,
} from "@/types";
import {
  BLOCK_PARTY_CATEGORIES,
  type BlockPartyCategory,
} from "@/lib/mock";

// Service Blocks pick a format (medium).
const kinds: { id: BlockKind; label: string; icon: LucideIcon }[] = [
  { id: "Music", label: "Music", icon: Music },
  { id: "Audio Drama", label: "Audio", icon: Radio },
  { id: "Film", label: "Film", icon: Film },
  { id: "Series", label: "Series", icon: Tv },
  { id: "Editorial", label: "Editorial", icon: Newspaper },
];

// Collaboration Blocks pick a category — the prototype's collaboration types.
const categories: { id: BlockCategory; label: string; icon: LucideIcon }[] = [
  { id: "Song", label: "Song", icon: Music },
  { id: "Beat", label: "Beat", icon: Disc3 },
  { id: "Project", label: "Project", icon: Layers },
  { id: "Open Block", label: "Open Block", icon: Megaphone },
  { id: "Community", label: "Community", icon: Users },
];

// The three things you can start. Each row carries its own identity colour,
// used for the icon tile, the CTA pill, and the arrow.
const blockOptions: {
  type: BlockType;
  icon: LucideIcon;
  color: string;
  title: string;
  sub: string;
  cta: string;
  beta?: boolean;
}[] = [
  {
    type: "collaboration",
    icon: Users,
    color: "#2F6BFF",
    title: "Collaboration Block",
    sub: "Find talent for a project.",
    cta: "Build your team",
  },
  {
    type: "service",
    icon: Briefcase,
    color: "#16A34A",
    title: "Service Block",
    sub: "Offer your creative service.",
    cta: "Get paid for your skills",
  },
  {
    type: "block_party",
    icon: PartyPopper,
    color: "#F97316",
    title: "Block Party",
    sub: "Host a session, event, or room.",
    cta: "Bring creators together",
    beta: true,
  },
];

export function NewBlockDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"type" | "details">("type");
  const [showHelp, setShowHelp] = useState(false);
  const [blockType, setBlockType] = useState<BlockType | null>(null);
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [kind, setKind] = useState<BlockKind>("Music");
  const [category, setCategory] = useState<BlockCategory>("Project");
  const [invited, setInvited] = useState<string | null>(null);
  const [monetize, setMonetize] = useState(false);
  const [price, setPrice] = useState("");
  const [stripeConnected, setStripeConnected] = useState(false);
  const [paypalConnected, setPaypalConnected] = useState(false);
  const [visibility, setVisibility] = useState<BlockVisibility>("Public");
  // Block Party (event) fields
  const [partyCategory, setPartyCategory] =
    useState<BlockPartyCategory>("Livestream");
  const [partyDate, setPartyDate] = useState("");
  const [partyPaid, setPartyPaid] = useState(false);
  const [partyAccess, setPartyAccess] = useState<"public" | "invite">("public");
  const [partyCapacity, setPartyCapacity] = useState("");
  const [partyLivestream, setPartyLivestream] = useState("");
  const [partyChat, setPartyChat] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(
    () =>
      onUIEvent("wb:new-block", (detail) => {
        reset();
        if (detail?.handle) setInvited(detail.handle);
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
    setShowHelp(false);
    setBlockType(null);
    setTitle("");
    setTagline("");
    setKind("Music");
    setCategory("Project");
    setInvited(null);
    setMonetize(false);
    setPrice("");
    setStripeConnected(false);
    setPaypalConnected(false);
    setVisibility("Public");
    setPartyCategory("Livestream");
    setPartyDate("");
    setPartyPaid(false);
    setPartyAccess("public");
    setPartyCapacity("");
    setPartyLivestream("");
    setPartyChat(true);
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
      const isPartyType = type === "block_party";
      const priceNum = Number(price);
      const entryPaid = isPartyType ? partyPaid : monetize;
      const res = await createBlockAction({
        title,
        tagline,
        kind,
        blockType: type,
        inviteHandle: invited ?? undefined,
        category: type === "collaboration" ? category : undefined,
        price: entryPaid && priceNum > 0 ? priceNum : null,
        visibility: isPartyType
          ? partyAccess === "invite"
            ? "By Invite"
            : "Public"
          : monetize
          ? visibility
          : "Public",
        party: isPartyType
          ? {
              category: partyCategory,
              startsAt: partyDate,
              status: "upcoming",
              access: partyAccess,
              capacity: partyCapacity ? Number(partyCapacity) : undefined,
              chatEnabled: partyChat,
              livestreamUrl: partyLivestream || undefined,
              interested: 0,
            }
          : undefined,
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
  const isParty = blockType === "block_party";

  const detailsTitle = isParty
    ? "New Block Party"
    : isCollab
    ? "New Collaboration Block"
    : "New Service Block";
  const detailsDesc = isParty
    ? "Promote an event, go live, and gather your audience in the room."
    : isCollab
    ? "Recruit collaborators and complete a creative project together."
    : "Offer a service and deliver completed work through the Block.";

  return (
    <Dialog
      open={open}
      onClose={close}
      title={step === "type" ? "Create a Block" : detailsTitle}
      description={
        step === "type"
          ? "Every opportunity on WrytrsBlock is a Block. What are you starting?"
          : detailsDesc
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
              disabled={pending || !title.trim() || (isParty && !partyDate)}
            >
              {pending
                ? "Saving…"
                : isParty
                ? "Publish Block Party"
                : "Create Block"}
              <ArrowRight size={13} />
            </Button>
          </>
        ) : undefined
      }
    >
      {step === "type" ? (
        <div>
          <div className="divide-y divide-line">
            {blockOptions.map((o) => {
              const Icon = o.icon;
              return (
                <button
                  key={o.type}
                  onClick={() => chooseType(o.type)}
                  className="group flex w-full items-center gap-4 py-4 text-left first:pt-1"
                >
                  <span
                    className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform duration-200 group-hover:scale-[1.04] group-active:scale-95"
                    style={{ backgroundColor: o.color }}
                  >
                    <Icon size={28} strokeWidth={1.9} className="text-white" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 text-[18px] font-semibold tracking-tight text-ink">
                      {o.title}
                      {o.beta && (
                        <span
                          className="inline-flex h-[18px] items-center rounded-full border px-2 text-[9.5px] font-bold uppercase tracking-wide"
                          style={{
                            color: o.color,
                            borderColor: `${o.color}66`,
                          }}
                        >
                          Beta
                        </span>
                      )}
                    </h3>
                    <p className="mt-0.5 text-[13.5px] leading-snug text-muted">
                      {o.sub}
                    </p>
                    <span
                      className="mt-2.5 inline-flex items-center rounded-full border px-3 py-1 text-[12.5px] font-medium"
                      style={{ color: o.color, borderColor: `${o.color}59` }}
                    >
                      {o.cta}
                    </span>
                  </div>

                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2/60 transition-all duration-200 group-hover:translate-x-0.5"
                    style={{ color: o.color }}
                  >
                    <ArrowRight size={18} />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Reassurance / help — Blocks aren't a one-time choice. */}
          <div className="mt-5 rounded-2xl border border-line bg-surface-2/40 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Sparkles
                size={20}
                strokeWidth={1.9}
                className="shrink-0 text-[#A78BFA]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold tracking-tight text-ink">
                  Not sure which to choose?
                </p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
                  You can always create more Blocks later.
                </p>
              </div>
              <button
                onClick={() => setShowHelp((v) => !v)}
                className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-[#A78BFA] transition-colors hover:text-ink"
                aria-expanded={showHelp}
              >
                Learn more
                <ArrowRight
                  size={13}
                  className={cn(
                    "transition-transform duration-200",
                    showHelp && "rotate-90"
                  )}
                />
              </button>
            </div>
            {showHelp && (
              <div className="mt-3 space-y-2 border-t border-line pt-3 text-[12.5px] leading-relaxed text-muted">
                <p>
                  <span className="font-medium text-ink">
                    Collaboration Block
                  </span>{" "}
                  — recruit creators and finish a project together.
                </p>
                <p>
                  <span className="font-medium text-ink">Service Block</span> —
                  sell a service and deliver the work through the Block.
                </p>
                <p>
                  <span className="font-medium text-ink">Block Party</span> —
                  host a live session, event, or room and gather your audience.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {invited && isCollab && (
            <div className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5">
              <Users size={14} className="text-accent shrink-0" />
              <p className="text-[12.5px] text-ink">
                Starting this Block with{" "}
                <span className="font-semibold text-accent">@{invited}</span> —
                they&apos;ll be invited to collaborate.
              </p>
            </div>
          )}
          <div>
            <Label htmlFor="nb-title">
              {isParty ? "Block Party title" : "Block Title"}
            </Label>
            <Input
              id="nb-title"
              autoFocus
              placeholder={
                isParty
                  ? "Neon Rain — Listening Party"
                  : isCollab
                  ? "Neon Rain — Single"
                  : "Mix & Master — Singles"
              }
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
              {isParty
                ? "Description"
                : isCollab
                ? "What do you need?"
                : "One-line pitch"}
            </Label>
            <Input
              id="nb-tagline"
              placeholder={
                isParty
                  ? "First listen of the new single, live with the whole room."
                  : isCollab
                  ? "Need a producer and vocalist for an indie pop single."
                  : "Radio-ready mixes and masters, 5–7 day turnaround."
              }
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>

          {isParty && (
            <div className="space-y-4">
              {/* Date & time */}
              <div>
                <Label htmlFor="bp-date">Date &amp; time</Label>
                <div className="relative">
                  <CalendarClock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                  />
                  <input
                    id="bp-date"
                    type="datetime-local"
                    value={partyDate}
                    onChange={(e) => setPartyDate(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface border border-line text-ink text-[14px] focus:outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <Label>Category</Label>
                <div className="flex flex-wrap gap-1.5">
                  {BLOCK_PARTY_CATEGORIES.map((c) => {
                    const active = partyCategory === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPartyCategory(c)}
                        className={cn(
                          "h-8 px-3 rounded-full border text-[12px] transition-all duration-200",
                          active
                            ? "border-accent/50 bg-accent/10 text-accent font-medium"
                            : "border-line bg-surface text-muted hover:text-ink hover:border-line-strong"
                        )}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Entry — free / paid */}
              <div>
                <Label>Entry</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPartyPaid(false)}
                    className={cn(
                      "h-9 rounded-lg border text-[12.5px] font-medium transition-all",
                      !partyPaid
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-line bg-surface text-muted hover:text-ink"
                    )}
                  >
                    Free
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartyPaid(true)}
                    className={cn(
                      "h-9 rounded-lg border text-[12.5px] font-medium transition-all",
                      partyPaid
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-line bg-surface text-muted hover:text-ink"
                    )}
                  >
                    Paid
                  </button>
                </div>
                {partyPaid && (
                  <div className="relative mt-2">
                    <DollarSign
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Entry price"
                      className="w-full h-10 pl-8 pr-20 rounded-lg bg-surface border border-line text-ink text-[14px] placeholder:text-muted/70 focus:outline-none focus:border-accent/50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted">
                      per person
                    </span>
                  </div>
                )}
              </div>

              {/* Access */}
              <div>
                <Label>Access</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPartyAccess("public")}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border text-[12.5px] font-medium transition-all",
                      partyAccess === "public"
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-line bg-surface text-muted hover:text-ink"
                    )}
                  >
                    <Globe size={13} /> Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartyAccess("invite")}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border text-[12.5px] font-medium transition-all",
                      partyAccess === "invite"
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-line bg-surface text-muted hover:text-ink"
                    )}
                  >
                    <Lock size={13} /> Invite-only
                  </button>
                </div>
              </div>

              {/* Capacity + livestream */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="bp-cap">Capacity</Label>
                  <Input
                    id="bp-cap"
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={partyCapacity}
                    onChange={(e) => setPartyCapacity(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bp-live">Livestream link</Label>
                  <Input
                    id="bp-live"
                    placeholder="Optional URL"
                    value={partyLivestream}
                    onChange={(e) => setPartyLivestream(e.target.value)}
                  />
                </div>
              </div>

              {/* Chat toggle */}
              <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare size={15} className="text-accent shrink-0" />
                    <p className="text-[12.5px] font-medium text-ink">
                      Live chat
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={partyChat}
                    aria-label="Live chat"
                    onClick={() => setPartyChat((c) => !c)}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      partyChat ? "bg-grad-accent" : "bg-surface-3 border border-line"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-soft transition-transform",
                        partyChat ? "translate-x-[18px]" : ""
                      )}
                    />
                  </button>
                </div>
                <p className="mt-1.5 pl-[25px] text-[10.5px] text-muted">
                  Let people talk during the party.
                </p>
              </div>

              <p className="text-[10.5px] text-muted">
                Cover image, the in-app live room, and guest invites are added
                after you publish.
              </p>
            </div>
          )}

          {isCollab ? (
            <div>
              <Label>Category</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {categories.map((c) => {
                  const Icon = c.icon;
                  const active = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border transition-all duration-200",
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
                          "text-[9.5px] leading-tight text-center",
                          active ? "text-ink font-medium" : "text-muted"
                        )}
                      >
                        {c.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : isParty ? null : (
            <div>
              <Label>Format</Label>
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
          )}

          {/* Monetize — collaboration / service (Block Parties price entry above) */}
          {!isParty && (
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-ink">
                Monetize this Block
              </p>
              <button
                type="button"
                role="switch"
                aria-checked={monetize}
                aria-label="Monetize this Block"
                onClick={() => setMonetize((m) => !m)}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  monetize ? "bg-grad-accent" : "bg-surface-3 border border-line"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-soft transition-transform",
                    monetize ? "translate-x-[18px]" : ""
                  )}
                />
              </button>
            </div>
            <p className="text-[11px] text-muted mt-1.5">
              Charge a one-time price to access or join.
            </p>

            {monetize && (
              <div className="mt-3.5 space-y-3">
                {/* Price */}
                <div className="relative">
                  <DollarSign
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Set a price"
                    className="w-full h-10 pl-8 pr-16 rounded-lg bg-surface border border-line text-ink text-[14px] placeholder:text-muted/70 focus:outline-none focus:border-accent/50 transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted">
                    one-time
                  </span>
                </div>

                {/* Connect Stripe / PayPal */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStripeConnected((s) => !s)}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 h-10 rounded-lg text-[12.5px] font-medium border transition-colors",
                      stripeConnected
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-line bg-surface hover:border-line-strong text-ink"
                    )}
                  >
                    {stripeConnected ? (
                      <>
                        <Check size={14} /> Stripe
                      </>
                    ) : (
                      <>
                        <CreditCard size={14} /> Connect Stripe
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaypalConnected((s) => !s)}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 h-10 rounded-lg text-[12.5px] font-medium border transition-colors",
                      paypalConnected
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-line bg-surface hover:border-line-strong text-ink"
                    )}
                  >
                    {paypalConnected ? (
                      <>
                        <Check size={14} /> PayPal
                      </>
                    ) : (
                      <>
                        <Wallet size={14} /> Connect PayPal
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10.5px] text-muted">
                  Subscriptions, tips & pay-to-join coming soon.
                </p>

                {/* Visibility */}
                <div>
                  <Label>Visibility</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BLOCK_VISIBILITIES.map((v) => {
                      const active = visibility === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVisibility(v)}
                          className={cn(
                            "h-9 px-3 rounded-lg border text-[12px] transition-all duration-200",
                            active
                              ? "border-accent/50 bg-accent/10 text-accent font-medium"
                              : "border-line bg-surface text-muted hover:text-ink hover:border-line-strong"
                          )}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

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
