"use client";

import { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  FileText,
  FileType2,
  Filter,
  Image as ImageIcon,
  Loader2,
  Search,
  Upload,
  Video,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Input,
  SectionLabel,
} from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { detectKind, formatBytes } from "@/lib/media";
import { supabaseConfigured } from "@/lib/env";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/hooks/use-supabase";
import { useRealtimeTable } from "@/hooks/use-realtime";
import { uploadMediaAction, listBlockMediaAction } from "@/app/actions/media";
import { isEstablishedBlock, type Block, type FileAsset } from "@/lib/mock";
import type { MediaKind } from "@/types";

const MEDIA_BUCKET = "block-media";

type UploadStatus = "uploading" | "done" | "error";

type Asset = FileAsset & {
  status?: UploadStatus;
  previewUrl?: string;
};

const kindMeta: Record<
  FileAsset["kind"],
  { icon: typeof AudioLines; label: string; tint: string }
> = {
  image: { icon: ImageIcon, label: "Image", tint: "from-warning/20 to-accent/15" },
  video: { icon: Video, label: "Video", tint: "from-danger/20 to-warning/15" },
  audio: { icon: AudioLines, label: "Audio", tint: "from-success/20 to-accent-2/15" },
  doc: { icon: FileText, label: "Doc", tint: "from-accent-2/20 to-accent/10" },
  pdf: { icon: FileType2, label: "PDF", tint: "from-danger/20 to-danger/5" },
};

