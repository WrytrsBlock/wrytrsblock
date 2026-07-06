"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  SONGWRITER_SECTION_KINDS,
  SONGWRITER_SECTION_LABELS,
  type SongwriterSectionKind,
} from "@/types";
import { SectionEditor } from "./section-editor";
import type { SongwriterCommentView, SongwriterSectionView } from "@/app/actions/songwriter";

// Stable reference for sections with no comments, so passing it down doesn't
// hand SectionEditor a new empty Map identity on every render.
const EMPTY_LINE_COUNTS: Map<number, number> = new Map();

export function SectionList({
  sections,
  comments,
  collapsedIds,
  onToggleCollapse,
  onLyricsChange,
  onRename,
  onDelete,
  onFocusSection,
  onBlurSection,
  onRequestComment,
  onInspire,
  onReorder,
  onAddSection,
}: {
  sections: SongwriterSectionView[];
  comments: SongwriterCommentView[];
  collapsedIds: Set<string>;
  onToggleCollapse: (id: string) => void;
  onLyricsChange: (id: string, lyrics: string) => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onFocusSection: (id: string) => void;
  onBlurSection: (id: string) => void;
  onRequestComment: (sectionId: string, lineIndex: number, quotedText: string) => void;
  onInspire: (sectionId: string) => void;
  onReorder: (sectionId: string, newPosition: number) => void;
  onAddSection: (kind: SongwriterSectionKind, label?: string) => void;
}) {
  // KeyboardSensor makes reordering possible without a pointer: Tab to a
  // section's drag handle, then Space to pick up, arrow keys to move, Space
  // to drop (Escape cancels) — dnd-kit doesn't wire this up unless the
  // sensor is registered explicitly, so it's easy to end up with a drag
  // interaction that's mouse/touch-only.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Always derived straight from the (possibly just-updated-optimistically)
  // `sections` prop — the parent applies the new position optimistically
  // before the server round-trip, so there's no need for a second, divergent
  // local order that could go stale against live lyric/label edits.
  const displayOrder = useMemo(
    () => [...sections].sort((a, b) => a.position - b.position),
    [sections]
  );

  // Computed once per `comments` change rather than per section per render —
  // each section's row previously re-filtered/re-grouped its own comments
  // from scratch on every render of the whole list (e.g. every keystroke in
  // any section's lyrics, via the sections state update bubbling up here).
  const sectionCommentMeta = useMemo(() => {
    const map = new Map<string, { lineCounts: Map<number, number>; openCommentCount: number }>();
    for (const c of comments) {
      if (c.resolved) continue;
      const meta = map.get(c.sectionId) ?? { lineCounts: new Map(), openCommentCount: 0 };
      meta.lineCounts.set(c.lineIndex, (meta.lineCounts.get(c.lineIndex) ?? 0) + 1);
      if (!c.parentCommentId) meta.openCommentCount += 1;
      map.set(c.sectionId, meta);
    }
    return map;
  }, [comments]);

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = displayOrder.findIndex((s) => s.id === active.id);
    const newIndex = displayOrder.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const moved = arrayMove(displayOrder, oldIndex, newIndex);

    const prev = moved[newIndex - 1];
    const next = moved[newIndex + 1];
    let newPosition: number;
    if (prev && next) newPosition = (prev.position + next.position) / 2;
    else if (prev) newPosition = prev.position + 1;
    else if (next) newPosition = next.position - 1;
    else newPosition = moved[newIndex].position;

    onReorder(active.id as string, newPosition);
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={displayOrder.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {displayOrder.map((section) => {
              const meta = sectionCommentMeta.get(section.id);
              return (
                <SectionEditor
                  key={section.id}
                  section={section}
                  collapsed={collapsedIds.has(section.id)}
                  onToggleCollapse={() => onToggleCollapse(section.id)}
                  onLyricsChange={(lyrics) => onLyricsChange(section.id, lyrics)}
                  onRename={(label) => onRename(section.id, label)}
                  onDelete={() => onDelete(section.id)}
                  onFocus={() => onFocusSection(section.id)}
                  onBlur={() => onBlurSection(section.id)}
                  onRequestComment={(lineIndex, quotedText) =>
                    onRequestComment(section.id, lineIndex, quotedText)
                  }
                  onInspire={() => onInspire(section.id)}
                  commentCounts={meta?.lineCounts ?? EMPTY_LINE_COUNTS}
                  openCommentCount={meta?.openCommentCount ?? 0}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <AddSectionControl onAdd={onAddSection} />
    </div>
  );
}

function AddSectionControl({
  onAdd,
}: {
  onAdd: (kind: SongwriterSectionKind, label?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [pickingCustom, setPickingCustom] = useState(false);

  function pick(kind: SongwriterSectionKind) {
    if (kind === "custom") {
      setPickingCustom(true);
      return;
    }
    onAdd(kind);
    setOpen(false);
  }

  function confirmCustom() {
    if (!customLabel.trim()) return;
    onAdd("custom", customLabel.trim());
    setCustomLabel("");
    setPickingCustom(false);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        <Plus size={12} /> Add Section
      </Button>
      {open && (
        <div className="absolute z-20 mt-1.5 w-48 rounded-lg border border-line bg-surface shadow-elevated overflow-hidden">
          {!pickingCustom ? (
            SONGWRITER_SECTION_KINDS.map((kind) => (
              <button
                key={kind}
                onClick={() => pick(kind)}
                className={cn(
                  "w-full text-left px-3 py-2 text-[12.5px] text-ink hover:bg-surface-2 transition-colors"
                )}
              >
                {SONGWRITER_SECTION_LABELS[kind]}
              </button>
            ))
          ) : (
            <div className="p-2 flex items-center gap-1.5">
              <input
                autoFocus
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmCustom()}
                placeholder="Section name…"
                className="flex-1 min-w-0 bg-surface-2 border border-line rounded-md px-2 py-1 text-[12.5px] text-ink focus:outline-none focus:border-accent/50"
              />
              <Button variant="primary" size="sm" onClick={confirmCustom}>
                Add
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
