"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { deleteBlockAction } from "@/app/actions/blocks";

const CONFIRM_WORD = "DELETE";

// Owner-only permanent delete. Renders the danger-zone trigger + a confirmation
// modal that requires typing DELETE before the final action enables. Never
// deletes on first click. On success it redirects and refreshes (so the deleted
// Block drops out of the sidebar immediately); on failure it shows the error.
export function DeleteBlockButton({
  blockId,
  redirectTo = "/blocks",
}: {
  blockId: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canDelete = confirm.trim().toUpperCase() === CONFIRM_WORD && !pending;

  function close() {
    if (pending) return;
    setOpen(false);
    setConfirm("");
    setError(null);
  }

  function onDelete() {
    if (!canDelete) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteBlockAction(blockId);
      if (res.ok) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="md"
        onClick={() => setOpen(true)}
        className="!border-danger/40 !text-danger hover:!bg-danger/10"
      >
        <Trash2 size={12} /> Delete
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-up"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-danger/30 bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 border-b border-line px-5 py-4">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/15 text-danger">
                <AlertTriangle size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-semibold text-ink">
                  Delete this Block permanently?
                </h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                  This cannot be undone. All files, messages, tasks, split sheet
                  data, collaborators, and history connected to this Block will be
                  removed.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                disabled={pending}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-ink disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 px-5 py-4">
              <label
                htmlFor="confirm-delete"
                className="block text-[12px] font-medium text-ink"
              >
                Type{" "}
                <span className="font-mono font-bold text-danger">DELETE</span>{" "}
                to confirm
              </label>
              <input
                id="confirm-delete"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canDelete) onDelete();
                }}
                placeholder="DELETE"
                autoFocus
                autoComplete="off"
                disabled={pending}
                className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-[13px] tracking-wide text-ink placeholder:text-muted/60 focus:border-danger/60 focus:outline-none disabled:opacity-60"
              />
              {error && (
                <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="h-9 rounded-lg px-4 text-[13px] font-medium text-muted transition-colors hover:text-ink disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={!canDelete}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-danger px-4 text-[13px] font-semibold text-white transition-colors hover:bg-danger/90 disabled:pointer-events-none disabled:opacity-50"
                style={{ color: "#FFFFFF" }}
              >
                {pending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Permanently Delete Block
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
