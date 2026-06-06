"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Target, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  acceptBlockRequestAction,
  declineBlockRequestAction,
} from "@/app/actions/block-requests";

export type IncomingRequest = {
  id: string;
  requesterName: string;
  requesterHandle: string | null;
  blockTitle: string;
  blockType: "collaboration" | "service" | "block_party";
  introMessage: string;
  expectedOutcome: string | null;
};

// Incoming Block Requests with Accept / Decline. Accepting creates the Block,
// adds both creators as members, and routes the recipient into the workspace.
export function BlockRequestInbox({
  requests,
}: {
  requests: IncomingRequest[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());

  const visible = requests.filter((r) => !hidden.has(r.id));
  if (visible.length === 0) return null;

  async function accept(id: string) {
    setBusyId(id);
    setError(null);
    const res = await acceptBlockRequestAction(id);
    if (res.ok) {
      router.push(`/blocks/${res.slug}`);
    } else {
      setBusyId(null);
      setError(res.error);
    }
  }

  async function decline(id: string) {
    setBusyId(id);
    setError(null);
    const res = await declineBlockRequestAction(id);
    setBusyId(null);
    if (res.ok) {
      setHidden((s) => new Set(s).add(id));
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg text-ink tracking-tight">
          Block Requests
        </h2>
        <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-accent/15 text-accent text-[11px] font-semibold tabular-nums">
          {visible.length}
        </span>
      </div>

      {error && (
        <p className="mb-3 text-[12px] text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-2.5">
        {visible.map((r) => {
          const busy = busyId === r.id;
          return (
            <div key={r.id} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] text-muted leading-snug">
                  <span className="font-semibold text-ink">
                    {r.requesterName}
                  </span>{" "}
                  wants to start a Block with you
                </p>
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center h-5 px-2 rounded-full text-[10.5px] font-semibold border",
                    r.blockType === "service"
                      ? "text-accent-2 border-accent-2/30 bg-accent-2/10"
                      : r.blockType === "block_party"
                        ? "text-warning border-warning/30 bg-warning/10"
                        : "text-accent border-accent/30 bg-accent/10"
                  )}
                >
                  {r.blockType === "service"
                    ? "Service"
                    : r.blockType === "block_party"
                      ? "Block Party"
                      : "Collaboration"}
                </span>
              </div>

              <p className="mt-2 text-[15px] font-semibold text-ink tracking-tight">
                {r.blockTitle}
              </p>
              <p className="mt-1.5 text-[13px] text-ink/85 leading-relaxed">
                {r.introMessage}
              </p>
              {r.expectedOutcome && (
                <p className="mt-2 flex items-start gap-1.5 text-[12px] text-muted">
                  <Target size={13} className="mt-0.5 text-accent shrink-0" />
                  <span>
                    <span className="text-ink/70 font-medium">Goal:</span>{" "}
                    {r.expectedOutcome}
                  </span>
                </p>
              )}

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => accept(r.id)}
                  disabled={busy}
                  style={{ color: "#FFFFFF" }}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-[12.5px] font-semibold text-[#FFFFFF] [&_svg]:text-[#FFFFFF] bg-grad-accent border border-accent/40 shadow-glow hover:opacity-95 transition-opacity disabled:opacity-60"
                >
                  <Check size={14} />
                  {busy ? "Accepting…" : "Accept & Open Block"}
                </button>
                <button
                  type="button"
                  onClick={() => decline(r.id)}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-[12.5px] font-medium text-muted hover:text-ink bg-transparent border border-line hover:border-line-strong transition-colors disabled:opacity-60"
                >
                  <X size={14} /> Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
