"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Music2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { SectionLabel } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { type Block } from "@/lib/mock";
import type { BlockMemberView } from "@/lib/data";
import { supabaseConfigured } from "@/lib/env";
import { useUser } from "@/hooks/use-user";
import { useRealtimeTable } from "@/hooks/use-realtime";
import { useMusicPlayer } from "@/components/player/music-player";
import {
  SONGWRITER_STATUSES,
  SONGWRITER_STATUS_LABELS,
  type SongwriterSectionKind,
} from "@/types";
import {
  addSongwriterCommentAction,
  addSongwriterContributorAction,
  addSongwriterLoopMarkerAction,
  addSongwriterSectionAction,
  attachInstrumentalAction,
  getSongwriterDataAction,
  removeInstrumentalAction,
  removeSongwriterCommentAction,
  removeSongwriterContributorAction,
  removeSongwriterLoopMarkerAction,
  removeSongwriterSectionAction,
  renameSongwriterSectionAction,
  reorderSongwriterSectionAction,
  resolveSongwriterCommentAction,
  updateSongwriterContributorRoleAction,
  updateSongwriterMetaAction,
  updateSongwriterSectionLyricsAction,
  type SongwriterCommentView,
  type SongwriterContributorView,
  type SongwriterLoopMarkerView,
  type SongwriterSectionView,
  type SongwriterView,
} from "@/app/actions/songwriter";
import { useSongPlayer } from "./use-song-player";
import { SongPlayerBar } from "./song-player";
import { PresenceRow } from "./presence-row";
import { ContributorsStrip } from "./contributors-strip";
import { SectionList } from "./section-list";
import { InspireModal } from "./inspire-modal";
import { LoopMarkersList } from "./loop-markers-list";
import { CommentsPanel, type DraftComment } from "./comments-panel";

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const FIELD_DEBOUNCE_MS = 700;

