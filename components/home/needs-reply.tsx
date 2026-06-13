"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Undo2, X } from "lucide-react";
import { lgAvColor } from "@/lib/lg";
import type { IncomingRequest } from "@/components/block/block-request-inbox";
import {
  acceptBlockRequestAction,
  declineBlockRequestAction,
} from "@/app/actions/block-requests";

const UNDO_MS = 6000;

// Dashboard "Needs your reply" card (mockup screen 6) — incoming Block
// Requests with inline Accept / Decline. Accepting opens the new Block.
// Declining is forgiving: the request hides immediately but the server call
// waits behind a short Undo window.
export function NeedsReply({ requests }: { requests: IncomingRequest[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [pendingUndo, setPendingUndo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = requests.filter((r) => !hidden.has(r.id));

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

  function decline(id: string, name: string) {
    // Commit any previous pending decline before starting a new one.
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setError(null);
    setHidden((s) => new Set(s).add(id));
    setPendingUndo({ id, name });
    undoTimer.current = setTimeout(() => void commitDecline(id), UNDO_MS);
  }

  async function commitDecline(id: string) {
    undoTimer.current = null;
    setPendingUndo(null);
    const res = await declineBlockRequestAction(id);
    if (res.ok) {
      router.refresh();
    } else {
      setHidden((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      setError(res.error);
    }
  }

  function undoDecline() {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
    if (pendingUndo) {
      const { id } = pendingUndo;
      setHidden((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
    setPendingUndo(null);
  }

  return (
    <div
      className="lg-glass p-3.5"
      style={{ borderColor: "rgba(232,180,58,0.4)" }}
    >
      <p className="mb-2.5 text-[13.5px] font-semibold text-white">
        Needs your reply
      </p>

      {error && (
        <p className="mb-2.5 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
          {error}
        </p>
      )}

      {pendingUndo && (
        <div className="mb-2.5 flex items-center gap-2 rounded-[14px] border border-white/[0.16] bg-white/[0.06] px-3 py-2">
          <p className="min-w-0 flex-1 truncate text-[12px] text-white/70">
            Request from {pendingUndo.name} declined.
          </p>
          <button
            type="button"
            onClick={undoDecline}
            className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#A9BEFF] hover:text-white transition-colors"
          >
            <Undo2 size={12} /> Undo
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-[12px] text-white/60">
          No requests right now — you&rsquo;re all caught up.
        </p>
      ) : (
        visible.slice(0, 2).map((r, i) => {
          const busy = busyId === r.id;
          return (
            <div key={r.id} className={i > 0 ? "mt-4" : undefined}>
              <div className="mb-2.5 flex items-center gap-2.5">
                <span
                  className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border border-white/35 text-[11px] font-semibold text-white"
                  style={{ background: lgAvColor(r.requesterName) }}
                >
                  {r.requesterName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-white">
                    {r.requesterName} wants to start a Block
                  </p>
                  <p className="mt-px truncate text-[11px] text-white/60">
                    &ldquo;{r.introMessage}&rdquo;
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => accept(r.id)}
                  disabled={busy}
                  className="lg-btn lg-btn-p flex-1 !py-1.5"
                  style={{ color: "#FFFFFF" }}
                >
                  <Check size={13} /> {busy ? "Accepting…" : "Accept"}
                </button>
                <button
                  type="button"
                  onClick={() => decline(r.id, r.requesterName)}
                  disabled={busy}
                  className="lg-btn flex-1 !py-1.5"
                >
                  <X size={13} /> Decline
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
