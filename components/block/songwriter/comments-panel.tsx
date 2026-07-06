"use client";

import { useMemo, useState } from "react";
import { Check, MessageCircle, RotateCcw, X } from "lucide-react";
import { Avatar, Button } from "@/components/ui/primitives";
import { SONGWRITER_SECTION_LABELS } from "@/types";
import type { SongwriterCommentView, SongwriterSectionView } from "@/app/actions/songwriter";

export type DraftComment = { sectionId: string; lineIndex: number; quotedText: string };

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(0, Math.floor(ms / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function CommentsPanel({
  comments,
  sections,
  draft,
  onClearDraft,
  onSubmit,
  onResolve,
  onJumpToSection,
}: {
  comments: SongwriterCommentView[];
  sections: SongwriterSectionView[];
  draft: DraftComment | null;
  onClearDraft: () => void;
  onSubmit: (input: {
    sectionId: string;
    parentCommentId?: string | null;
    lineIndex: number;
    quotedText: string | null;
    body: string;
  }) => void;
  onResolve: (commentId: string, resolved: boolean) => void;
  onJumpToSection: (sectionId: string) => void;
}) {
  const [showResolved, setShowResolved] = useState(false);
  const [draftBody, setDraftBody] = useState("");
  const [replyBody, setReplyBody] = useState<Record<string, string>>({});
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null);

  const sectionLabel = (id: string) => {
    const s = sections.find((x) => x.id === id);
    if (!s) return "Section";
    return s.label ?? SONGWRITER_SECTION_LABELS[s.kind];
  };

  // Grouping only depends on `comments`; splitting it out means toggling
  // "Show resolved" (a pure display filter) doesn't rebuild the parent/child
  // map from scratch every time.
  const { roots, byParent } = useMemo(() => {
    const roots: SongwriterCommentView[] = [];
    const byParent = new Map<string, SongwriterCommentView[]>();
    for (const c of comments) {
      if (!c.parentCommentId) {
        roots.push(c);
        continue;
      }
      const list = byParent.get(c.parentCommentId) ?? [];
      list.push(c);
      byParent.set(c.parentCommentId, list);
    }
    return { roots, byParent };
  }, [comments]);

  const threads = useMemo(
    () =>
      roots
        .filter((r) => showResolved || !r.resolved)
        .sort((a, b) => Number(a.resolved) - Number(b.resolved))
        .map((root) => ({ root, replies: byParent.get(root.id) ?? [] })),
    [roots, byParent, showResolved]
  );

  function submitDraft() {
    if (!draft || !draftBody.trim()) return;
    onSubmit({
      sectionId: draft.sectionId,
      lineIndex: draft.lineIndex,
      quotedText: draft.quotedText || null,
      body: draftBody.trim(),
    });
    setDraftBody("");
    onClearDraft();
  }

  function submitReply(rootId: string, sectionId: string, lineIndex: number) {
    const body = (replyBody[rootId] ?? "").trim();
    if (!body) return;
    onSubmit({ sectionId, parentCommentId: rootId, lineIndex, quotedText: null, body });
    setReplyBody((r) => ({ ...r, [rootId]: "" }));
    setReplyOpenFor(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
        <span className="text-[12.5px] font-medium text-ink">Comments</span>
        <button
          onClick={() => setShowResolved((s) => !s)}
          className="text-[11px] text-muted hover:text-ink transition-colors"
        >
          {showResolved ? "Hide resolved" : "Show resolved"}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {draft && (
          <div className="rounded-lg border border-accent/40 bg-accent/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-accent font-medium">
                {sectionLabel(draft.sectionId)} · line {draft.lineIndex + 1}
              </span>
              <button onClick={onClearDraft} aria-label="Cancel comment" className="text-muted hover:text-ink">
                <X size={12} />
              </button>
            </div>
            {draft.quotedText && (
              <p className="text-[11.5px] text-muted italic truncate">"{draft.quotedText}"</p>
            )}
            <textarea
              autoFocus
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              placeholder="Leave a comment…"
              rows={2}
              className="w-full resize-none rounded-md bg-surface-2 border border-line px-2.5 py-1.5 text-[12.5px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent/50"
            />
            <Button variant="accent" size="sm" onClick={submitDraft} disabled={!draftBody.trim()}>
              Comment
            </Button>
          </div>
        )}

        {threads.length === 0 && !draft && (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2 text-muted">
            <MessageCircle size={18} />
            <p className="text-[12px]">
              No comments yet. Select a line or click the margin to leave one.
            </p>
          </div>
        )}

        {threads.map(({ root, replies }) => (
          <div key={root.id} className="rounded-lg border border-line p-3 space-y-2">
            <button
              onClick={() => onJumpToSection(root.sectionId)}
              className="text-[10.5px] text-accent hover:underline"
            >
              {sectionLabel(root.sectionId)} · line {root.lineIndex + 1}
            </button>
            {root.quotedText && (
              <p className="text-[11.5px] text-muted italic truncate">"{root.quotedText}"</p>
            )}

            <CommentRow comment={root} />

            {replies.map((r) => (
              <div key={r.id} className="pl-4 border-l border-line ml-1.5">
                <CommentRow comment={r} />
              </div>
            ))}

            <div className="flex items-center gap-2 pt-1">
              {replyOpenFor === root.id ? (
                <span className="flex-1 flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={replyBody[root.id] ?? ""}
                    onChange={(e) =>
                      setReplyBody((r) => ({ ...r, [root.id]: e.target.value }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && submitReply(root.id, root.sectionId, root.lineIndex)
                    }
                    placeholder="Reply…"
                    className="flex-1 min-w-0 bg-surface-2 border border-line rounded-md px-2 py-1 text-[11.5px] text-ink focus:outline-none focus:border-accent/50"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => submitReply(root.id, root.sectionId, root.lineIndex)}
                  >
                    Send
                  </Button>
                </span>
              ) : (
                <button
                  onClick={() => setReplyOpenFor(root.id)}
                  className="text-[11px] text-muted hover:text-ink transition-colors"
                >
                  Reply
                </button>
              )}
              <div className="flex-1" />
              <Button
                variant={root.resolved ? "outline" : "ghost"}
                size="sm"
                onClick={() => onResolve(root.id, !root.resolved)}
              >
                {root.resolved ? <RotateCcw size={11} /> : <Check size={11} />}
                {root.resolved ? "Reopen" : "Resolve"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentRow({ comment }: { comment: SongwriterCommentView }) {
  return (
    <div className="flex items-start gap-2">
      <Avatar src={comment.authorAvatar} name={comment.authorName} size={20} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11.5px] font-medium text-ink">{comment.authorName}</span>
          <span className="text-[10px] text-muted">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-[12.5px] text-ink leading-relaxed whitespace-pre-wrap">
          {comment.body}
        </p>
      </div>
    </div>
  );
}