const extraMedia: FileAsset[] = [
  { id: "x1", name: "ep4-rough-cut.mp4", kind: "video", size: "284 MB", updated: "4h ago", cover: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80" },
  { id: "x2", name: "newsroom-amb-A.wav", kind: "audio", size: "18.2 MB", updated: "5h ago" },
  { id: "x3", name: "newsroom-amb-B.wav", kind: "audio", size: "21.4 MB", updated: "5h ago" },
  { id: "x4", name: "key-art-still-01.jpg", kind: "image", size: "6.4 MB", updated: "Yesterday", cover: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80" },
  { id: "x5", name: "title-treatment.ai", kind: "doc", size: "1.2 MB", updated: "Yesterday" },
  { id: "x6", name: "press-release-draft.pdf", kind: "pdf", size: "84 KB", updated: "2d ago" },
];

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(0, Math.floor(ms / 60000));
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function MediaPanel({
  block,
  title = "Media",
  subtitle = "Auto-tagged, searchable, transcribed. Versioned per asset.",
}: {
  block: Block;
  title?: string;
  subtitle?: string;
}) {
  const realBlock = supabaseConfigured && isUuid(block.id);
  const { user } = useUser();
  const supabase = useSupabase();
  const currentUserId = user?.id ?? null;

  // Established (demo) Blocks get the richer seeded set; a real Block loads
  // its actual persisted uploads below (including files/voice notes shared
  // over chat — both paths write to the same media_assets table).
  const [assets, setAssets] = useState<Asset[]>(
    !realBlock && isEstablishedBlock(block) ? [...block.files, ...extraMedia] : []
  );
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState<"All" | FileAsset["kind"]>("All");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!realBlock) return;
    let cancelled = false;
    listBlockMediaAction(block.slug).then((items) => {
      if (cancelled) return;
      setAssets(
        items.map((m) => ({
          id: m.id,
          name: m.name,
          kind: m.kind,
          size: formatBytes(m.sizeBytes ?? 0),
          updated: timeAgo(m.createdAt),
          cover: m.kind === "image" ? m.url ?? undefined : undefined,
          status: "done",
        }))
      );
    });
    return () => {
      cancelled = true;
    };
  }, [realBlock, block.slug]);

  // Every other member's uploads (Files tab or chat attachment/voice note)
  // land here live, same as they'd appear in chat.
  useRealtimeTable<{
    id: string;
    name: string;
    kind: MediaKind;
    size_bytes: number | null;
    storage_path: string;
    uploaded_by: string | null;
    created_at: string;
  }>(
    "media_assets",
    async (payload) => {
      if (payload.eventType !== "INSERT") return;
      const row = payload.new;
      if (row.uploaded_by === currentUserId) return; // ours — already shown optimistically
      let cover: string | undefined;
      if (supabase && row.kind === "image") {
        const { data } = await supabase.storage
          .from(MEDIA_BUCKET)
          .createSignedUrl(row.storage_path, 3600);
        cover = data?.signedUrl;
      }
      setAssets((prev) => {
        if (prev.some((a) => a.id === row.id)) return prev;
        return [
          {
            id: row.id,
            name: row.name,
            kind: row.kind,
            size: formatBytes(row.size_bytes ?? 0),
            updated: timeAgo(row.created_at),
            cover,
            status: "done",
          },
          ...prev,
        ];
      });
    },
    `block_id=eq.${block.id}`,
    "INSERT",
    realBlock
  );

  function patchAsset(id: string, patch: Partial<Asset>) {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    for (const file of list) {
      const kind = detectKind(file);
      const tempId = `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const previewUrl =
        kind === "image" || kind === "video"
          ? URL.createObjectURL(file)
          : undefined;

      const optimistic: Asset = {
        id: tempId,
        name: file.name,
        kind,
        size: formatBytes(file.size),
        updated: "now",
        cover: kind === "image" ? previewUrl : undefined,
        previewUrl,
        status: "uploading",
      };
      setAssets((prev) => [optimistic, ...prev]);

      if (!supabaseConfigured) {
        // Demo mode: finalize the optimistic entry locally.
        setTimeout(() => patchAsset(tempId, { status: "done" }), 500);
        continue;
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind as MediaKind);
      const res = await uploadMediaAction(block.slug, fd).catch(() => null);

      if (res?.ok) {
        patchAsset(tempId, {
          id: res.id,
          status: "done",
          cover: kind === "image" ? res.url ?? previewUrl : optimistic.cover,
        });
      } else {
        patchAsset(tempId, { status: "error" });
      }
    }
  }

  const counts = {
    All: assets.length,
    Images: assets.filter((a) => a.kind === "image").length,
    Video: assets.filter((a) => a.kind === "video").length,
    Audio: assets.filter((a) => a.kind === "audio").length,
    Docs: assets.filter((a) => a.kind === "doc").length,
    PDF: assets.filter((a) => a.kind === "pdf").length,
  };

  const filterMap: Record<string, FileAsset["kind"] | "All"> = {
    All: "All",
    Images: "image",
    Video: "video",
    Audio: "audio",
    Docs: "doc",
    PDF: "pdf",
  };

  const visible =
    filter === "All" ? assets : assets.filter((a) => a.kind === filter);

  return (
    <div className="px-8 py-7 space-y-5 animate-fade-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionLabel>Library</SectionLabel>
          <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
            {title}
          </h2>
          <p className="text-[12.5px] text-muted mt-1">{subtitle}</p>
        </div>
        <Button variant="primary" size="md" onClick={() => inputRef.current?.click()}>
          <Upload size={12} /> Upload
        </Button>
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Dropzone */}
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "p-6 border-dashed transition-all duration-200 cursor-pointer",
          dragging
            ? "border-accent/60 bg-accent/5 shadow-glow"
            : "bg-surface/50 hover:border-line-strong"
        )}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "h-11 w-11 rounded-xl border flex items-center justify-center transition-colors",
                dragging
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-line bg-surface-2 text-muted"
              )}
            >
              <Upload size={17} strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-ink">
                {dragging ? "Drop to upload" : "Drop files here, or click to browse"}
              </p>
              <p className="text-[11.5px] text-muted mt-0.5">
                Images, video, audio, docs · up to 500 MB ·{" "}
                {supabaseConfigured ? "stored in Supabase" : "demo preview only"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="md"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Browse
          </Button>
        </div>
      </Card>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <div className="relative w-[280px]">
          <Search
            size={12}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <Input
            placeholder="Search assets, transcripts, captions"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-2 border border-line">
          {Object.entries(counts).map(([label, count]) => {
            const value = filterMap[label];
            const active = filter === value;
            return (
              <button
                key={label}
                onClick={() => setFilter(value)}
                className={
                  active
                    ? "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-surface text-ink text-[11.5px] font-medium shadow-soft"
                    : "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-muted hover:text-ink text-[11.5px] transition-colors"
                }
              >
                {label}
                <span className="text-[10px] text-muted font-mono">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="md">
          <Filter size={12} /> Filters
        </Button>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="No media yet"
          description="Drop your first files above — stems, cuts, stills, scripts. Everything for this Block lives here, auto-tagged and searchable."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={12} /> Upload files
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {visible.map((f) => {
            const meta = kindMeta[f.kind];
            const Icon = meta.icon;
            return (
              <Card
                key={f.id}
                hover
                className="overflow-hidden p-0 cursor-pointer"
              >
                <div className={cn("relative h-32 bg-gradient-to-br", meta.tint)}>
                  {f.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.cover} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  <div className="absolute top-2 left-2">
                    <Badge tone="soft" className="!bg-bg/80 backdrop-blur-md">
                      <Icon size={9} strokeWidth={2} />
                      {meta.label}
                    </Badge>
                  </div>
                  {f.status === "uploading" && (
                    <div className="absolute inset-0 bg-bg/60 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 size={18} className="text-accent animate-spin" />
                    </div>
                  )}
                  {f.status === "error" && (
                    <div className="absolute inset-0 bg-danger/10 flex items-center justify-center">
                      <Badge tone="danger">Failed</Badge>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[12px] font-medium text-ink truncate">
                    {f.name}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
                    <span className="font-mono">{f.size}</span>
                    <span>{f.updated}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
