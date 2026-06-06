"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Check, PartyPopper, Plus, Send, Users } from "lucide-react";
import { Button, Input, Label } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { onUIEvent } from "@/lib/ui-events";
import { sendBlockRequestAction } from "@/app/actions/block-requests";
import { createBlockAction } from "@/app/actions/blocks";

type BType = "collaboration" | "service" | "block_party";
type ServiceMode = "hire" | "offer";

const TYPE_OPTIONS: {
  id: BType;
  label: string;
  desc: string;
  Icon: typeof Users;
  beta?: boolean;
}[] = [
  {
    id: "collaboration",
    label: "Collaboration Block",
    desc: "Build a creative project together",
    Icon: Users,
  },
  {
    id: "service",
    label: "Service Block",
    desc: "Hire a creator, or offer a service",
    Icon: Briefcase,
  },
  {
    id: "block_party",
    label: "Block Party",
    desc: "Host a live event — session, Q&A, workshop, livestream",
    Icon: PartyPopper,
    beta: true,
  },
];

const inputCls = "h-11 text-[14px]";
const textareaCls =
  "w-full rounded-lg bg-surface-2 border border-line text-ink text-[14px] leading-relaxed px-3 py-2.5 placeholder:text-muted/70 focus:outline-none focus:border-accent/50 focus:bg-surface transition-colors resize-none";
const helperCls = "mt-1.5 text-[11px] text-muted/70";

// Parse a loose money string ("$150", "150") into a number; 0 when empty/invalid.
const parseMoney = (s: string) => Number(s.replace(/[^0-9.]/g, "")) || 0;

// Field block — a labelled textarea with optional helper.
function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  rows = 3,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  helper?: string;
  rows?: number;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        autoFocus={autoFocus}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={textareaCls}
      />
      {helper && <p className={helperCls}>{helper}</p>}
    </div>
  );
}

