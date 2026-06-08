"use client";

import {
  useRef,
  useState,
  useTransition,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  Check,
  GripVertical,
  Loader2,
  Pin,
  PinOff,
  Play,
  Plus,
  Quote,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  CONTENT_TYPES,
  contentMeta,
  isDirectAudio,
  isVideoType,
  itemTitle,
  newContentId,
  sortShowcase,
  tileThumb,
  youtubeEmbed,
  youtubeId,
  type ContentType,
  type FeaturedContentItem,
} from "@/lib/featured-content";
import {
  IMAGE_ACCEPT,
  uploadToAvatars,
  validateImageFile,
} from "@/lib/upload-image";
import { updateShowcaseAction } from "@/app/actions/showcase";

const SLOTS = 9; // 3×3

// ── Block Showcase — the profile banner's interactive 3×3 portfolio grid.
// Visitors: click any tile to open it in a lightbox. Owners: add content into
// empty tiles, drag to reorder, pin, edit, and remove — all persisted. ───────
export function BlockShowcase({
  initialItems,
  isOwner,
}: {
  initialItems: FeaturedContentItem[];
  isOwner: boolean;
}) {
  const [items, setItems] = useState<FeaturedContentItem[]>(() =>
    sortShowcase(initialItems).slice(0, SLOTS)
  );
  const [lightbox, setLightbox] = useState<FeaturedContentItem | null>(null);
  const [editing, setEditing] = useState<FeaturedContentItem | "new" | null>(
    null
  );
  const [saving, startSave] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function persist(next: FeaturedContentItem[]) {
    const sorted = sortShowcase(next).slice(0, SLOTS);
    setItems(sorted);
    setSaveError(null);
    startSave(async () => {
      const res = await updateShowcaseAction(sorted);
      if (!res.ok) setSaveError(res.error);
    });
  }

  function upsert(item: FeaturedContentItem) {
    const exists = items.some((i) => i.id === item.id);
    persist(exists ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item]);
    setEditing(null);
  }
  function remove(id: string) {
    persist(items.filter((i) => i.id !== id));
  }
  function togglePin(id: string) {
    persist(items.map((i) => (i.id === id ? { ...i, pinned: !i.pinned } : i)));
  }
  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    // Manual order overrides pin sorting: clear pins so the new order sticks.
    persist(next.map((i) => ({ ...i, pinned: false })));
  }

  // Always render 9 slots for owners (empties = Add Content). Visitors see the
  // real tiles, padded with subtle placeholders so the grid keeps its shape.
  const filled = items.slice(0, SLOTS);
  const slots: (FeaturedContentItem | null)[] = Array.from(
    { length: SLOTS },
    (_, i) => filled[i] ?? null
  );

  return (
    <div className="flex h-full flex-col">
      <div className="grid h-full grid-cols-3 grid-rows-3 gap-2">
        {slots.map((item, i) =>
          item ? (
            <Tile
              key={item.id}
              item={item}
              isOwner={isOwner}
              dragging={dragOver === i}
              onOpen={() => setLightbox(item)}
              onEdit={() => setEditing(item)}
              onRemove={() => remove(item.id)}
              onPin={() => togglePin(item.id)}
              draggable={isOwner}
              onDragStart={() => (dragFrom.current = i)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(i);
              }}
              onDrop={() => {
                if (dragFrom.current !== null) reorder(dragFrom.current, i);
                dragFrom.current = null;
                setDragOver(null);
              }}
              onDragEnd={() => {
                dragFrom.current = null;
                setDragOver(null);
              }}
            />
          ) : (
            <EmptyTile
              key={`empty-${i}`}
              isOwner={isOwner}
              onAdd={() => setEditing("new")}
            />
          )
        )}
      </div>

      {/* Save status (owner only) */}
      {isOwner && (saving || saveError) && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          {saving ? (
            <span className="inline-flex items-center gap-1.5 text-white/70">
              <Loader2 size={12} className="animate-spin" /> Saving showcase…
            </span>
          ) : (
            <span className="text-danger">{saveError}</span>
          )}
        </div>
      )}

      {lightbox && (
        <Lightbox item={lightbox} onClose={() => setLightbox(null)} />
      )}
      {editing && (
        <ShowcaseEditor
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={upsert}
        />
      )}
    </div>
  );
}

