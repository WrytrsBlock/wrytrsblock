"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Check, Loader2, UserPlus, X } from "lucide-react";
import { Avatar, Button, Card, Input, SectionLabel } from "@/components/ui/primitives";
import {
  inviteMembersAction,
  removeMemberAction,
} from "@/app/actions/invitations";
import type { BlockMemberView } from "@/lib/data";

// The people hub inside the Team tab — invite, roles (Admin/Member), remove,
// and a dedicated Pending invitations section. Consolidates what used to be the
// separate Invite tab.
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
  const [handle, setHandle] = useState("");
  const [inviting, startInvite] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startRemove] = useTransition();

  const accepted = members.filter((m) => m.status !== "invited");
  const pending = members.filter((m) => m.status === "invited");

  function invite() {
    const h = handle.trim();
    if (!h) return;
    setMsg(null);
    startInvite(async () => {
      const res = await inviteMembersAction(slug, [h]);
      if (res.ok) {
        setHandle("");
        setMsg({ ok: true, text: `Invited @${h.replace(/^@/, "")}.` });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

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
      {/* Invite collaborator */}
      {isOwner && (
        <Card className="p-5">
          <SectionLabel>Invite collaborator</SectionLabel>
          <p className="mt-1 text-[12.5px] text-muted">
            Add a creator by @handle. They&apos;ll appear under Pending until
            they accept.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && invite()}
              placeholder="@handle"
              autoComplete="off"
              className="flex-1"
            />
            <Button
              variant="primary"
              onClick={invite}
              disabled={inviting || !handle.trim()}
              style={{ color: "#FFFFFF" }}
            >
              {inviting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <UserPlus size={15} />
              )}
              Invite Collaborator
            </Button>
          </div>
          {msg && (
            <p
              className={
                "mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] " +
                (msg.ok ? "text-success" : "text-danger")
              }
            >
              {msg.ok && <Check size={13} />}
              {msg.text}
            </p>
          )}
        </Card>
      )}

      {/* Members */}
      <Card className="p-5">
        <SectionLabel>Members · {accepted.length}</SectionLabel>
        <ul className="mt-3 space-y-2">
          {accepted.map((m) => (
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
          {accepted.length === 0 && (
            <li className="rounded-xl border border-line bg-surface-2/40 px-3 py-4 text-center text-[12.5px] text-muted">
              No members yet.
            </li>
          )}
        </ul>
      </Card>

      {/* Pending invitations */}
      {pending.length > 0 && (
        <Card className="p-5">
          <SectionLabel>Pending invitations · {pending.length}</SectionLabel>
          <ul className="mt-3 space-y-2">
            {pending.map((m) => (
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
                <span className="shrink-0 rounded-full border border-[#E8B43A]/40 bg-[#E8B43A]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#E8B43A]">
                  Pending
                </span>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    disabled={removingId === m.id}
                    aria-label={`Cancel invitation to ${m.name}`}
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
          </ul>
        </Card>
      )}
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
      {admin ? "Admin" : "Member"}
    </span>
  );
}
