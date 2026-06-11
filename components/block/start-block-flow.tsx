"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  acceptBlockRequestAction,
  declineBlockRequestAction,
  sendBlockRequestAction,
} from "@/app/actions/block-requests";
import type { BlockRelationship } from "@/lib/data";

type Person = { name: string; avatar?: string };

// The full Start Block experience on a creator profile. Drives every state so a
// first-time user always knows what happened and what's next:
//   none → "Start Block" (modal) → "Block Request Sent" (pending) success state
//   incoming → Accept / Decline
//   active → Open Block (the collaboration hub)
export function StartBlockFlow({
  handle,
  name,
  avatar,
  myName,
  myAvatar,
  relationship,
}: {
  handle: string;
  name: string;
  avatar?: string;
  myName: string;
  myAvatar?: string;
  relationship: BlockRelationship;
}) {
  const router = useRouter();
  const [view, setView] = useState<BlockRelationship["status"]>(
    relationship.status
  );
  const requestId =
    relationship.status === "incoming" ? relationship.requestId : "";
  const activeSlug = relationship.status === "active" ? relationship.slug : "";

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`Collab with ${name}`);
  const [intro, setIntro] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const me: Person = { name: myName, avatar: myAvatar };
  const them: Person = { name, avatar };

  if (view === "self") return null;

  // ── Active Block — collaboration is live ──────────────────────────────────
  if (view === "active") {
    return (
      <div className="flex flex-wrap items-center gap-2.5">
        <StatusPill tone="green" label="Active Block" />
        {activeSlug ? (
          <Link href={`/blocks/${activeSlug}`}>
            <Button variant="primary" size="lg" style={{ color: "#FFFFFF" }}>
              Open Block <ArrowUpRight size={14} />
            </Button>
          </Link>
        ) : (
          <Link href="/blocks">
            <Button variant="outline" size="lg">
              View Blocks
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // ── Incoming request — they asked to collaborate with you ─────────────────
  if (view === "incoming") {
    const accept = async () => {
      setBusy(true);
      setError(null);
      const res = await acceptBlockRequestAction(requestId);
      setBusy(false);
      if (res.ok) {
        router.push(`/blocks/${res.slug}`);
        router.refresh();
      } else setError(res.error);
    };
    const decline = async () => {
      setBusy(true);
      setError(null);
      const res = await declineBlockRequestAction(requestId);
      setBusy(false);
      if (res.ok) {
        setView("none");
        router.refresh();
      } else setError(res.error);
    };
    return (
      <div className="max-w-md space-y-2.5 rounded-2xl border border-warning/30 bg-warning/[0.06] p-4">
        <p className="text-[13.5px] font-semibold text-ink">
          {name} wants to start a Block with you
        </p>
        <Participants a={them} b={me} status="Pending acceptance" />
        <div className="flex gap-2 pt-1">
          <Button
            variant="primary"
            size="lg"
            onClick={accept}
            disabled={busy}
            style={{ color: "#FFFFFF" }}
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}{" "}
            Accept
          </Button>
          <Button variant="outline" size="lg" onClick={decline} disabled={busy}>
            <X size={14} /> Decline
          </Button>
        </div>
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    );
  }

  // ── Request sent — the success / pending state ────────────────────────────
  if (view === "request_sent") {
    return (
      <div className="max-w-md rounded-2xl border border-warning/30 bg-warning/[0.06] p-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success/20 text-success">
            <Check size={13} />
          </span>
          <p className="text-[14px] font-semibold text-ink">
            Block Request Sent
          </p>
        </div>
        <p className="mt-1 text-[12.5px] text-muted">
          Request sent to{" "}
          <span className="font-medium text-ink">{name}</span>. Waiting for
          response.
        </p>
        <div className="mt-3">
          <Participants a={me} b={them} status="Pending acceptance" />
        </div>
      </div>
    );
  }

  // ── No relationship — Start Block ─────────────────────────────────────────
  const send = async () => {
    setBusy(true);
    setError(null);
    const res = await sendBlockRequestAction({
      recipientHandle: handle,
      blockTitle: title.trim() || `Collab with ${name}`,
      blockType: "collaboration",
      introMessage:
        intro.trim() || `Hey ${name}, I'd love to start a Block together.`,
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      setView("request_sent");
      router.refresh();
    } else setError(res.error);
  };

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        onClick={() => setOpen(true)}
        className="text-[#FFFFFF] [&_svg]:text-[#FFFFFF]"
        style={{ color: "#FFFFFF" }}
      >
        <Plus size={14} /> Start Block
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-up"
          onClick={() => !busy && setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/12 bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h3 className="text-[15px] font-semibold text-ink">
                Start a Block with {name}
              </h3>
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                aria-label="Close"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <Participants a={me} b={them} status="They'll get a request" />

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Block title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Collab with ${name}`}
                  className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Intro message
                </label>
                <textarea
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  rows={3}
                  placeholder={`Tell ${name} what you have in mind…`}
                  className="w-full resize-none rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none"
                />
              </div>
              {error && <p className="text-[12px] text-danger">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                className="h-9 rounded-lg px-4 text-[13px] font-medium text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={send}
                disabled={busy}
                style={{ color: "#FFFFFF" }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-[13px] font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                Send Block Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Participants visual: [A] + [B] · status ──────────────────────────────────
function Participants({
  a,
  b,
  status,
}: {
  a: Person;
  b: Person;
  status?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <PersonChip person={a} />
      <span className="text-[15px] font-semibold text-muted">+</span>
      <PersonChip person={b} />
      {status && (
        <span className="ml-1 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-warning">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          {status}
        </span>
      )}
    </div>
  );
}

function PersonChip({ person }: { person: Person }) {
  const real = person.avatar && !person.avatar.includes("dicebear");
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 py-1 pl-1 pr-3">
      {real ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.avatar}
          alt=""
          className="h-6 w-6 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-[11px] font-bold text-accent">
          {person.name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="text-[12px] font-medium text-ink">{person.name}</span>
    </span>
  );
}

function StatusPill({
  tone,
  label,
}: {
  tone: "yellow" | "green" | "red";
  label: string;
}) {
  const tones = {
    yellow: "border-warning/40 bg-warning/15 text-warning",
    green: "border-success/40 bg-success/15 text-success",
    red: "border-danger/40 bg-danger/15 text-danger",
  };
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold",
        tones[tone]
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "yellow" && "bg-warning",
          tone === "green" && "bg-success",
          tone === "red" && "bg-danger"
        )}
      />
      {label}
    </span>
  );
}
