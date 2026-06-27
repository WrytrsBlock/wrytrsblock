import { Fragment } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/primitives";
import type { BlockMemberView } from "@/lib/data";

function fmtAdded(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Who's in this Block — the creator + collaborators, shown as cards side by side
// with a "+" between them (the same "A + B" language as Start a Block). The owner
// reads as the one who created the Block. Sits right under the title.
export function BlockCollaborators({
  members,
}: {
  members: BlockMemberView[];
}) {
  // Owner first, then active members, then anyone still invited.
  const ordered = [...members].sort((a, b) => {
    const rank = (m: BlockMemberView) =>
      m.isLead ? 0 : m.status === "invited" ? 2 : 1;
    return rank(a) - rank(b);
  });
  if (!ordered.length) return null;

  return (
    // Single horizontal strip — creators stay side by side and scroll to the
    // right as more join (never wrap onto a second line). Scrollbar hidden.
    <div className="mt-4 flex items-center gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ordered.map((m, i) => (
        <Fragment key={m.id}>
          {i > 0 && (
            <span className="shrink-0 text-[17px] font-semibold text-muted">+</span>
          )}
          <Link
            href={`/profile/${m.handle}`}
            className="lg-glass inline-flex shrink-0 items-center gap-2.5 rounded-2xl py-1.5 pl-1.5 pr-3.5 transition-colors hover:bg-white/[0.1]"
          >
            <Avatar src={m.avatar} name={m.name} size={32} />
            <span>
              <span className="block whitespace-nowrap text-[13px] font-semibold leading-tight text-white">
                {m.name}
              </span>
              <span className="block text-[10.5px] leading-tight text-muted">
                {m.isLead
                  ? "Owner · created this Block"
                  : m.status === "invited"
                    ? "Invited"
                    : `Member${m.joinedAt ? ` · added ${fmtAdded(m.joinedAt)}` : ""}`}
              </span>
            </span>
          </Link>
        </Fragment>
      ))}
    </div>
  );
}
