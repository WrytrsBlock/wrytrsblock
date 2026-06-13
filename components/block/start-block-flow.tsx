"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Loader2, Plus, Send, X } from "lucide-react";
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
        <span className="lg-pill lg-pill-g">
          <span className="h-[5px] w-[5px] rounded-full bg-[#2BC48A]" />
          Active Block
        </span>
        {activeSlug ? (
          <Link
            href={`/blocks/${activeSlug}`}
            className="lg-btn lg-btn-p"
            style={{ color: "#FFFFFF" }}
          >
            Open Block <ArrowUpRight size={14} />
          </Link>
        ) : (
          <Link href="/blocks" className="lg-btn">
            View Blocks
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
      <div
        className="lg-glass max-w-md space-y-2.5 p-4"
        style={{ borderColor: "rgba(232,180,58,0.4)" }}
      >
        <p className="text-[13.5px] font-semibold text-white">
          {name} wants to start a Block with you
        </p>
        <Participants a={them} b={me} status="Pending acceptance" />
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={accept}
            disabled={busy}
            className="lg-btn lg-btn-p"
            style={{ color: "#FFFFFF" }}
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}{" "}
            Accept
          </button>
          <button
            type="button"
            onClick={decline}
            disabled={busy}
            className="lg-btn"
          >
            <X size={14} /> Decline
          </button>
        </div>
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    );
  }

  // ── Request sent — the success / pending state ────────────────────────────
  if (view === "request_sent") {
    return (
      <div
        className="lg-glass max-w-md p-4"
        style={{ borderColor: "rgba(232,180,58,0.4)" }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-[21px] w-[21px] items-center justify-center rounded-full border border-[rgba(43,196,138,0.5)] bg-[rgba(43,196,138,0.25)] text-[#7BEDC4]">
            <Check size={12} />
          </span>
          <p className="text-[14px] font-semibold text-white">
            Block Request Sent
          </p>
        </div>
        <p className="mt-1.5 text-[12.5px] text-white/60">
          Request sent to{" "}
          <span className="font-medium text-white">{name}</span>. Waiting for
          response.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <span className="lg-pill lg-pill-y">
            <span className="h-[5px] w-[5px] rounded-full bg-[#E8B43A]" />
            Pending acceptance
          </span>
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg-btn lg-btn-p"
        style={{ color: "#FFFFFF" }}
      >
        <Plus size={14} /> Start Block
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-up"
          onClick={() => !busy && setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="lg-glass w-full max-w-md overflow-hidden shadow-2xl"
            style={{ background: "rgba(22,25,34,0.82)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.12] px-5 py-3.5">
              <h3 className="text-[15px] font-semibold text-white">
                Start a Block with {name}
              </h3>
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                aria-label="Close"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.08] hover:text-white"
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
                  className="w-full rounded-[14px] border border-white/[0.16] border-t-white/[0.32] bg-white/[0.06] px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/60 focus:border-white/40 focus:outline-none"
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
                  className="w-full resize-none rounded-[14px] border border-white/[0.16] border-t-white/[0.32] bg-white/[0.06] px-3.5 py-2.5 text-[13px] leading-relaxed text-white placeholder:text-white/60 focus:border-white/40 focus:outline-none"
                />
              </div>
              {error && <p className="text-[12px] text-danger">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/[0.12] px-5 py-3.5">
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                className="h-9 rounded-full px-4 text-[13px] font-medium text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={send}
                disabled={busy}
                style={{ color: "#FFFFFF" }}
                className="lg-btn lg-btn-p"
              >
                {busy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
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
        <span className="ml-1 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#FFD98A]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8B43A]" />
          {status}
        </span>
      )}
    </div>
  );
}

function PersonChip({ person }: { person: Person }) {
  const real = person.avatar && !person.avatar.includes("dicebear");
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/[0.14] py-1 pl-1 pr-3 backdrop-blur-sm">
      {real ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.avatar}
          alt=""
          className="h-6 w-6 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3B66F6] text-[11px] font-bold text-white">
          {person.name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="text-[12px] font-semibold text-white">{person.name}</span>
    </span>
  );
}

