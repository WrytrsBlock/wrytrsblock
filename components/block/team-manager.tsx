"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Loader2, X } from "lucide-react";
import { Avatar, Card, SectionLabel } from "@/components/ui/primitives";
import { removeMemberAction } from "@/app/actions/invitations";
import type { BlockMemberView } from "@/lib/data";

// The people hub inside the Team tab — shows the roster (Owner + Collaborators)
// and lets the owner remove members. Collaborators join through the canonical
// Block Request flow (Start Block → Accept), so there is no @handle invite here
// and no "pending" state: everyone listed is an accepted member.
export function TeamManager({
  slug,
  members,
  isOwner,
}: {
  slug: string;
  members: BlockMemberView[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startRemove] = useTransition();

  function remove(userId: string) {
    setRemovingId(userId);
    startRemove(async () => {
      const res = await removeMemberAction(slug, userId);
      setRemovingId(null);
      if (res.ok) router.refresh();
      else setMsg({ ok: false, text: res.error });
    });
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionLabel>Members · {members.length}</SectionLabel>
        <p className="mt-1 text-[12.5px] text-muted">
          Everyone in this Block. Collaborators join by accepting a Block Request.
        </p>
        <ul className="mt-3 space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 px-3 py-2.5"
            >
              <Avatar src={m.avatar} name={m.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">
                  {m.name}
                </p>
                <p className="truncate text-[11px] text-muted">@{m.handle}</p>
              </div>
              <RoleBadge admin={m.isLead} />
              <Link
                href={`/profile/${m.handle}`}
                aria-label={`View ${m.name}`}
                className="shrink-0 text-muted transition-colors hover:text-ink"
              >
                <ArrowUpRight size={14} />
              </Link>
              {/* Admins can remove anyone except the Block admin (lead). */}
              {isOwner && !m.isLead && (
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  disabled={removingId === m.id}
                  aria-label={`Remove ${m.name}`}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-danger/40 hover:bg-danger/15 hover:text-danger disabled:opacity-50"
                >
                  {removingId === m.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <X size={13} />
                  )}
                </button>
              )}
            </li>
          ))}
          {members.length === 0 && (
            <li className="rounded-xl border border-line bg-surface-2/40 px-3 py-4 text-center text-[12.5px] text-muted">
              No members yet.
            </li>
          )}
        </ul>
        {msg && !msg.ok && (
          <p className="mt-2.5 text-[12.5px] text-danger">{msg.text}</p>
        )}
      </Card>
    </div>
  );
}

function RoleBadge({ admin }: { admin: boolean }) {
  return (
    <span
      className={
        "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide " +
        (admin
          ? "border-accent/40 bg-accent/15 text-accent"
          : "border-white/15 bg-white/[0.06] text-white/80")
      }
    >
      {admin ? "Admin" : "Collaborator"}
    </span>
  );
}
