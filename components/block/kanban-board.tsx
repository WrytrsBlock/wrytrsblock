import { MoreHorizontal, Plus } from "lucide-react";
import { Avatar, Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { getPerson, type KanbanColumn } from "@/lib/mock";

const tagTone: Record<
  string,
  "accent" | "soft" | "success" | "warning" | "danger" | "accent-2"
> = {
  Script: "accent",
  Sound: "accent-2",
  VO: "warning",
  Music: "accent",
  Design: "soft",
  Edit: "warning",
  Legal: "danger",
  Mix: "success",
};

export function KanbanBoard({ columns }: { columns: KanbanColumn[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {columns.map((col) => (
        <div
          key={col.id}
          className="rounded-2xl border border-line bg-surface/40 p-2.5"
        >
          <div className="flex items-center justify-between px-1.5 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] font-semibold text-ink tracking-[0.01em] uppercase">
                {col.title}
              </span>
              <span className="text-[10.5px] font-mono text-muted">
                {col.cards.length}
              </span>
            </div>
            <button className="text-muted hover:text-ink p-0.5 rounded transition-colors">
              <MoreHorizontal size={13} />
            </button>
          </div>

          <div className="space-y-2">
            {col.cards.map((card) => {
              const assignee = card.assigneeId
                ? getPerson(card.assigneeId)
                : undefined;
              return (
                <div
                  key={card.id}
                  className="group rounded-xl border border-line bg-surface p-3 hover:border-line-strong hover:shadow-soft transition-all duration-200 cursor-grab"
                >
                  <p className="text-[12.5px] text-ink leading-snug">
                    {card.title}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {card.tag && (
                        <Badge tone={tagTone[card.tag] ?? "soft"}>
                          {card.tag}
                        </Badge>
                      )}
                      {card.dueIn && (
                        <span
                          className={cn(
                            "text-[10px] font-mono",
                            card.dueIn === "Today"
                              ? "text-danger"
                              : card.dueIn === "Tomorrow"
                              ? "text-warning"
                              : "text-muted"
                          )}
                        >
                          {card.dueIn}
                        </span>
                      )}
                    </div>
                    {assignee && (
                      <Avatar
                        src={assignee.avatar}
                        name={assignee.name}
                        size={20}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            <button className="w-full flex items-center justify-center gap-1 py-2 rounded-xl text-[11.5px] text-muted hover:text-ink hover:bg-surface-2 transition-colors duration-200">
              <Plus size={11} /> Add
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