// ── A single showcase tile ──────────────────────────────────────────────────
function Tile({
  item,
  isOwner,
  dragging,
  onOpen,
  onEdit,
  onRemove,
  onPin,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  item: FeaturedContentItem;
  isOwner: boolean;
  dragging: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onPin: () => void;
  draggable: boolean;
  onDragStart: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const meta = contentMeta(item.type);
  const thumb = tileThumb(item);
  const title = itemTitle(item);
  const showPlay =
    isVideoType(item.type) ||
    item.type === "video" ||
    item.type === "audio" ||
    item.type === "song";

  return (
    <div
      className={cn(
        "group relative min-h-0 overflow-hidden rounded-xl border border-white/12 bg-white/[0.04] cursor-pointer transition-all",
        "hover:border-white/30 hover:shadow-[0_8px_24px_rgb(0_0_0/0.35)]",
        dragging && "ring-2 ring-accent/80 scale-[0.97]"
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {/* Visual */}
      {item.type === "testimonial" ? (
        <div className="absolute inset-0 flex flex-col justify-center gap-1.5 bg-gradient-to-br from-success/15 to-white/[0.02] p-3">
          <Quote size={16} className="text-success shrink-0" />
          <p className="text-[11px] leading-snug text-white/90 line-clamp-4">
            {item.body || title}
          </p>
        </div>
      ) : thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
      ) : (
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/[0.08] to-white/[0.01]",
            meta.accent
          )}
        >
          <meta.Icon size={26} />
        </span>
      )}

      {/* Scrim + labels */}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      {showPlay && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm border border-white/25 text-white">
            <Play size={14} className="fill-current ml-0.5" />
          </span>
        </span>
      )}

      <span className="pointer-events-none absolute top-1.5 left-1.5 inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-black/55 backdrop-blur-sm border border-white/15 text-white text-[9px] font-bold uppercase tracking-wide">
        <meta.Icon size={9} /> {meta.badge}
      </span>

      {item.pinned && (
        <span className="pointer-events-none absolute top-1.5 right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-warning/85 text-black">
          <Pin size={10} className="fill-current" />
        </span>
      )}

      <span className="pointer-events-none absolute inset-x-1.5 bottom-1.5">
        <span className="block text-[10.5px] font-semibold text-white leading-tight line-clamp-1 drop-shadow">
          {title}
        </span>
        {item.subtitle && (
          <span className="block text-[9px] text-white/70 line-clamp-1">
            {item.subtitle}
          </span>
        )}
      </span>

      {/* Owner controls (hover) */}
      {isOwner && (
        <div
          className="absolute inset-x-1 top-1 z-10 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="mr-auto inline-flex h-6 w-6 cursor-grab items-center justify-center rounded-md bg-black/55 border border-white/15 text-white/80">
            <GripVertical size={12} />
          </span>
          <CtrlBtn title={item.pinned ? "Unpin" : "Pin"} onClick={onPin}>
            {item.pinned ? <PinOff size={11} /> : <Pin size={11} />}
          </CtrlBtn>
          <CtrlBtn title="Edit" onClick={onEdit}>
            <Star size={11} />
          </CtrlBtn>
          <CtrlBtn title="Remove" onClick={onRemove} danger>
            <Trash2 size={11} />
          </CtrlBtn>
        </div>
      )}
    </div>
  );
}

function CtrlBtn({
  children,
  title,
  onClick,
  danger,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-md border text-white transition-colors",
        danger
          ? "bg-danger/70 border-danger/60 hover:bg-danger"
          : "bg-black/55 border-white/15 hover:bg-black/80"
      )}
    >
      {children}
    </button>
  );
}

