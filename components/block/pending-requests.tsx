"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import {
  acceptBlockRequestAction,
  declineBlockRequestAction,
} from "@/app/actions/block-requests";
import { cn } from "@/lib/cn";
import type { PendingPerson } from "@/lib/data";

function sublineFor(t: PendingPerson["blockType"]): string {
  return t === "service"
    ? "wants to start a Service Block"
    : t === "block_party"
      ? "invited you to a Block Party"
      : "wants to collaborate with you";
}

// The My Blocks "Pending Requests" row — incoming requests the user accepts or
// declines, and outgoing ones still awaiting a response.
export function PendingRequests({
  incoming,
  outgoing,
}: {
  incoming: PendingPerson[];
  outgoing: PendingPerson[];
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const inVisible = incoming.filter((r) => !hidden.has(r.requestId));
  const total = inVisible.length + outgoing.length;
  if (total === 0) return null;

  function accept(id: string) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const res = await acceptBlockRequestAction(id);
      setBusyId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.slug) router.push(`/blocks/${res.slug}`);
      else router.refresh();
    });
  }

  function decline(id: string) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const res = await declineBlockRequestAction(id);
      setBusyId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setHidden((s) => new Set(s).add(id));
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Receiver view — needs a decision, shown first */}
        {inVisible.map((r) => (
          <RequestCard key={r.requestId} person={r} status="new">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => accept(r.requestId)}
                disabled={busyId === r.requestId}
                style={{ color: "#FFFFFF" }}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-grad-accent text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Check size={14} />
                {busyId === r.requestId ? "…" : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => decline(r.requestId)}
                disabled={busyId === r.requestId}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                <X size={14} /> Decline
              </button>
            </div>
          </RequestCard>
        ))}
        {/* Sender view — awaiting the recipient's response */}
        {outgoing.map((r) => (
          <RequestCard key={r.requestId} person={r} status="pending" />
        ))}
      </div>
    </div>
  );
}

// A request card that communicates status without opening the Block.
//   Receiver:  NEW REQUEST · {name} wants to collaborate with you · Sent {time}
//   Sender:    PENDING · {name} · Waiting for response · Sent {time}
function RequestCard({
  person,
  status,
  children,
}: {
  person: PendingPerson;
  status: "new" | "pending";
  children?: React.ReactNode;
}) {
  const isNew = status === "new";
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
          isNew
            ? "border-accent/30 bg-accent/15 text-accent"
            : "border-amber-400/30 bg-amber-400/10 text-amber-300"
        )}
      >
        {isNew ? "New Request" : "Pending"}
      </span>

      <div className="mt-3 flex items-center gap-3">
        <Avatar name={person.name} src={person.avatar} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-white">
            {person.name}
          </p>
          <p className="truncate text-[12.5px] text-white/55">
            {isNew ? sublineFor(person.blockType) : "Waiting for response"}
          </p>
        </div>
      </div>

      <p className="mt-2.5 text-[11.5px] text-white/40">
        Sent {person.timeAgo || "recently"}
      </p>

      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className="h-11 w-11 shrink-0 rounded-full border border-white/[0.12] object-cover"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.08] text-[13px] font-semibold text-white/80">
      {initials}
    </span>
  );
}
