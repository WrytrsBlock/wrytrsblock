"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Avatar, Badge, Button } from "@/components/ui/primitives";
import { SONGWRITER_CONTRIBUTOR_ROLES } from "@/types";
import type { BlockMemberView } from "@/lib/data";
import type { SongwriterContributorView } from "@/app/actions/songwriter";

// Compact, glanceable roster strip — deliberately not a large panel. The
// Comments panel already owns the screen's other side column; this is
// scannable "who's on this song" info, not a long-form editor. Adding a
// contributor here is what later seeds the Split Sheet Generator (see
// services/split-sheets.service.ts's seedSplitSheetEntriesFromContributors)
// so nobody re-types the same names/roles twice.
export function ContributorsStrip({
  contributors,
  members,
  onAdd,
  onRemove,
  onUpdateRole,
}: {
  contributors: SongwriterContributorView[];
  members: BlockMemberView[];
  onAdd: (input: { userId: string; displayName: string; role: string }) => void;
  onRemove: (contributorId: string) => void;
  onUpdateRole: (contributorId: string, role: string) => void;
}) {
  const [picking, setPicking] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [role, setRole] = useState<string>(SONGWRITER_CONTRIBUTOR_ROLES[0]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const availableMembers = members.filter(
    (m) => !contributors.some((c) => c.userId === m.id)
  );

  function submit() {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    onAdd({ userId: member.id, displayName: member.name, role });
    setPicking(false);
    setMemberId("");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {contributors.map((c) => (
        <span
          key={c.id}
          className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 pl-1 pr-2 py-1"
        >
          <Avatar src={c.avatar} name={c.displayName} size={18} />
          <span className="text-[11.5px] text-ink font-medium">{c.displayName}</span>
          {editingRoleId === c.id ? (
            <select
              autoFocus
              value={c.role}
              onChange={(e) => {
                onUpdateRole(c.id, e.target.value);
                setEditingRoleId(null);
              }}
              onBlur={() => setEditingRoleId(null)}
              className="bg-transparent text-[9.5px] text-ink focus:outline-none"
            >
              {SONGWRITER_CONTRIBUTOR_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
            <button onClick={() => setEditingRoleId(c.id)} title="Change role">
              <Badge tone="soft" className="text-[9.5px] px-1.5 py-0 hover:bg-surface-3 transition-colors">
                {c.role}
              </Badge>
            </button>
          )}
          <button
            onClick={() => onRemove(c.id)}
            className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-opacity"
            aria-label={`Remove ${c.displayName}`}
          >
            <X size={11} />
          </button>
        </span>
      ))}

      {!picking ? (
        <button
          onClick={() => setPicking(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-2.5 py-1 text-[11.5px] text-muted hover:text-ink hover:border-line-strong transition-colors"
        >
          <Plus size={11} /> Add contributor
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 pl-2 pr-1.5 py-1">
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="bg-transparent text-[11.5px] text-ink focus:outline-none"
          >
            <option value="">Member…</option>
            {availableMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-transparent text-[11.5px] text-ink focus:outline-none"
          >
            {SONGWRITER_CONTRIBUTOR_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Button variant="ghost" size="icon" onClick={submit} disabled={!memberId} title="Add">
            <Plus size={12} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setPicking(false)} title="Cancel">
            <X size={12} />
          </Button>
        </span>
      )}
    </div>
  );
}
