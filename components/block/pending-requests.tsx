"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import {
  acceptBlockRequestAction,
  declineBlockRequestAction,
} from "@/app/actions/block-requests";
import type { PendingPerson } from "@/lib/data";

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
    <section>
      <SectionHeading title="Pending Requests" count={total} />
      {error && (
        <p className="mb-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {inVisible.map((r) => (
          <Card key={r.requestId} person={r} kind="Incoming">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => accept(r.requestId)}
                disabled={busyId === r.requestId}
                style={{ color: "#FFFFFF" }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-grad-accent px-3 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Check size={13} />
                {busyId === r.requestId ? "…" : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => decline(r.requestId)}
                disabled={busyId === r.requestId}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-[12.5px] font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                <X size={13} /> Decline
              </button>
            </div>
          </Card>
        ))}
        {outgoing.map((r) => (
          <Card key={r.requestId} person={r} kind="Outgoing">
            <span className="inline-flex h-8 items-center rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 text-[12.5px] font-medium text-amber-300">
              Pending
            </span>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Card({
  person,
  kind,
  children,
}: {
  person: PendingPerson;
  kind: "Incoming" | "Outgoing";
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5">
      <Avatar name={person.name} src={person.avatar} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-white">
          {person.name}
        </p>
        {person.role && (
          <p className="truncate text-[12px] text-[#A9BEFF]">{person.role}</p>
        )}
        <p className="mt-0.5 text-[11px] text-white/45">
          {kind} request{person.timeAgo ? ` · ${person.timeAgo}` : ""}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
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

function SectionHeading({ title, count }: { title: string; count?: number }) {
  return (
    <h2 className="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-white/55">
      {title}
      {typeof count === "number" && (
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white/[0.08] px-1.5 text-[10.5px] font-semibold tabular-nums text-white/70">
          {count}
        </span>
      )}
    </h2>
  );
}