// ── Empty slot ──────────────────────────────────────────────────────────────
function EmptyTile({
  isOwner,
  onAdd,
}: {
  isOwner: boolean;
  onAdd: () => void;
}) {
  if (!isOwner) {
    return (
      <div className="min-h-0 rounded-xl border border-dashed border-white/10 bg-white/[0.015]" />
    );
  }
  return (
    <button
      type="button"
      onClick={onAdd}
      className="group flex min-h-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 bg-white/[0.03] text-white/55 transition-colors hover:border-accent/60 hover:bg-accent/10 hover:text-white"
    >
      <Plus size={16} />
      <span className="text-[10px] font-semibold">Add Content</span>
    </button>
  );
}

// ── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({
  item,
  onClose,
}: {
  item: FeaturedContentItem;
  onClose: () => void;
}) {
  const meta = contentMeta(item.type);
  const title = itemTitle(item);
  const ytId = isVideoType(item.type) ? youtubeId(item.url) : null;
  const internal = item.url?.startsWith("/");

  return (
    <Overlay onClose={onClose}>
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/12 bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-black">
          {ytId ? (
            <iframe
              src={youtubeEmbed(ytId)}
              title={title}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full"
            />
          ) : item.type === "image" || (item.thumbnail && !item.url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url || item.thumbnail}
              alt={title}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : item.type === "audio" || item.type === "song" ? (
            <div className="flex flex-col items-center gap-4 px-6 py-12">
              {item.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnail}
                  alt=""
                  className="h-32 w-32 rounded-xl object-cover"
                />
              )}
              <p className="text-[15px] font-semibold text-white">{title}</p>
              {isDirectAudio(item.url) ? (
                <audio controls src={item.url} className="w-full max-w-md" />
              ) : (
                <OpenLink url={item.url} internal={internal} label="Listen" />
              )}
            </div>
          ) : item.type === "testimonial" ? (
            <div className="flex flex-col gap-4 bg-gradient-to-br from-success/12 to-transparent px-8 py-12">
              <Quote size={28} className="text-success" />
              <p className="text-[17px] leading-relaxed text-white">
                {item.body || title}
              </p>
              <p className="text-[13px] font-semibold text-white/70">
                — {item.title || "A collaborator"}
                {item.subtitle ? `, ${item.subtitle}` : ""}
              </p>
            </div>
          ) : (
            // Link-style content (portfolio, video, service, block, release, party,
            // instagram, tiktok): a rich preview that opens the source.
            <div className="relative flex aspect-video items-center justify-center">
              {item.thumbnail ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-70"
                  />
                  <span className="absolute inset-0 bg-black/45" />
                </>
              ) : (
                <span className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent" />
              )}
              <div className="relative flex flex-col items-center gap-3 text-center px-6">
                <span
                  className={cn(
                    "inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/15",
                    meta.accent
                  )}
                >
                  <meta.Icon size={26} />
                </span>
                <OpenLink
                  url={item.url}
                  internal={internal}
                  label={`Open ${meta.label}`}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm border border-white/20 text-white hover:bg-black/80"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3 px-5 py-3.5">
          <span
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10",
              meta.accent
            )}
          >
            <meta.Icon size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
              {meta.label}
            </p>
            <p className="truncate text-[14px] font-semibold text-ink">{title}</p>
          </div>
          {item.url && item.type !== "testimonial" && (
            <OpenLink url={item.url} internal={internal} label="Open" compact />
          )}
        </div>
      </div>
    </Overlay>
  );
}

function OpenLink({
  url,
  internal,
  label,
  compact,
}: {
  url: string;
  internal?: boolean;
  label: string;
  compact?: boolean;
}) {
  const cls = cn(
    "inline-flex items-center gap-1.5 rounded-lg bg-accent font-semibold text-white transition-colors hover:bg-accent/90",
    compact ? "h-9 px-3.5 text-[12.5px]" : "h-10 px-5 text-[13px]"
  );
  return (
    <a
      href={url}
      {...(internal ? {} : { target: "_blank", rel: "noreferrer" })}
      style={{ color: "#FFFFFF" }}
      className={cls}
    >
      {label}
    </a>
  );
}

