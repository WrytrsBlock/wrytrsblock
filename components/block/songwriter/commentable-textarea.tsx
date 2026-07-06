"use client";

import { useMemo, useRef, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/cn";

const LINE_HEIGHT = 24; // px — kept in sync across the gutter, highlight layer, and textarea.

function lineIndexAt(value: string, offset: number): number {
  let idx = 0;
  for (let i = 0; i < offset && i < value.length; i++) {
    if (value[i] === "\n") idx++;
  }
  return idx;
}

// Comments anchor to a line, not an arbitrary character range (lyrics stay
// plain textareas — see the plan's disclosed rationale). This renders a
// left-margin gutter (hover "+" / comment-count badge per line), a tinted
// highlight layer behind the field for lines with open comments, and the
// textarea itself on top with a transparent background so the tint shows
// through. `wrap="off"` keeps one visual row per logical line so the gutter
// and highlight rows never drift out of alignment with wrapped text.
export function CommentableTextarea({
  value,
  onChange,
  onFocus,
  onBlur,
  onRequestComment,
  commentCounts,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onRequestComment: (lineIndex: number, quotedText: string) => void;
  commentCounts: Map<number, number>;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [selection, setSelection] = useState<{ line: number; text: string } | null>(null);

  const lines = useMemo(() => (value.length ? value.split("\n") : [""]), [value]);
  const rows = Math.max(3, lines.length);

  function handleSelect() {
    const el = textareaRef.current;
    if (!el) return;
    if (el.selectionStart === el.selectionEnd) {
      setSelection(null);
      return;
    }
    const line = lineIndexAt(value, el.selectionStart);
    const text = value.slice(el.selectionStart, el.selectionEnd);
    setSelection({ line, text });
  }

  return (
    <div className="relative flex">
      {/* Gutter */}
      <div
        className="relative shrink-0 w-6 pt-2"
        style={{ lineHeight: `${LINE_HEIGHT}px` }}
        onMouseLeave={() => setHoveredLine(null)}
      >
        {lines.map((_, i) => {
          const count = commentCounts.get(i) ?? 0;
          return (
            <div
              key={i}
              className="flex items-center justify-center"
              style={{ height: LINE_HEIGHT }}
              onMouseEnter={() => setHoveredLine(i)}
            >
              {count > 0 ? (
                <button
                  onClick={() => onRequestComment(i, lines[i] ?? "")}
                  className="flex items-center justify-center h-4 min-w-4 px-0.5 rounded-full bg-accent/20 text-accent text-[9px] font-semibold leading-none"
                  aria-label={`${count} comment${count > 1 ? "s" : ""} on line ${i + 1}`}
                  title={`${count} comment${count > 1 ? "s" : ""}`}
                >
                  {count}
                </button>
              ) : hoveredLine === i ? (
                <button
                  onClick={() => onRequestComment(i, lines[i] ?? "")}
                  className="flex items-center justify-center h-4 w-4 rounded-full text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                  aria-label={`Comment on line ${i + 1}`}
                >
                  <MessageSquarePlus size={12} />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Field: highlight layer behind a transparent textarea */}
      <div className="relative flex-1 min-w-0">
        <div
          aria-hidden
          className="absolute inset-0 pt-2 pointer-events-none"
          style={{ lineHeight: `${LINE_HEIGHT}px` }}
        >
          {lines.map((_, i) => (
            <div
              key={i}
              style={{ height: LINE_HEIGHT }}
              className={cn(
                "rounded-sm",
                (commentCounts.get(i) ?? 0) > 0 && "bg-accent/[0.07]"
              )}
            />
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelect}
          onFocus={onFocus}
          onBlur={() => {
            setSelection(null);
            onBlur?.();
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={rows}
          wrap="off"
          className="relative z-10 w-full resize-none whitespace-pre overflow-x-auto bg-transparent border-0 pt-2 text-[13.5px] text-ink placeholder:text-muted/60 focus:outline-none font-[inherit]"
          style={{ lineHeight: `${LINE_HEIGHT}px` }}
        />
        {selection && (
          <button
            onClick={() => {
              onRequestComment(selection.line, selection.text);
              setSelection(null);
            }}
            className="absolute top-1 right-1 z-20 inline-flex items-center gap-1 rounded-md bg-ink text-bg text-[10.5px] font-medium px-2 py-1 shadow-elevated"
          >
            <MessageSquarePlus size={11} /> Comment
          </button>
        )}
      </div>
    </div>
  );
}
