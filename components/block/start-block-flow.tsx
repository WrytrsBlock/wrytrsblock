"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Plus, X } from "lucide-react";
import { createBlockAction } from "@/app/actions/blocks";
import { inviteMembersAction } from "@/app/actions/invitations";
import type { BlockRelationship } from "@/lib/data";

type Person = { name: string; avatar?: string };

// Start a Block on a creator's profile — single-block model. There is no request
// step: creating the Block makes you the Owner immediately and invites the
// creator as a Pending member. Both then see the same Block in My Blocks.
//   none   → "Start Block" (modal) → creates the Block + invites → Open Block
//   active → we already share a Block → Open Block
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
  const [createdSlug, setCreatedSlug] = useState("");
  const activeSlug =
    relationship.status === "active" ? relationship.slug : createdSlug;

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

  // ── No shared Block yet — create one + invite ─────────────────────────────
  const send = async () => {
    setBusy(true);
    setError(null);
    const created = await createBlockAction({
      title: title.trim() || `Collab with ${name}`,
      blockType: "collaboration",
      category: "Project",
      tagline: intro.trim() || undefined,
    });
    if (!created.ok || !created.slug) {
      setBusy(false);
      setError(created.ok ? "Couldn't create the Block." : created.error);
      return;
    }
    // Invite the creator as a Pending member (non-fatal — the Block exists).
    await inviteMembersAction(created.slug, [handle]);
    setBusy(false);
    setOpen(false);
    setCreatedSlug(created.slug);
    setView("active");
    router.push(`/blocks/${created.slug}`);
    router.refresh();
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
              <Participants a={me} b={them} status="They'll be invited to join" />

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
                  <Plus size={14} />
                )}
                Create Block &amp; Invite
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