// ── Add / Edit modal ────────────────────────────────────────────────────────
function ShowcaseEditor({
  item,
  onClose,
  onSave,
}: {
  item: FeaturedContentItem | null;
  onClose: () => void;
  onSave: (item: FeaturedContentItem) => void;
}) {
  const [type, setType] = useState<ContentType>(item?.type ?? "image");
  const [url, setUrl] = useState(item?.url ?? "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [subtitle, setSubtitle] = useState(item?.subtitle ?? "");
  const [body, setBody] = useState(item?.body ?? "");
  const [thumbnail, setThumbnail] = useState(item?.thumbnail ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const meta = contentMeta(type);
  const isText = meta.input === "text";
  const isImage = type === "image";

  async function onFile(file: File, target: "content" | "thumb") {
    setError(null);
    const invalid = validateImageFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadToAvatars(file, "portfolio");
      if (!uploaded) {
        setError("Upload didn't complete. Try again.");
        return;
      }
      if (target === "content") {
        setUrl(uploaded);
        setThumbnail(uploaded);
      } else {
        setThumbnail(uploaded);
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    if (isText) {
      if (!body.trim()) {
        setError("Add the testimonial text.");
        return;
      }
    } else if (isImage) {
      if (!url.trim()) {
        setError("Upload an image first.");
        return;
      }
    } else if (url.trim().length < 2) {
      setError("Add a link first.");
      return;
    }
    onSave({
      id: item?.id ?? newContentId(),
      type,
      url: url.trim(),
      title: title.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      thumbnail: thumbnail.trim() || undefined,
      body: body.trim() || undefined,
      pinned: item?.pinned,
      featured: item?.featured,
    });
  }

  return (
    <Overlay onClose={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/12 bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-[15px] font-semibold text-ink">
            {item ? "Edit tile" : "Add to Block Showcase"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
          {/* Type picker */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Content type
            </p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {CONTENT_TYPES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setType(c.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border px-1.5 py-2 text-[10.5px] font-medium transition-colors",
                    type === c.id
                      ? "border-accent bg-accent/15 text-ink"
                      : "border-white/10 bg-white/[0.03] text-muted hover:text-ink hover:border-white/20"
                  )}
                >
                  <c.Icon size={15} className={type === c.id ? "text-accent" : ""} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary input */}
          {isText ? (
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Testimonial
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder={meta.placeholder}
                className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none"
              />
            </div>
          ) : isImage ? (
            <ImageDrop
              value={url}
              uploading={uploading}
              onPick={() => fileRef.current?.click()}
              label="Image"
            />
          ) : (
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Link
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={meta.placeholder}
                className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-muted">{meta.hint}</p>
            </div>
          )}

          {/* Optional thumbnail for non-image, non-auto-thumb types */}
          {!isImage && !isText && !isVideoType(type) && (
            <ImageDrop
              value={thumbnail}
              uploading={uploading}
              onPick={() => fileRef.current?.click()}
              label="Thumbnail (recommended)"
              compact
              onClear={thumbnail ? () => setThumbnail("") : undefined}
            />
          )}

          {/* Title / subtitle */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                {isText ? "Author" : "Title"}
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isText ? "Who said it" : "Optional title"}
                className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                {isText ? "Their role" : "Subtitle"}
              </label>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-[12px] text-danger">{error}</p>}

          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f, isImage ? "content" : "thumb");
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg px-4 text-[13px] font-medium text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={uploading}
            style={{ color: "#FFFFFF" }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-[13px] font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {item ? "Save tile" : "Add to showcase"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function ImageDrop({
  value,
  uploading,
  onPick,
  label,
  compact,
  onClear,
}: {
  value: string;
  uploading: boolean;
  onPick: () => void;
  label: string;
  compact?: boolean;
  onClear?: () => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPick}
          className={cn(
            "relative overflow-hidden rounded-xl border border-dashed border-white/20 bg-surface-2 transition-colors hover:border-accent/60",
            compact ? "h-16 w-16" : "h-28 w-full"
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center gap-1.5 text-[12px] text-muted">
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              {!compact && (uploading ? "Uploading…" : "Upload image")}
            </span>
          )}
        </button>
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-[12px] text-muted hover:text-danger"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ── Shared overlay (click-out + Escape to close) ────────────────────────────
function Overlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-up"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
