import {
  MessageSquare,
  Upload,
  GitBranch,
  Pencil,
  UserPlus,
} from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { getPerson, type ActivityEvent } from "@/lib/mock";

const iconFor = {
  comment: MessageSquare,
  upload: Upload,
  status: GitBranch,
  edit: Pencil,
  join: UserPlus,
} as const;

const toneFor: Record<ActivityEvent["kind"], string> = {
  comment: "text-accent bg-accent/10 border-accent/30",
  upload: "text-success bg-success/10 border-success/30",
  status: "text-warning bg-warning/10 border-warning/30",
  edit: "text-muted bg-surface-3 border-line",
  join: "text-accent-2 bg-accent-2/10 border-accent-2/30",
};

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <ul className="space-y-3">
      {events.map((e) => {
        const Icon = iconFor[e.kind];
        const actor = getPerson(e.actorId);
        if (!actor) return null;
        return (
          <li key={e.id} className="flex gap-3 group">
            <div className="relative shrink-0">
              <Avatar src={actor.avatar} name={actor.name} size={28} />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-bg border ${toneFor[e.kind]}`}
              >
                <Icon size={9} strokeWidth={2.25} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] text-ink leading-snug">
                <span className="font-medium">{actor.name}</span>{" "}
                <span className="text-muted">{e.text}</span>
              </p>
              <p className="mt-0.5 text-[10.5px] text-muted font-mono">
                {e.at}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
