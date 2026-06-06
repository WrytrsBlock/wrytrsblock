"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  CONTENT_TYPES,
  contentMeta,
  itemTitle,
  newContentId,
  type ContentType,
  type FeaturedContentItem,
} from "@/lib/featured-content";
import {
  IMAGE_ACCEPT,
  uploadToAvatars,
  validateImageFile,
} from "@/lib/upload-image";

// Manage Featured Content: add, remove, reorder, and choose the featured item.
// Controlled — operates on `value` through `onChange`.
export function FeaturedContentEditor({
  value,
  onChange,
}: {
  value: FeaturedContentItem[];
  onChange: (items: FeaturedContentItem[]) => void;
}) {
  const [type, setType] = useState<ContentType>("youtube");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const meta = contentMeta(type);

  function add() {
    const u = url.trim();
    if (u.length < 3) {
      setError("Add a link or upload a file first.");
      return;
    }
    const item: FeaturedContentItem = {
      id: newContentId(),
      type,
      url: u,
      title: title.trim() || undefined,
      // First item added becomes the featured one by default.
      featured: value.length === 0,
    };
    onChange([...value, item]);
    setUrl("");
    setTitle("");
    setError(null);
  }

  function remove(id: string) {
    const removed = value.find((i) => i.id === id);
    let next = value.filter((i) => i.id !== id);
    // If we removed the featured item, promote the first remaining one.
    if (removed?.featured && next.length && !next.some((i) => i.featured)) {
      next = next.map((i, idx) => (idx === 0 ? { ...i, featured: true } : i));
    }
    onChange(next);
  }

  function move(id: string, dir: -1 | 1) {
    const idx = value.findIndex((i) => i.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= value.length) return;
    const next = [...value];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  function feature(id: string) {
    onChange(value.map((i) => ({ ...i, featured: i.id === id })));
  }

  async function onFile(file: File) {
    setError(null);
    const invalid = validateImageFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setUploading(true);
    try {
      const up = await uploadToAvatars(file, "portfolio");
      if (up) setUrl(up);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const canAdd = !uploading && url.trim().length >= 3;

  return (
    <div className="space-y-3">
      {/* Existing items */}
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((it, idx) => {
            const m = contentMeta(it.type);
            return (
              <li
                key={it.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-2.5 transition-colors",
                  it.featured
                    ? "border-warning/40 bg-warning/[0.06]"
                    : "border-line bg-surface-2"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] border border-white/10",
                    m.accent
                  )}
                >
                  <m.Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-ink truncate">
                    {itemTitle(it)}
                  </p>
                  <p className="text-[10.5px] text-muted truncate">
                    {m.badge} · {it.url}
                  </p>
                </div>

                {/* Choose featured */}
                <button
                  type="button"
                  onClick={() => feature(it.id)}
                  aria-label={it.featured ? "Featured" : "Set as featured"}
                  title={it.featured ? "Featured" : "Set as featured"}
                  className={cn(
                    "h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors",
                    it.featured
                      ? "text-warning"
                      : "text-muted hover:text-ink hover:bg-white/[0.06]"
                  )}
                >
                  <Star size={15} className={it.featured ? "fill-warning" : ""} />
                </button>

                {/* Reorder */}
                <div className="flex flex-col -my-0.5">
                  <button
                    type="button"
                    onClick={() => move(it.id, -1)}
                    disabled={idx === 0}
                    aria-label="Move up"
                    className="text-muted hover:text-ink disabled:opacity-25 disabled:hover:text-muted transition-colors"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(it.id, 1)}
                    disabled={idx === value.length - 1}
                    aria-label="Move down"
                    className="text-muted hover:text-ink disabled:opacity-25 disabled:hover:text-muted transition-colors"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label="Remove"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add new content */}
      <div className="rounded-xl border border-dashed border-line-strong/70 bg-surface-2/50 p-3 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as ContentType);
                setError(null);
              }}
              aria-label="Content type"
              className="appearance-none w-full h-10 pl-3 pr-8 rounded-lg bg-surface border border-line text-ink text-[13px] font-medium focus:outline-none focus:border-accent/50 transition-colors"
            >
              {CONTENT_TYPES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={meta.placeholder}
            className="h-10 flex-1 min-w-0"
          />
          {meta.input === "image" && (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 px-3 rounded-lg bg-white/[0.05] border border-line text-[12.5px] text-ink hover:bg-white/[0.08] transition-colors disabled:opacity-60"
              >
                <ImagePlus size={14} /> {uploading ? "Uploading…" : "Upload"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={IMAGE_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                  e.target.value = "";
                }}
              />
            </>
          )}
          <button
            type="button"
            onClick={add}
            disabled={!canAdd}
            className="shrink-0 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-accent text-[12.5px] font-semibold text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
            style={{ color: "#FFFFFF" }}
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {error ? (
          <p className="text-[11.5px] text-danger">{error}</p>
        ) : (
          <p className="text-[11px] text-muted/70">{meta.hint}</p>
        )}
      </div>
    </div>
  );
}