const avatarFor = (id: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${id}&backgroundColor=transparent`;

function localSection(id: string, position: number): SongwriterSectionView {
  return { id, kind: "verse", label: null, lyrics: "", position };
}

export function SongwriterPanel({
  block,
  members,
}: {
  block: Block;
  members: BlockMemberView[];
}) {
  const realBlock = supabaseConfigured && isUuid(block.id);
  const { user } = useUser();
  const globalPlayer = useMusicPlayer();

  const [loaded, setLoaded] = useState(!realBlock);
  const [docId, setDocId] = useState<string | null>(null);
  const [status, setStatus] = useState<SongwriterView["status"]>("idea");
  const [bpm, setBpm] = useState<number | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [instrumentalUrl, setInstrumentalUrl] = useState<string | null>(null);
  const [instrumentalName, setInstrumentalName] = useState<string | null>(null);
  const [sections, setSections] = useState<SongwriterSectionView[]>([]);
  const [loopMarkers, setLoopMarkers] = useState<SongwriterLoopMarkerView[]>([]);
  const [comments, setComments] = useState<SongwriterCommentView[]>([]);
  const [contributors, setContributors] = useState<SongwriterContributorView[]>([]);
  const [attaching, setAttaching] = useState(false);

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<DraftComment | null>(null);
  const [inspireSectionId, setInspireSectionId] = useState<string | null>(null);
  const [commentsSheetOpen, setCommentsSheetOpen] = useState(false);

  // Fields currently focused or with an unflushed/in-flight write are
  // protected from being overwritten by a realtime-triggered refresh (see
  // applyData below). Focus alone isn't enough: blurring clears focus
  // immediately, but the 700ms debounce can still be in flight, so a
  // refresh in that window would otherwise clobber the just-typed value
  // before it's ever persisted — these ref sets close that gap.
  const focusedSectionIdRef = useRef<string | null>(null);
  const pendingLyricsRef = useRef<Set<string>>(new Set());
  const focusedMetaFieldRef = useRef<Set<"bpm" | "key" | "genre">>(new Set());
  const pendingMetaFieldsRef = useRef<Set<"bpm" | "key" | "genre">>(new Set());
  // Tracks the instrumental's name (not its signed URL, which is re-issued —
  // and therefore a different string — on every fetch even when the
  // underlying asset hasn't changed) so applyData can tell whether the
  // instrumental actually changed or refresh() just ran again.
  const instrumentalNameRef = useRef<string | null>(null);
  const player = useSongPlayer(instrumentalUrl);

  // Pause the app-wide discovery player once, on mount, so it never overlaps
  // with the Songwriter instrumental — playback stays otherwise independent.
  const pausedGlobalRef = useRef(false);
  useEffect(() => {
    if (!pausedGlobalRef.current && globalPlayer.playing) {
      pausedGlobalRef.current = true;
      globalPlayer.toggle();
    }
  }, [globalPlayer]);

  const applyData = useCallback((data: SongwriterView) => {
    setDocId(data.docId);
    setStatus(data.status);

    setBpm((prev) =>
      focusedMetaFieldRef.current.has("bpm") || pendingMetaFieldsRef.current.has("bpm")
        ? prev
        : data.bpm
    );
    setKey((prev) =>
      focusedMetaFieldRef.current.has("key") || pendingMetaFieldsRef.current.has("key")
        ? prev
        : data.key
    );
    setGenre((prev) =>
      focusedMetaFieldRef.current.has("genre") || pendingMetaFieldsRef.current.has("genre")
        ? prev
        : data.genre
    );

    // Only adopt the freshly-signed instrumental URL when the underlying
    // asset actually changed (compared by name) — otherwise every unrelated
    // refresh would hand the <audio> element a brand-new URL string for the
    // same file, and use-song-player's [src] effect would reload it,
    // resetting playback position mid-listen.
    setInstrumentalUrl((prevUrl) =>
      prevUrl && data.instrumentalName === instrumentalNameRef.current
        ? prevUrl
        : data.instrumentalUrl
    );
    instrumentalNameRef.current = data.instrumentalName;
    setInstrumentalName(data.instrumentalName);

    setLoopMarkers(data.loopMarkers);
    setComments(data.comments);
    setContributors(data.contributors);
    setSections((prev) => {
      const focused = focusedSectionIdRef.current;
      const pending = pendingLyricsRef.current;
      return data.sections.map((s) => {
        if (s.id === focused || pending.has(s.id)) {
          const existing = prev.find((p) => p.id === s.id);
          if (existing) return { ...s, lyrics: existing.lyrics };
        }
        return s;
      });
    });
  }, []);

  const refresh = useCallback(async () => {
    const data = await getSongwriterDataAction(block.slug);
    if (data) applyData(data);
  }, [block.slug, applyData]);

  // Realtime-triggered refreshes are coalesced: 5 tables all funnel into the
  // same full-doc refetch, so a burst of events arriving close together
  // (e.g. several collaborators' debounced lyric writes landing seconds
  // apart) would otherwise fire one independent refetch per event. A short
  // trailing debounce collapses a burst into a single refetch. The initial
  // load (below) calls refresh() directly so first paint isn't delayed.
  const realtimeRefreshTimer = useRef<ReturnType<typeof setTimeout>>();
  const debouncedRefresh = useCallback(() => {
    clearTimeout(realtimeRefreshTimer.current);
    realtimeRefreshTimer.current = setTimeout(() => {
      refresh();
    }, 400);
  }, [refresh]);

  useEffect(() => {
    if (!realBlock) {
      setSections([localSection("local-1", 1)]);
      setLoaded(true);
      return;
    }
    (async () => {
      await refresh();
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realBlock, block.slug]);

  useRealtimeTable<Record<string, unknown>>(
    "songwriter_sections",
    debouncedRefresh,
    docId ? `doc_id=eq.${docId}` : undefined,
    "*",
    realBlock && !!docId
  );
  useRealtimeTable<Record<string, unknown>>(
    "songwriter_loop_markers",
    debouncedRefresh,
    docId ? `doc_id=eq.${docId}` : undefined,
    "*",
    realBlock && !!docId
  );
  useRealtimeTable<Record<string, unknown>>(
    "songwriter_comments",
    debouncedRefresh,
    docId ? `doc_id=eq.${docId}` : undefined,
    "*",
    realBlock && !!docId
  );
  useRealtimeTable<Record<string, unknown>>(
    "songwriter_contributors",
    debouncedRefresh,
    docId ? `doc_id=eq.${docId}` : undefined,
    "*",
    realBlock && !!docId
  );
  useRealtimeTable<Record<string, unknown>>(
    "songwriter_docs",
    debouncedRefresh,
    docId ? `id=eq.${docId}` : undefined,
    "UPDATE",
    realBlock && !!docId
  );

  // ---------- meta (status / bpm / key / genre) ----------

  // Per-field timers — a single shared timer would let editing Key within
  // 700ms of editing BPM cancel and silently drop the BPM write, since
  // clearTimeout+reschedule on one field would clobber the other's pending
  // call. Mirrors the per-key Map pattern used for lyrics below.
  type MetaField = "bpm" | "key" | "genre";
  const metaTimers = useRef<Map<MetaField, ReturnType<typeof setTimeout>>>(new Map());

  function patchMetaDebounced(
    field: MetaField,
    patch: Partial<{ bpm: number | null; key: string | null; genre: string | null }>
  ) {
    if (!docId || !realBlock) return;
    pendingMetaFieldsRef.current.add(field);
    const existing = metaTimers.current.get(field);
    if (existing) clearTimeout(existing);
    metaTimers.current.set(
      field,
      setTimeout(async () => {
        metaTimers.current.delete(field);
        try {
          await updateSongwriterMetaAction(block.slug, docId, patch);
        } finally {
          pendingMetaFieldsRef.current.delete(field);
        }
      }, FIELD_DEBOUNCE_MS)
    );
  }

  function onFocusMeta(field: MetaField) {
    focusedMetaFieldRef.current.add(field);
  }

  function onBlurMeta(field: MetaField) {
    focusedMetaFieldRef.current.delete(field);
  }

  function onStatusChange(next: SongwriterView["status"]) {
    setStatus(next);
    if (!docId || !realBlock) return;
    updateSongwriterMetaAction(block.slug, docId, { status: next }).catch(() => {});
  }

  function onBpmChange(value: string) {
    const n = value === "" ? null : Number(value);
    const next = Number.isFinite(n) ? n : null;
    setBpm(next);
    patchMetaDebounced("bpm", { bpm: next });
  }

  function onKeyChange(value: string) {
    const next = value || null;
    setKey(next);
    patchMetaDebounced("key", { key: next });
  }

  function onGenreChange(value: string) {
    const next = value || null;
    setGenre(next);
    patchMetaDebounced("genre", { genre: next });
  }

  async function handleAttach(file: File) {
    if (!docId) return;
    setAttaching(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await attachInstrumentalAction(block.slug, docId, fd);
    if (res.ok) {
      instrumentalNameRef.current = res.name;
      setInstrumentalUrl(res.url);
      setInstrumentalName(res.name);
    }
    setAttaching(false);
  }

  function handleRemoveInstrumental() {
    instrumentalNameRef.current = null;
    setInstrumentalUrl(null);
    setInstrumentalName(null);
    if (docId && realBlock) {
      removeInstrumentalAction(block.slug, docId).catch(() => {});
    }
  }

  // ---------- sections ----------

  const lyricsTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function onLyricsChange(sectionId: string, lyrics: string) {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, lyrics } : s)));
    if (!realBlock) return;
    pendingLyricsRef.current.add(sectionId);
    const existing = lyricsTimers.current.get(sectionId);
    if (existing) clearTimeout(existing);
    lyricsTimers.current.set(
      sectionId,
      setTimeout(async () => {
        lyricsTimers.current.delete(sectionId);
        try {
          await updateSongwriterSectionLyricsAction(block.slug, sectionId, lyrics);
        } finally {
          pendingLyricsRef.current.delete(sectionId);
        }
      }, FIELD_DEBOUNCE_MS)
    );
  }

  function onRenameSection(sectionId: string, label: string) {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, label } : s)));
    if (!realBlock) return;
    renameSongwriterSectionAction(block.slug, sectionId, label).catch(() => {});
  }

  function onReorderSection(sectionId: string, newPosition: number) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, position: newPosition } : s))
    );
    if (!realBlock) return;
    reorderSongwriterSectionAction(block.slug, sectionId, newPosition).catch(() => {});
  }

  async function onAddSection(kind: SongwriterSectionKind, label?: string) {
    const maxPosition = sections.reduce((m, s) => Math.max(m, s.position), 0);
    const tempId = `local-${Date.now()}`;
    setSections((prev) => [
      ...prev,
      { id: tempId, kind, label: label ?? null, lyrics: "", position: maxPosition + 1 },
    ]);
    if (!docId || !realBlock) return;
    const res = await addSongwriterSectionAction(block.slug, docId, kind, label ?? null);
    if (res.ok) await refresh();
    else setSections((prev) => prev.filter((s) => s.id !== tempId));
  }

  function onDeleteSection(sectionId: string) {
    if (focusedSectionIdRef.current === sectionId) focusedSectionIdRef.current = null;
    pendingLyricsRef.current.delete(sectionId);
    const timer = lyricsTimers.current.get(sectionId);
    if (timer) clearTimeout(timer);
    lyricsTimers.current.delete(sectionId);
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    if (realBlock) removeSongwriterSectionAction(block.slug, sectionId).catch(() => {});
  }

  function onToggleCollapse(sectionId: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else {
        // Collapsing unmounts the textarea without firing its blur handler,
        // so the focus ref would otherwise stay pinned to a now-hidden
        // section forever, permanently blocking it from realtime updates.
        next.add(sectionId);
        if (focusedSectionIdRef.current === sectionId) focusedSectionIdRef.current = null;
      }
      return next;
    });
  }

  function onFocusSection(sectionId: string) {
    focusedSectionIdRef.current = sectionId;
  }

  function onBlurSection(sectionId: string) {
    if (focusedSectionIdRef.current === sectionId) focusedSectionIdRef.current = null;
  }

  // ---------- comments ----------

  function onRequestComment(sectionId: string, lineIndex: number, quotedText: string) {
    setDraft({ sectionId, lineIndex, quotedText });
    setCommentsSheetOpen(true);
  }

  async function onSubmitComment(input: {
    sectionId: string;
    parentCommentId?: string | null;
    lineIndex: number;
    quotedText: string | null;
    body: string;
  }) {
    const tempId = `local-${Date.now()}`;
    const optimistic: SongwriterCommentView = {
      id: tempId,
      sectionId: input.sectionId,
      parentCommentId: input.parentCommentId ?? null,
      lineIndex: input.lineIndex,
      quotedText: input.quotedText,
      body: input.body,
      authorId: user?.id ?? null,
      authorName:
        (user?.user_metadata?.display_name as string) ?? user?.email?.split("@")[0] ?? "You",
      authorAvatar:
        (user?.user_metadata?.avatar_url as string) ?? avatarFor(user?.id ?? tempId),
      resolved: false,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, optimistic]);
    if (!docId || !realBlock) return;
    const res = await addSongwriterCommentAction(block.slug, { docId, ...input });
    if (res.ok) await refresh();
  }

  function onResolveComment(commentId: string, resolved: boolean) {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, resolved } : c))
    );
    if (realBlock) resolveSongwriterCommentAction(block.slug, commentId, resolved).catch(() => {});
  }

  function onJumpToSection(sectionId: string) {
    setCollapsedIds((prev) => {
      if (!prev.has(sectionId)) return prev;
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
    setTimeout(() => {
      document
        .getElementById(`songwriter-section-${sectionId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  // ---------- loop markers ----------

  async function onSaveLoopMarker(name: string, startSeconds: number, endSeconds: number) {
    const optimistic: SongwriterLoopMarkerView = {
      id: `local-${Date.now()}`,
      name,
      startSeconds,
      endSeconds,
    };
    setLoopMarkers((prev) => [...prev, optimistic]);
    if (!docId || !realBlock) return;
    const res = await addSongwriterLoopMarkerAction(block.slug, docId, name, startSeconds, endSeconds);
    if (res.ok) await refresh();
  }

  function onRemoveLoopMarker(markerId: string) {
    setLoopMarkers((prev) => prev.filter((m) => m.id !== markerId));
    if (realBlock) removeSongwriterLoopMarkerAction(block.slug, markerId).catch(() => {});
  }

  // ---------- contributors ----------

  async function onAddContributor(input: { userId: string; displayName: string; role: string }) {
    const optimistic: SongwriterContributorView = {
      id: `local-${Date.now()}`,
      userId: input.userId,
      displayName: input.displayName,
      avatar: avatarFor(input.userId),
      role: input.role,
    };
    setContributors((prev) => [...prev, optimistic]);
    if (!docId || !realBlock) return;
    const res = await addSongwriterContributorAction(block.slug, docId, input);
    if (res.ok) await refresh();
  }

  function onRemoveContributor(contributorId: string) {
    setContributors((prev) => prev.filter((c) => c.id !== contributorId));
    if (realBlock) removeSongwriterContributorAction(block.slug, contributorId).catch(() => {});
  }

  function onUpdateContributorRole(contributorId: string, role: string) {
    setContributors((prev) =>
      prev.map((c) => (c.id === contributorId ? { ...c, role } : c))
    );
    if (realBlock) {
      updateSongwriterContributorRoleAction(block.slug, contributorId, role).catch(() => {});
    }
  }

  // ---------- inspire ----------

  const inspireSection = sections.find((s) => s.id === inspireSectionId) ?? null;
  const inspireContext = useMemo(
    () => ({
      songTitle: block.title,
      status,
      bpm,
      key,
      genre,
      sectionLabel: inspireSection
        ? inspireSection.label ?? inspireSection.kind
        : "",
      sectionLyrics: inspireSection?.lyrics ?? "",
    }),
    [block.title, status, bpm, key, genre, inspireSection]
  );

  function onUseSuggestion(text: string) {
    if (!inspireSectionId) return;
    const current = sections.find((s) => s.id === inspireSectionId);
    const merged = current?.lyrics ? `${current.lyrics}\n\n${text}` : text;
    onLyricsChange(inspireSectionId, merged);
  }

  const commentsPanelNode = (
    <CommentsPanel
      comments={comments}
      sections={sections}
      draft={draft}
      onClearDraft={() => setDraft(null)}
      onSubmit={onSubmitComment}
      onResolve={onResolveComment}
      onJumpToSection={onJumpToSection}
    />
  );

  const unresolvedCommentCount = useMemo(
    () => comments.filter((c) => !c.resolved).length,
    [comments]
  );

  if (!loaded) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="page-fluid pt-5 pb-4 space-y-4 border-b border-line shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionLabel className="flex items-center gap-2">
              <Music2 size={11} className="text-accent" /> {block.title}
            </SectionLabel>
            <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
              Songwriter
            </h2>
          </div>
          {docId && <PresenceRow docId={docId} />}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LabeledSelect
            label="Status"
            value={status}
            onChange={(v) => onStatusChange(v as SongwriterView["status"])}
            options={SONGWRITER_STATUSES.map((s) => [s, SONGWRITER_STATUS_LABELS[s]])}
          />
          <LabeledInput
            label="BPM"
            value={bpm ?? ""}
            onChange={onBpmChange}
            onFocus={() => onFocusMeta("bpm")}
            onBlur={() => onBlurMeta("bpm")}
            width="w-16"
            type="number"
          />
          <LabeledInput
            label="Key"
            value={key ?? ""}
            onChange={onKeyChange}
            onFocus={() => onFocusMeta("key")}
            onBlur={() => onBlurMeta("key")}
            width="w-24"
            placeholder="A Minor"
          />
          <LabeledInput
            label="Genre"
            value={genre ?? ""}
            onChange={onGenreChange}
            onFocus={() => onFocusMeta("genre")}
            onBlur={() => onBlurMeta("genre")}
            width="w-28"
            placeholder="R&B"
          />

          <button
            onClick={() => setCommentsSheetOpen(true)}
            className="lg:hidden ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] text-ink hover:bg-surface-2 transition-colors"
          >
            <MessageCircle size={12} />
            Comments{unresolvedCommentCount > 0 && ` (${unresolvedCommentCount})`}
          </button>
        </div>

        <ContributorsStrip
          contributors={contributors}
          members={members}
          onAdd={onAddContributor}
          onRemove={onRemoveContributor}
          onUpdateRole={onUpdateContributorRole}
        />

        <SongPlayerBar
          player={player}
          instrumentalName={instrumentalName}
          onAttach={handleAttach}
          onRemove={handleRemoveInstrumental}
          attaching={attaching}
        />
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 overflow-y-auto page-fluid py-4 space-y-5">
          <SectionList
            sections={sections}
            comments={comments}
            collapsedIds={collapsedIds}
            onToggleCollapse={onToggleCollapse}
            onLyricsChange={onLyricsChange}
            onRename={onRenameSection}
            onDelete={onDeleteSection}
            onFocusSection={onFocusSection}
            onBlurSection={onBlurSection}
            onRequestComment={onRequestComment}
            onInspire={setInspireSectionId}
            onReorder={onReorderSection}
            onAddSection={onAddSection}
          />
          <LoopMarkersList
            markers={loopMarkers}
            player={player}
            onSave={onSaveLoopMarker}
            onRemove={onRemoveLoopMarker}
          />
        </div>

        <div className="hidden lg:flex w-80 shrink-0 border-l border-line">
          {commentsPanelNode}
        </div>
      </div>

      <Dialog
        open={commentsSheetOpen}
        onClose={() => setCommentsSheetOpen(false)}
        title="Comments"
        size="lg"
        mobilePlacement="sheet"
      >
        <div className="h-[60vh]">{commentsPanelNode}</div>
      </Dialog>

      <InspireModal
        open={!!inspireSectionId}
        onClose={() => setInspireSectionId(null)}
        context={inspireContext}
        onUse={onUseSuggestion}
      />
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  width,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  width: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[10.5px] uppercase tracking-wide text-muted font-medium">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className={cn(
          "h-7 rounded-md bg-surface-2 border border-line px-2 text-[12.5px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent/50",
          width
        )}
      />
    </label>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[10.5px] uppercase tracking-wide text-muted font-medium">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 rounded-md bg-surface-2 border border-line px-2 text-[12.5px] text-ink focus:outline-none focus:border-accent/50"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
