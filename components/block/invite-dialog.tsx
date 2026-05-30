"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Send } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button, Input, Label } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { onUIEvent } from "@/lib/ui-events";
import { inviteCollaboratorAction } from "@/app/actions/collaborators";
import type { BlockRole } from "@/types";

const roles: { id: BlockRole; label: string; desc: string }[] = [
  { id: "collaborator", label: "Collaborator", desc: "Can edit, upload, comment" },
  { id: "reviewer", label: "Reviewer", desc: "Can view and comment" },
  { id: "guest", label: "Guest", desc: "Limited, time-boxed access" },
];

export function InviteDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [blockSlug, setBlockSlug] = useState("");
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState<BlockRole>("collaborator");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(
    () =>
      onUIEvent("wb:invite", (detail) => {
        setBlockSlug(detail?.blockSlug ?? "");
        setHandle(detail?.handle ?? "");
        setRole("collaborator");
        setNotice(null);
        setError(null);
        setOpen(true);
      }),
    []
  );

  function submit() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await inviteCollaboratorAction(blockSlug, handle, role);
      if (res.ok) {
        setNotice(res.message);
        setHandle("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title="Invite a collaborator"
      description="Bring a writer, editor, composer, or producer into this Block."
      footer={
        <>
          <Button variant="ghost" size="md" onClick={() => setOpen(false)}>
            Done
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={submit}
            disabled={pending || !handle.trim()}
          >
            {pending ? "Sending…" : "Send invite"}
            <Send size={12} />
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="inv-handle">Handle or email</Label>
          <Input
            id="inv-handle"
            autoFocus
            placeholder="@milotran or milo@studio.com"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && handle.trim()) submit();
            }}
          />
        </div>

        <div>
          <Label>Role</Label>
          <div className="space-y-1.5">
            {roles.map((r) => {
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200",
                    active
                      ? "border-accent/50 bg-accent/10"
                      : "border-line bg-surface hover:border-line-strong"
                  )}
                >
                  <span
                    className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                      active ? "border-accent bg-accent" : "border-line-strong"
                    )}
                  >
                    {active && <Check size={10} className="text-bg" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12.5px] font-medium text-ink">
                      {r.label}
                    </span>
                    <span className="block text-[11px] text-muted">
                      {r.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {notice && (
          <p className="text-[12px] text-success bg-success/10 border border-success/30 rounded-md px-3 py-2">
            {notice}
          </p>
        )}
        {error && (
          <p className="text-[12px] text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
