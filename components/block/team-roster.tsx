import { MessageCircle, MoreHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { BlockScore } from "@/components/creator/block-score";
import { creatorProfiles, getPerson } from "@/lib/mock";
import { InviteButton } from "./invite-button";

export function TeamRoster({
  ids,
  blockSlug,
}: {
  ids: string[];
  blockSlug: string;
}) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {ids.map((id) => {
          const p = getPerson(id);
          if (!p) return null;
          const score = creatorProfiles[id]?.blockScore;
          return (
            <li
              key={p.id}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 group"
            >
              <Avatar src={p.avatar} name={p.name} size={32} online={p.online} />
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-ink font-medium leading-tight truncate">
                  {p.name}
                </p>
                <p className="text-[10.5px] text-muted leading-tight truncate mt-0.5">
                  {p.role} · @{p.handle}
                </p>
              </div>
              {score !== undefined && (
                <BlockScore
                  score={score}
                  size="sm"
                  showLevel={false}
                  className="shrink-0 group-hover:hidden"
                />
              )}
              <div className="hidden group-hover:flex items-center gap-0.5">
                <button
                  className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-ink transition-colors"
                  title="Message"
                >
                  <MessageCircle size={13} />
                </button>
                <button
                  className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-ink transition-colors"
                  title="More"
                >
                  <MoreHorizontal size={13} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <InviteButton blockSlug={blockSlug} className="mt-4 w-full" />
    </div>
  );
}
