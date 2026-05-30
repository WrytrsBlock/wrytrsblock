"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, X } from "lucide-react";
import { Avatar, Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { getPerson, type KanbanColumn } from "@/lib/mock";
import { supabaseConfigured } from "@/lib/env";
import { createProjectAction, moveProjectAction } from "@/app/actions/projects";
import type { ProjectStatus } from "@/types";

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

// Maps board column titles to the projects.status enum for persistence.
const columnStatus: Record<string, ProjectStatus> = {
  Brief: "todo",
  "In Progress": "in_progress",
  Review: "review",
  Shipped: "done",
};

type DragState = { cardId: string; fromCol: string } | null;

export function BoardCanvas({
  columns,
  blockSlug,
}: {
  columns: KanbanColumn[];
  blockSlug: string;
}) {
  const [cols, setCols] = useState<KanbanColumn[]>(columns);
  const [drag, setDrag] = useState<DragState>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [addingCol, setAddingCol] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function addCard(col: KanbanColumn) {
    const title = draft.trim();
    if (!title) return;
    const id = `local-${Date.now()}`;
    setCols((prev) =>
      prev.map((c) =>
        c.id === col.id ? { ...c, cards: [...c.cards, { id, title }] } : c
      )
    );
    const status = columnStatus[col.title];
    if (supabaseConfigured && status) {
      createProjectAction(blockSlug, title, status).catch(() => {});
    }
    setDraft("");
    setAddingCol(null);
  }

  function moveCard(cardId: string, fromCol: string, toCol: string) {
    if (fromCol === toCol) return;
    setCols((prev) => {
      const next = prev.map((c) => ({ ...c, cards: [...c.cards] }));
      const from = next.find((c) => c.id === fromCol);
      const to = next.find((c) => c.id === toCol);
      if (!from || !to) return prev;
      const idx = from.cards.findIndex((c) => c.id === cardId);
      if (idx === -1) return prev;
      const [card] = from.cards.splice(idx, 1);
      to.cards.push(card);

      // Persist when wired to Supabase (card.id must be a real project id).
      const status = columnStatus[to.title];
      if (supabaseConfigured && status) {
        moveProjectAction(card.id, status, to.cards.length - 1).catch(() => {});
      }
      return next;
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {cols.map((col) => (
        <div
          key={col.id}
          onDragOver={(e) => {
            e.preventDefault();
            setOverCol(col.id);
          }}
          onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
          onDrop={(e) => {
            e.preventDefault();
            setOverCol(null);
            if (drag) moveCard(drag.cardId, drag.fromCol, col.id);
            setDrag(null);
          }}
          className={cn(
            "rounded-2xl border bg-surface/40 p-2.5 transition-colors duration-150",
            overCol === col.id
              ? "border-accent/50 bg-accent/[0.04]"
              : "border-line"
          )}
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

          <div className="space-y-2 min-h-[8px]">
            {col.cards.map((card) => {
              const assignee = card.assigneeId
                ? getPerson(card.assigneeId)
                : undefined;
              const isDragging = drag?.cardId === card.id;
              return (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    setDrag({ cardId: card.id, fromCol: col.id });
                  }}
                  onDragEnd={() => {
                    setDrag(null);
                    setOverCol(null);
                  }}
                  className={cn(
                    "group rounded-xl border border-line bg-surface p-3 transition-all duration-150 cursor-grab active:cursor-grabbing",
                    isDragging
                      ? "opacity-40 scale-[0.98]"
                      : "hover:border-line-strong hover:shadow-soft"
                  )}
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

            {addingCol === col.id ? (
              <div className="rounded-xl border border-line bg-surface p-2">
                <textarea
                  autoFocus
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      addCard(col);
                    }
                    if (e.key === "Escape") {
                      setAddingCol(null);
                      setDraft("");
                    }
                  }}
                  placeholder="Task title…"
                  className="w-full resize-none bg-transparent text-[12.5px] text-ink placeholder:text-muted/70 focus:outline-none px-1"
                />
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <button
                    onClick={() => {
                      setAddingCol(null);
                      setDraft("");
                    }}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors"
                    aria-label="Cancel"
                  >
                    <X size={12} />
                  </button>
                  <button
                    onClick={() => addCard(col)}
                    disabled={!draft.trim()}
                    className="h-6 px-2.5 rounded-md bg-ink text-bg text-[11px] font-medium disabled:opacity-40 transition-opacity"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAddingCol(col.id);
                  setDraft("");
                }}
                className="w-full flex items-center justify-center gap-1 py-2 rounded-xl text-[11.5px] text-muted hover:text-ink hover:bg-surface-2 transition-colors duration-200"
              >
                <Plus size={11} /> Add task
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
