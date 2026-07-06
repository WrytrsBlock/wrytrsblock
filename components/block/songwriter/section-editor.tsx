"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, MessageCircle, Sparkles, Trash2 } from "lucide-react";
import { Badge, Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { SONGWRITER_SECTION_LABELS } from "@/types";
import { CommentableTextarea } from "./commentable-textarea";
import type { SongwriterSectionView } from "@/app/actions/songwriter";

export function SectionEditor({
  section,
  collapsed,
  onToggleCollapse,
  onLyricsChange,
  onRename,
  onDelete,
  onFocus,
  onBlur,
  onRequestComment,
  onInspire,
  commentCounts,
  openCommentCount,
}: {
  section: SongwriterSectionView;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLyricsChange: (lyrics: string) => void;
  onRename: (label: string) => void;
  onDelete: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onRequestComment: (lineIndex: number, quotedText: string) => void;
  onInspire: () => void;
  commentCounts: Map<number, number>;
  openCommentCount: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });
  const [renaming, setRenaming] = useState(false);
  const [draftLabel, setDraftLabel] = useState(
    section.label ?? SONGWRITER_SECTION_LABELS[section.kind]
  );

  const displayLabel = section.label ?? SONGWRITER_SECTION_LABELS[section.kind];

  function commitRename() {
    setRenaming(false);
    const trimmed = draftLabel.trim();
    if (trimmed && trimmed !== displayLabel) onRename(trimmed);
    else setDraftLabel(displayLabel);
  }

  return (
    <div
      ref={setNodeRef}
      id={`songwriter-section-${section.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl border border-line bg-surface transition-shadow scroll-mt-4",
        isDragging && "shadow-elevated opacity-90"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted hover:text-ink p-1 -ml-1 touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand section" : "Collapse section"}
          aria-expanded={!collapsed}
          className="text-muted hover:text-ink p-0.5"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>

        {renaming ? (
          <input
            autoFocus
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setDraftLabel(displayLabel);
                setRenaming(false);
              }
            }}
            className="bg-surface-2 border border-line rounded-md px-2 py-0.5 text-[12.5px] text-ink focus:outline-none focus:border-accent/50"
          />
        ) : (
          <button
            onClick={() => setRenaming(true)}
            className="text-[12.5px] font-medium text-ink hover:text-accent transition-colors"
            title="Rename section"
          >
            {displayLabel}
          </button>
        )}

        {openCommentCount > 0 && (
          <Badge tone="soft" className="gap-1">
            <MessageCircle size={9} /> {openCommentCount}
          </Badge>
        )}

        <div className="flex-1" />

        <Button variant="ghost" size="sm" onClick={onInspire} className="text-accent">
          <Sparkles size={12} /> Inspire
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete section">
          <Trash2 size={13} className="text-muted hover:text-danger" />
        </Button>
      </div>

      {!collapsed && (
        <div className="px-1 py-1">
          <CommentableTextarea
            value={section.lyrics}
            onChange={onLyricsChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onRequestComment={onRequestComment}
            commentCounts={commentCounts}
            placeholder="Start writing…"
          />
        </div>
      )}
    </div>
  );
}
