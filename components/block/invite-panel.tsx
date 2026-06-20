"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Check } from "lucide-react";
import { Avatar, Button, Input } from "@/components/ui/primitives";
import { inviteMembersAction } from "@/app/actions/invitations";
import type { BlockMemberView } from "@/lib/data";

// The Invite tab — owner invites collaborators by @handle (added as Pending),
// and everyone can see the current roster + each member's status.
export function InvitePanel({
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
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function invite() {
    const h = handle.trim();
    if (!h) return;
    setMsg(null);
    start(async () => {
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

  return (
    <div className="page-fluid mx-auto max-w-2xl space-y-6 py-6">
      {isOwner ? (
        <div className="lg-glass rounded-2xl p-5">
          <h2 className="text-[15px] font-semibold text-white">
            Invite collaborators
          </h2>
          <p className="mt-1 text-[12.5px] text-muted">
            Add creators by @handle. They&apos;ll see this Block in their My
            Blocks as <span className="text-white">Pending</span> until they
            accept.
          </p>
          <div className="mt-4 flex gap-2">
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
              disabled={pending || !handle.trim()}
              style={{ color: "#FFFFFF" }}
            >
              {pending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <UserPlus size={15} />
              )}
              Invite
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
        </div>
      ) : (
        <p className="text-[13px] text-muted">
          Only the Block owner can invite collaborators.
        </p>
      )}

      <div>
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          In this Block · {members.length}
        </p>
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="lg-glass flex items-center gap-3 rounded-xl p-2.5"
            >
              <Avatar src={m.avatar} name={m.name} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-white">
                  {m.name}
                </span>
                <span className="block truncate text-[11.5px] text-muted">
                  @{m.handle}
                </span>
              </span>
              <span
                className={
                  "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide " +
                  (m.isLead
                    ? "border-accent/40 bg-accent/15 text-accent"
                    : m.status === "invited"
                      ? "border-[#E8B43A]/40 bg-[#E8B43A]/15 text-[#E8B43A]"
                      : "border-white/15 bg-white/[0.06] text-white/80")
                }
              >
                {m.isLead ? "Owner" : m.status === "invited" ? "Pending" : "Member"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