// The Start Block modal. Each Block Type is its own workflow — distinct fields,
// copy, and CTA. Collaboration + "Hire a creator" send a Block Request; "Offer a
// service" and Block Party *create* a Block (a listing / an event) you own.
export function BlockRequestDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<{ handle: string; name: string } | null>(
    null
  );
  const [blockType, setBlockType] = useState<BType>("collaboration");
  const [serviceMode, setServiceMode] = useState<ServiceMode>("hire");

  // Collaboration
  const [collabTitle, setCollabTitle] = useState("");
  const [introMessage, setIntroMessage] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  // Service — Hire a creator
  const [hireTitle, setHireTitle] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  // Service — Offer a service
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [price, setPrice] = useState("");
  const [turnaround, setTurnaround] = useState("");
  const [revisions, setRevisions] = useState("");
  // Block Party
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [paid, setPaid] = useState(false);
  const [ticketPrice, setTicketPrice] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    return onUIEvent("wb:block-request", (detail) => {
      if (!detail) return;
      setTarget({ handle: detail.handle, name: detail.name });
      setBlockType("collaboration");
      setServiceMode("hire");
      setCollabTitle("");
      setIntroMessage("");
      setExpectedOutcome("");
      setHireTitle("");
      setProjectDetails("");
      setDeliverables("");
      setBudget("");
      setTimeline("");
      setServiceName("");
      setServiceDescription("");
      setPrice("");
      setTurnaround("");
      setRevisions("");
      setEventTitle("");
      setEventDescription("");
      setDate("");
      setTime("");
      setCapacity("");
      setPaid(false);
      setTicketPrice("");
      setError(null);
      setSent(false);
      setPending(false);
      setOpen(true);
    });
  }, []);

  function close() {
    if (pending) return;
    setOpen(false);
  }

  if (!open || !target) return null;
  const name = target.name;

  // Which concrete workflow is active?
  const isHire = blockType === "service" && serviceMode === "hire";
  const isOffer = blockType === "service" && serviceMode === "offer";
  const isParty = blockType === "block_party";
  // "Offer a service" and "Block Party" create a Block you own (no request).
  const isCreate = isOffer || isParty;

  const t = (s: string) => s.trim().length > 1;
  const canSubmit =
    blockType === "collaboration"
      ? t(collabTitle) && t(introMessage)
      : isHire
        ? t(hireTitle) && t(projectDetails)
        : isOffer
          ? t(serviceName) && t(serviceDescription)
          : t(eventTitle) && t(eventDescription);

  const cta =
    blockType === "collaboration"
      ? "Send Collaboration Request"
      : isHire
        ? "Request Service"
        : isOffer
          ? "Create Service Block"
          : "Create Block Party";

  const headerTitle = sent
    ? "Request sent"
    : blockType === "collaboration"
      ? `Start a Collaboration with ${name}`
      : isHire
        ? `Request a Service from ${name}`
        : isOffer
          ? "Offer a Service"
          : "Host a Block Party";

  const headerDesc = sent
    ? undefined
    : blockType === "collaboration"
      ? "Send a collaboration request — once accepted, your Block opens with chat."
      : isHire
        ? `Send ${name} a service request. They accept it to start the Block.`
        : isOffer
          ? "List a service others can book. This creates a Service Block you own."
          : "Host a live event — listening session, workshop, Q&A, livestream, or networking room.";

  async function submit() {
    if (!target || !canSubmit || pending) return;
    setPending(true);
    setError(null);
    try {
      if (blockType === "collaboration") {
        const res = await sendBlockRequestAction({
          recipientHandle: target.handle,
          blockTitle: collabTitle.trim(),
          blockType: "collaboration",
          introMessage: introMessage.trim(),
          expectedOutcome: expectedOutcome.trim() || undefined,
        });
        if (res.ok) {
          setSent(true);
          router.refresh();
        } else setError(res.error);
      } else if (isHire) {
        // Fold the structured fields into the request the recipient sees.
        let intro = projectDetails.trim();
        const extra: string[] = [];
        if (budget.trim()) extra.push(`Budget: ${budget.trim()}`);
        if (timeline.trim()) extra.push(`Timeline: ${timeline.trim()}`);
        if (extra.length) intro += `\n\n${extra.join("  ·  ")}`;
        const res = await sendBlockRequestAction({
          recipientHandle: target.handle,
          blockTitle: hireTitle.trim(),
          blockType: "service",
          introMessage: intro,
          expectedOutcome: deliverables.trim() || undefined,
        });
        if (res.ok) {
          setSent(true);
          router.refresh();
        } else setError(res.error);
      } else if (isOffer) {
        // Create a Service Block listing owned by the current user.
        const tagline = [
          serviceDescription.trim(),
          turnaround.trim() && `Turnaround: ${turnaround.trim()}`,
          revisions.trim() && `${revisions.trim()} revisions`,
        ]
          .filter(Boolean)
          .join(" · ");
        const p = parseMoney(price);
        const res = await createBlockAction({
          title: serviceName.trim(),
          tagline,
          blockType: "service",
          price: p > 0 ? p : null,
          visibility: "Public",
        });
        if (res.ok) {
          setOpen(false);
          router.push(`/blocks/${res.slug}?type=${res.blockType}`);
          router.refresh();
        } else setError(res.error);
      } else {
        // Block Party — create an event Block.
        const p = parseMoney(ticketPrice);
        const startsAt = date ? (time ? `${date}T${time}` : date) : "";
        const res = await createBlockAction({
          title: eventTitle.trim(),
          tagline: eventDescription.trim(),
          blockType: "block_party",
          price: paid && p > 0 ? p : null,
          visibility: "Public",
          party: {
            category: "Listening Session",
            startsAt,
            status: "upcoming",
            access: "public",
            capacity: capacity.trim() ? Number(capacity) : undefined,
            chatEnabled: true,
            interested: 0,
          },
        });
        if (res.ok) {
          setOpen(false);
          router.push(`/blocks/${res.slug}?type=${res.blockType}`);
          router.refresh();
        } else setError(res.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={headerTitle}
      description={headerDesc}
      footer={
        sent ? (
          <Button
            variant="primary"
            size="md"
            onClick={close}
            className="min-w-[120px] justify-center"
            style={{ color: "#FFFFFF" }}
          >
            Done
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="md" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={submit}
              disabled={!canSubmit || pending}
              className="min-w-[190px] justify-center gap-1.5"
              style={{ color: "#FFFFFF" }}
            >
              {pending ? (
                isCreate ? (
                  "Creating…"
                ) : (
                  "Sending…"
                )
              ) : (
                <>
                  {isCreate ? <Plus size={14} /> : <Send size={14} />} {cta}
                </>
              )}
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <div className="py-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success">
            <Check size={22} strokeWidth={2.5} />
          </div>
          <p className="mt-4 text-[14px] text-ink font-medium">
            Your {isHire ? "service request" : "collaboration request"} was sent
            to {name}.
          </p>
          <p className="mt-1.5 text-[12.5px] text-muted max-w-sm mx-auto leading-relaxed">
            {name} will get a notification to accept or decline. If they accept,
            the Block opens with chat so you can get started together.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Block Type — pick the workflow first; everything below adapts */}
          <div>
            <Label>Block Type</Label>
            <div className="space-y-2">
              {TYPE_OPTIONS.map(({ id, label, desc, Icon, beta }) => {
                const active = blockType === id;
                const party = id === "block_party";
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setBlockType(id)}
                    aria-pressed={active}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      active
                        ? party
                          ? "border-warning/50 bg-warning/10"
                          : "border-accent/50 bg-accent/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        active
                          ? party
                            ? "bg-warning/15 text-warning"
                            : "bg-accent/15 text-accent"
                          : "bg-white/[0.05] text-muted"
                      )}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-[13px] font-semibold",
                            active ? "text-ink" : "text-ink/85"
                          )}
                        >
                          {label}
                        </span>
                        {beta && (
                          <span className="inline-flex items-center h-4 px-1.5 rounded-full bg-warning/15 border border-warning/30 text-warning text-[9px] font-bold uppercase tracking-wide">
                            Beta
                          </span>
                        )}
                      </span>
                      <span className="block text-[11px] text-muted leading-snug mt-0.5">
                        {desc}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "h-4 w-4 shrink-0 rounded-full border flex items-center justify-center",
                        active
                          ? party
                            ? "border-warning bg-warning"
                            : "border-accent bg-accent"
                          : "border-line"
                      )}
                    >
                      {active && (
                        <Check size={10} className="text-white" strokeWidth={3} />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Collaboration Block — request a collaboration ── */}
          {blockType === "collaboration" && (
            <>
              <div>
                <Label>Block Title</Label>
                <Input
                  autoFocus
                  value={collabTitle}
                  onChange={(e) => setCollabTitle(e.target.value)}
                  placeholder="e.g. Summer EP — looking for a vocalist"
                  className={inputCls}
                />
              </div>
              <TextareaField
                label="Intro Message"
                value={introMessage}
                onChange={setIntroMessage}
                rows={4}
                placeholder="Hi! I'm building a warm, cinematic EP and I'd love your voice on two tracks — here's the vibe and what I'm going for…"
                helper="Introduce yourself and the project you want to build together."
              />
              <TextareaField
                label="Expected Outcome"
                value={expectedOutcome}
                onChange={setExpectedOutcome}
                rows={2}
                placeholder="e.g. A finished, mixed 3-track EP we both release and split."
                helper="What does a successful collaboration look like? (optional)"
              />
            </>
          )}

          {/* ── Service Block — choose hire vs offer first ── */}
          {blockType === "service" && (
            <div>
              <Label>What would you like to do?</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: "hire" as const,
                    title: "Hire A Creator",
                    desc: "Pay a creator to do work",
                  },
                  {
                    id: "offer" as const,
                    title: "Offer A Service",
                    desc: "List a service you provide",
                  },
                ].map((o) => {
                  const active = serviceMode === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setServiceMode(o.id)}
                      aria-pressed={active}
                      className={cn(
                        "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-colors",
                        active
                          ? "border-accent/50 bg-accent/10"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[13px] font-semibold",
                          active ? "text-accent" : "text-ink/85"
                        )}
                      >
                        {o.title}
                      </span>
                      <span className="text-[11px] text-muted leading-snug">
                        {o.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Service — Hire A Creator (sends a request) ── */}
          {isHire && (
            <>
              <div>
                <Label>Service Request Title</Label>
                <Input
                  value={hireTitle}
                  onChange={(e) => setHireTitle(e.target.value)}
                  placeholder="e.g. Mix & master a 3-track single"
                  className={inputCls}
                />
              </div>
              <TextareaField
                label="Project Details"
                value={projectDetails}
                onChange={setProjectDetails}
                rows={4}
                placeholder="What you need done, source files, references and specs. e.g. 3 stems-ready songs, modern pop master, reference track attached…"
                helper="Describe the work you're hiring for and what you'll provide."
              />
              <TextareaField
                label="Deliverables"
                value={deliverables}
                onChange={setDeliverables}
                rows={2}
                placeholder="e.g. Final mixed + mastered WAVs, stems, and 2 rounds of revisions."
                helper="What should be delivered when the work is done?"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Budget</Label>
                  <Input
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. $300"
                  />
                </div>
                <div>
                  <Label>Timeline</Label>
                  <Input
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g. 2 weeks"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Service — Offer A Service (creates a listing) ── */}
          {isOffer && (
            <>
              <div>
                <Label>Service Name</Label>
                <Input
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. Mixing & Mastering — per track"
                  className={inputCls}
                />
              </div>
              <TextareaField
                label="Service Description"
                value={serviceDescription}
                onChange={setServiceDescription}
                rows={4}
                placeholder="What's included, your process, and what the client gets. e.g. Radio-ready masters from your stems, one revision round, 48-hour turnaround…"
                helper="Describe exactly what buyers receive."
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Price</Label>
                  <Input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. $150"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <Label>Turnaround Time</Label>
                  <Input
                    value={turnaround}
                    onChange={(e) => setTurnaround(e.target.value)}
                    placeholder="e.g. 3 days"
                  />
                </div>
              </div>
              <div>
                <Label>Revisions Included</Label>
                <Input
                  value={revisions}
                  onChange={(e) => setRevisions(e.target.value)}
                  placeholder="e.g. 2 (or Unlimited)"
                />
              </div>
            </>
          )}

          {/* ── Block Party — create an event ── */}
          {isParty && (
            <>
              <div>
                <Label>Event Title</Label>
                <Input
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Friday Night Listening Party"
                  className={inputCls}
                />
              </div>
              <TextareaField
                label="Description"
                value={eventDescription}
                onChange={setEventDescription}
                rows={4}
                placeholder="What's the event? e.g. a live listening session for my new project with a Q&A and feedback round, plus networking after…"
                helper="Tell people what to expect and why they should come."
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <Label>Capacity</Label>
                <Input
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 50 (leave blank for unlimited)"
                  inputMode="numeric"
                />
              </div>
              <div>
                <Label>Free or Paid</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: false, label: "Free" },
                    { v: true, label: "Paid" },
                  ].map(({ v, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setPaid(v)}
                      className={cn(
                        "h-10 rounded-lg border text-[13px] font-medium transition-colors",
                        paid === v
                          ? "border-warning/50 bg-warning/10 text-warning"
                          : "border-white/10 bg-white/[0.03] text-muted hover:text-ink hover:border-white/20"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {paid && (
                <div>
                  <Label>Ticket Price</Label>
                  <Input
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="e.g. $10"
                    inputMode="decimal"
                  />
                </div>
              )}
            </>
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
