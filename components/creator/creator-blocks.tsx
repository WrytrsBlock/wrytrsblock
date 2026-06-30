"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Briefcase,
  Flame,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Music,
  Play,
  Plus,
  Sparkles,
  Star,
  Target,
  Trash2,
  Trophy,
  Upload,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/primitives";
import { MediaPlayer } from "@/components/creator/media-player";
import { BlockShowcase } from "@/components/creator/block-showcase";
import { openNewBlock } from "@/lib/ui-events";
import {
  isDirectAudio,
  isDirectVideo,
  isVideoType,
  itemTitle,
  newContentId,
  tileThumb,
} from "@/lib/featured-content";
import {
  AUDIO_ACCEPT,
  AUDIO_FORMATS_HINT,
  IMAGE_ACCEPT,
  IMAGE_FORMATS_HINT,
  uploadAudioToAvatars,
  uploadToAvatars,
  uploadVideoToAvatars,
  validateAudioFile,
  validateImageFile,
  validateVideoFile,
  VIDEO_ACCEPT,
  VIDEO_FORMATS_HINT,
} from "@/lib/upload-image";
import { updateShowcaseAction } from "@/app/actions/showcase";
import type { FeaturedContentItem, ContentType } from "@/types";
import type { Track, ServiceOffer, Credit } from "@/lib/mock";
import type { ProfileCollaborator } from "@/lib/data";

// Audio / video / link items scoped to the Demos block (plus legacy audio/song).
const IS_DEMO = (i: FeaturedContentItem) =>
  i.scope === "demo" || i.type === "audio" || i.type === "song";
const IS_SHOWCASE = (i: FeaturedContentItem) => i.scope !== "demo";

type BlockId =
  | "featured"
  | "videos"
  | "photos"
  | "demos"
  | "services"
  | "looking"
  | "story"
  | "inspiration"
  | "experience";

export type CreatorBlocksData = {
  isOwner: boolean;
  name: string;
  handle: string;
  featured: FeaturedContentItem[];
  tracks: Track[];
  services: ServiceOffer[];
  bio: string;
  tagline: string;
  skills: string[];
  seeking: string[];
  openTo: string[];
  credits: Credit[];
  collaborators: ProfileCollaborator[];
  blockScore: number;
  rating: number;
  completedBlocks: number;
};

const VIDEO = (i: FeaturedContentItem) =>
  (isVideoType(i.type) || i.type === "video") && i.scope !== "demo";
const PHOTO = (i: FeaturedContentItem) => i.type === "image";

// The 9 identity blocks — a creative playground you explore, not a resume.
export function CreatorBlocks(props: CreatorBlocksData) {
  const [open, setOpen] = useState<BlockId | null>(null);
  // The screen-space center of the tapped tile, so the modal can scale open
  // from exactly where the user touched ("animate from the selected block").
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  function openBlock(id: BlockId, e: ReactMouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setOpen(id);
  }

  const videos = props.featured.filter(VIDEO);
  const photos = props.featured.filter(PHOTO);
  const demos = props.featured.filter(IS_DEMO);
  const showcase = props.featured.filter(IS_SHOWCASE);
  // The Demos tile counts uploaded/linked audio first, falling back to any
  // legacy derived tracks so existing profiles still read correctly.
  const demoCount = demos.length || props.tracks.length;

  const thumb = (i?: FeaturedContentItem) => (i ? tileThumb(i) : null);
  const tiles: {
    id: BlockId;
    label: string;
    icon: typeof Sparkles;
    color: string;
    count: number;
    accent: string;
    desc: string;
    image?: string | null;
    playable?: boolean;
    text?: string;
    chips?: string[];
    stat?: string;
  }[] = [
    { id: "featured", label: "Featured Work", icon: Sparkles, color: "#FF2D2D", count: showcase.length, accent: "text-[#A9BEFF]", desc: "Showcase your best creative projects.", image: thumb(showcase[0]) },
    { id: "videos", label: "My Videos", icon: Play, color: "#1D6CFF", count: videos.length, accent: "text-[#FF8FB0]", desc: "Upload performances, music videos, and reels.", image: thumb(videos[0]), playable: true },
    { id: "photos", label: "My Photos", icon: ImageIcon, color: "#8B3DFF", count: photos.length, accent: "text-[#7BEDC4]", desc: "Share studio shots, artwork, and behind-the-scenes moments.", image: thumb(photos[0]) },
    { id: "demos", label: "My Music", icon: Headphones, color: "#FF9800", count: demoCount, accent: "text-[#FFD98A]", desc: "Upload songs, rough mixes, beats, and works in progress.", image: thumb(demos[0]), text: demos[0] ? itemTitle(demos[0]) : props.tracks[0]?.name },
    { id: "services", label: "My Services", icon: Briefcase, color: "#16A34A", count: props.services.length, accent: "text-[#A9BEFF]", desc: "Offer mixing, production, songwriting, photography, and more.", text: props.services[0]?.title },
    { id: "looking", label: "Looking For", icon: Target, color: "#FFC107", count: props.seeking.length || props.openTo.length, accent: "text-[#7BEDC4]", desc: "Tell creators who you want to collaborate with.", text: props.openTo[0] ?? props.seeking[0] },
    { id: "story", label: "About Me", icon: User, color: "#F8B4C9", count: props.bio ? 1 : 0, accent: "text-[#FF8FB0]", desc: "Tell people who you are, your background, and your creative journey." },
    { id: "inspiration", label: "Genres & Influences", icon: Music, color: "#FF0A78", count: props.skills.length, accent: "text-[#FFD98A]", desc: "Add your genres and key creative influences." },
    {
      id: "experience",
      label: "My Journey",
      icon: Trophy,
      color: "#FF6A00",
      count: props.credits.length || props.completedBlocks,
      accent: "text-[#A9BEFF]",
      desc: "Your completed Blocks and collaborations land here.",
      stat:
        props.completedBlocks > 0
          ? `${props.completedBlocks} completed`
          : props.collaborators.length > 0
            ? `${props.collaborators.length} collaborators`
            : props.credits[0]?.title,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {tiles.map((t, i) => {
          const Icon = t.icon;
          // Flat color Block — a solid, opaque app-icon tile: big centered white
          // icon, white label near the bottom. No glass, gradients, imagery,
          // counts or badges; the colour is the identity.
          return (
            <button
              key={t.id}
              type="button"
              onClick={(e) => openBlock(t.id, e)}
              style={{ backgroundColor: t.color, animationDelay: `${Math.min(i, 9) * 35}ms` }}
              className="group animate-fade-up relative aspect-square overflow-hidden rounded-[11px] transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.96]"
            >
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8 md:pb-12">
                <Icon
                  className="h-10 w-10 text-white transition-transform duration-300 group-hover:scale-[1.06] md:h-[84px] md:w-[84px]"
                  strokeWidth={2}
                />
              </span>
              <span className="pointer-events-none absolute inset-x-0 bottom-3 line-clamp-2 px-1.5 text-center text-[13px] font-semibold leading-[1.12] tracking-tight text-white md:bottom-4 md:text-[18px]">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {open && (
        <Sheet
          label={tiles.find((t) => t.id === open)!.label}
          icon={tiles.find((t) => t.id === open)!.icon}
          color={tiles.find((t) => t.id === open)!.color}
          origin={origin}
          onClose={() => setOpen(null)}
        >
          <BlockContent
            id={open}
            {...props}
            showcase={showcase}
            videos={videos}
            photos={photos}
            demos={demos}
          />
        </Sheet>
      )}
    </>
  );
}

// ── Full-screen profile-section modal ───────────────────────────────────────
// Tapping a profile Block opens this large card. On mobile it fills the screen
// (a real profile section, not a settings drawer); on desktop it's a centered
// dialog. It scales open from the tapped tile and content begins at the top.
function Sheet({
  label,
  icon: Icon,
  color,
  origin,
  onClose,
  children,
}: {
  label: string;
  icon: typeof Sparkles;
  color: string;
  origin: { x: number; y: number } | null;
  onClose: () => void;
  children: ReactNode;
}) {
  // Close on Escape and lock background scroll while the modal is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;
  const transformOrigin = origin
    ? `${origin.x}px ${origin.y}px`
    : "center center";

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-[120] flex items-stretch justify-center bg-black/70 backdrop-blur-md md:items-center md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ transformOrigin, background: "rgba(13,15,20,0.96)" }}
        className="lg-glass animate-block-modal-in flex h-full w-full flex-col overflow-hidden md:h-auto md:max-h-[86vh] md:max-w-2xl md:rounded-3xl"
      >
        {/* Header — block identity + close, pinned to the top */}
        <div
          className="flex shrink-0 items-center gap-3 border-b border-white/[0.08] px-5 py-4"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: color }}
          >
            <Icon size={18} className="text-white" strokeWidth={2.2} />
          </span>
          <h3 className="flex-1 text-[18px] font-semibold tracking-tight text-white">
            {label}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/70 transition-colors hover:bg-white/[0.1] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        {/* Content — flex-1 so empty states can center and content can grow */}
        <div
          className="flex flex-1 flex-col overflow-y-auto px-5 py-5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Owner / empty states ────────────────────────────────────────────────────
function OwnerAdd({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="lg-btn lg-btn-p inline-flex"
      style={{ color: "#FFFFFF" }}
    >
      <Plus size={14} /> {label}
    </Link>
  );
}

function Empty({
  isOwner,
  name,
  thing,
  addLabel,
  addHref,
}: {
  isOwner: boolean;
  name: string;
  thing: string;
  addLabel?: string;
  addHref?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/40">
        {isOwner ? <Plus size={24} /> : <Sparkles size={22} />}
      </span>
      <p className="max-w-[26ch] text-[15px] leading-snug text-white/65">
        {isOwner
          ? `You haven't added ${addArticle(thing)} yet.`
          : `${name} hasn't added ${addArticle(thing)} yet.`}
      </p>
      {isOwner && addLabel && addHref && (
        <OwnerAdd label={addLabel} href={addHref} />
      )}
    </div>
  );
}

// "services" → "any services"; "an about me" already reads naturally, so leave
// phrases that already start with an article untouched.
function addArticle(thing: string): string {
  return /^(a |an |any )/i.test(thing) ? thing : `any ${thing}`;
}

// Centered empty state used inside the media managers (Demos / Photos / Videos),
// which keep their own add/upload button pinned at the top of the modal.
function ManagerEmpty({
  icon: Icon,
  message,
}: {
  icon: typeof Sparkles;
  message: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/40">
        <Icon size={22} />
      </span>
      <p className="max-w-[28ch] text-[15px] leading-snug text-white/65">
        {message}
      </p>
    </div>
  );
}

// ── A small media gallery (videos / photos / featured) ──────────────────────
function MediaGallery({ items }: { items: FeaturedContentItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {items.map((it) => {
        const thumb = tileThumb(it);
        const playable = VIDEO(it) || it.type === "audio" || it.type === "song";
        const href = it.url || it.thumbnail || "#";
        const internal = href.startsWith("/");
        return (
          <a
            key={it.id}
            href={href}
            {...(internal ? {} : { target: "_blank", rel: "noreferrer" })}
            className="group relative aspect-square overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.04]"
          >
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumb}
                alt={itemTitle(it)}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              />
            ) : (
              <span className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent" />
            )}
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
            {playable && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-sm">
                  <Play size={14} className="ml-0.5 fill-current" />
                </span>
              </span>
            )}
            <span className="absolute inset-x-2 bottom-1.5 truncate text-[10.5px] font-medium text-white drop-shadow">
              {itemTitle(it)}
            </span>
          </a>
        );
      })}
    </div>
  );
}

// ── Demos — add / play / remove demos entirely inside the block (no redirect) ─
function demoAudioUrl(d: FeaturedContentItem): string | null {
  if (isDirectAudio(d.url)) return d.url;
  return null;
}

function demoVideoUrl(d: FeaturedContentItem): string | null {
  if (isDirectVideo(d.url)) return d.url;
  if (d.subtitle && isDirectVideo(d.subtitle)) return d.subtitle;
  return null;
}

function demoExternalLink(d: FeaturedContentItem): string | null {
  for (const c of [d.url, d.subtitle]) {
    if (!c || isDirectAudio(c) || isDirectVideo(c)) continue;
    if (c.trim().length >= 2) return c.trim();
  }
  return null;
}

function buildDemoItem(fields: {
  title: string;
  description: string;
  audioUrl?: string;
  videoUrl?: string;
  externalLink?: string;
}): FeaturedContentItem {
  const title = fields.title.trim() || "Untitled demo";
  const body = fields.description.trim() || undefined;
  const audio = fields.audioUrl?.trim();
  const video = fields.videoUrl?.trim();
  const external = fields.externalLink?.trim();

  let url = "";
  let type: ContentType = "song";
  let subtitle: string | undefined;

  if (audio) {
    url = audio;
    type = "audio";
    subtitle = video || external || undefined;
  } else if (video) {
    url = video;
    type = "video";
    subtitle = external || undefined;
  } else if (external) {
    url = external;
    type = "song";
  }

  return {
    id: newContentId(),
    scope: "demo",
    type,
    url,
    title,
    body,
    subtitle,
  };
}

function DemosManager({
  initial,
  tracks,
  isOwner,
  name,
}: {
  initial: FeaturedContentItem[];
  tracks: Track[];
  isOwner: boolean;
  name: string;
}) {
  const [items, setItems] = useState<FeaturedContentItem[]>(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  const demos = items.filter(IS_DEMO);

  function persist(next: FeaturedContentItem[]) {
    setItems(next);
    setError(null);
    startSave(async () => {
      const res = await updateShowcaseAction(next);
      if (!res.ok) setError(res.error);
    });
  }

  function addDemo(item: FeaturedContentItem) {
    persist([...items, item]);
    setModalOpen(false);
  }

  function removeDemo(id: string) {
    persist(items.filter((i) => i.id !== id));
  }

  const hasContent = demos.length > 0 || tracks.length > 0;

  return (
    <div className="flex flex-1 flex-col gap-4">
      {isOwner && (
        <div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={saving}
            style={{ color: "#FFFFFF" }}
            className="lg-btn lg-btn-p inline-flex w-full justify-center disabled:opacity-60"
          >
            <Plus size={15} /> Add Demo
          </button>
          {error && (
            <p className="mt-1.5 text-center text-[12px] text-danger">{error}</p>
          )}
        </div>
      )}

      {demos.length > 0 && (
        <ul className="space-y-2.5">
          {demos.map((d) => {
            const audio = demoAudioUrl(d);
            const video = demoVideoUrl(d);
            const external = demoExternalLink(d);
            return (
              <li
                key={d.id}
                className="rounded-2xl border border-white/[0.1] bg-white/[0.04] p-3.5"
              >
                <div className="flex items-center gap-3">
                  {tileThumb(d) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tileThumb(d)!}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-[#FFD98A]">
                      <Headphones size={16} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-white">
                      {itemTitle(d)}
                    </p>
                    {d.body && (
                      <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-white/55">
                        {d.body}
                      </p>
                    )}
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => removeDemo(d.id)}
                      aria-label="Remove demo"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/55 transition-colors hover:border-danger/40 hover:bg-danger/20 hover:text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {audio && (
                  <audio controls src={audio} className="mt-2.5 w-full" />
                )}
                {video && (
                  <video
                    controls
                    src={video}
                    className="mt-2.5 w-full rounded-xl"
                  />
                )}
                {external && (
                  <a
                    href={external}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#A9BEFF] hover:text-white"
                  >
                    <ArrowUpRight size={12} /> Open link
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {tracks.length > 0 && <MediaPlayer tracks={tracks} />}

      {!hasContent && (
        <ManagerEmpty
          icon={Headphones}
          message={
            isOwner
              ? "Add your first demo — songs, rough mixes, beats, or works in progress."
              : `${name} hasn't added any demos yet.`
          }
        />
      )}

      {modalOpen && (
        <DemoEditorModal
          onClose={() => setModalOpen(false)}
          onSave={addDemo}
        />
      )}
    </div>
  );
}

// My Photos — image uploads ONLY. The owner uploads photo files directly (no
// links, no other media types); everyone sees the grid. Persists into the shared
// featured_content, leaving non-image items untouched.
function PhotosManager({
  initial,
  isOwner,
  name,
}: {
  initial: FeaturedContentItem[];
  isOwner: boolean;
  name: string;
}) {
  const [items, setItems] = useState<FeaturedContentItem[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const photos = items.filter(PHOTO);

  function persist(next: FeaturedContentItem[]) {
    setItems(next);
    setError(null);
    startSave(async () => {
      const res = await updateShowcaseAction(next);
      if (!res.ok) setError(res.error);
    });
  }

  async function onFiles(files: FileList) {
    setError(null);
    setUploading(true);
    const added: FeaturedContentItem[] = [];
    try {
      for (const file of Array.from(files)) {
        const invalid = validateImageFile(file);
        if (invalid) {
          setError(invalid);
          continue;
        }
        const url = await uploadToAvatars(file, "portfolio");
        if (url) {
          added.push({
            id: newContentId(),
            type: "image",
            url,
            thumbnail: url,
            title: file.name.replace(/\.[^./\\]+$/, "").trim() || "Photo",
          });
        }
      }
      if (added.length) persist([...items, ...added]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(id: string) {
    persist(items.filter((i) => i.id !== id));
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {isOwner && (
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || saving}
            style={{ color: "#FFFFFF" }}
            className="lg-btn lg-btn-p inline-flex w-full justify-center disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload size={15} /> Upload Photos
              </>
            )}
          </button>
          <p className="mt-1.5 text-center text-[11px] text-white/45">
            {IMAGE_FORMATS_HINT}
          </p>
          {error && (
            <p className="mt-1.5 text-center text-[12px] text-danger">{error}</p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void onFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.04]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url || p.thumbnail}
                alt={itemTitle(p)}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {isOwner && (
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label="Remove photo"
                  className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-black/55 text-white/80 opacity-0 backdrop-blur-sm transition-opacity hover:bg-danger/70 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <ManagerEmpty
          icon={ImageIcon}
          message={
            isOwner
              ? "Upload your studio shots, artwork, and behind-the-scenes photos."
              : `${name} hasn't added any photos yet.`
          }
        />
      )}
    </div>
  );
}

// My Videos — video uploads ONLY. The owner uploads video files directly (no
// links, no other media types); everyone sees the players. Persists into the
// shared featured_content, leaving non-video items untouched.
function VideosManager({
  initial,
  isOwner,
  name,
}: {
  initial: FeaturedContentItem[];
  isOwner: boolean;
  name: string;
}) {
  const [items, setItems] = useState<FeaturedContentItem[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const videos = items.filter(VIDEO);

  function persist(next: FeaturedContentItem[]) {
    setItems(next);
    setError(null);
    startSave(async () => {
      const res = await updateShowcaseAction(next);
      if (!res.ok) setError(res.error);
    });
  }

  async function onFiles(files: FileList) {
    setError(null);
    setUploading(true);
    const added: FeaturedContentItem[] = [];
    try {
      for (const file of Array.from(files)) {
        const invalid = validateVideoFile(file);
        if (invalid) {
          setError(invalid);
          continue;
        }
        const url = await uploadVideoToAvatars(file);
        if (url) {
          added.push({
            id: newContentId(),
            type: "video",
            url,
            title: file.name.replace(/\.[^./\\]+$/, "").trim() || "Video",
          });
        }
      }
      if (added.length) persist([...items, ...added]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  function removeVideo(id: string) {
    persist(items.filter((i) => i.id !== id));
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {isOwner && (
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || saving}
            style={{ color: "#FFFFFF" }}
            className="lg-btn lg-btn-p inline-flex w-full justify-center disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload size={15} /> Upload Videos
              </>
            )}
          </button>
          <p className="mt-1.5 text-center text-[11px] text-white/45">
            {VIDEO_FORMATS_HINT}
          </p>
          {error && (
            <p className="mt-1.5 text-center text-[12px] text-danger">{error}</p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={VIDEO_ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void onFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {videos.length > 0 ? (
        <ul className="space-y-3">
          {videos.map((v) => {
            const url = isDirectVideo(v.url) ? v.url : null;
            return (
              <li
                key={v.id}
                className="rounded-2xl border border-white/[0.1] bg-white/[0.04] p-3"
              >
                <div className="flex items-center gap-3">
                  <p className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-white">
                    {itemTitle(v)}
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => removeVideo(v.id)}
                      aria-label="Remove video"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/55 transition-colors hover:border-danger/40 hover:bg-danger/20 hover:text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {url ? (
                  <video controls src={url} className="mt-2.5 w-full rounded-xl" />
                ) : (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#A9BEFF] hover:text-white"
                  >
                    <ArrowUpRight size={12} /> Open video
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <ManagerEmpty
          icon={Play}
          message={
            isOwner
              ? "Upload performances, music videos, and reels."
              : `${name} hasn't added any videos yet.`
          }
        />
      )}
    </div>
  );
}

function DemoEditorModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (item: FeaturedContentItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"audio" | "video" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  async function onAudioFile(file: File) {
    setError(null);
    const invalid = validateAudioFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setUploading("audio");
    try {
      const url = await uploadAudioToAvatars(file);
      if (!url) {
        setError("Audio upload didn't complete. Try again.");
        return;
      }
      setAudioUrl(url);
      setAudioName(file.name.replace(/\.[^./\\]+$/, "").trim() || "Audio");
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^./\\]+$/, "").trim() || "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audio upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function onVideoFile(file: File) {
    setError(null);
    const invalid = validateVideoFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setUploading("video");
    try {
      const url = await uploadVideoToAvatars(file);
      if (!url) {
        setError("Video upload didn't complete. Try again.");
        return;
      }
      setVideoUrl(url);
      setVideoName(file.name.replace(/\.[^./\\]+$/, "").trim() || "Video");
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^./\\]+$/, "").trim() || "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Video upload failed.");
    } finally {
      setUploading(null);
    }
  }

  function save() {
    const link = externalLink.trim();
    if (!audioUrl && !videoUrl && link.length < 2) {
      setError("Add an audio file, video file, or external link.");
      return;
    }
    onSave(
      buildDemoItem({
        title,
        description,
        audioUrl: audioUrl ?? undefined,
        videoUrl: videoUrl ?? undefined,
        externalLink: link || undefined,
      })
    );
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm md:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Add demo"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="lg-glass flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden !rounded-t-3xl md:!rounded-3xl"
        style={{ background: "rgba(14,16,22,0.92)" }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.1] px-5 py-3.5">
          <h3 className="text-[15px] font-semibold text-white">Add Demo</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/45">
              Demo title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled demo"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/35 focus:border-[#A9BEFF]/60 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/45">
              Audio upload
            </label>
            <button
              type="button"
              onClick={() => audioRef.current?.click()}
              disabled={uploading !== null}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-3.5 py-3 text-left transition-colors hover:border-white/35 hover:bg-white/[0.06] disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2 text-[13px] text-white/80">
                {uploading === "audio" ? (
                  <Loader2 size={15} className="animate-spin text-[#FFD98A]" />
                ) : (
                  <Headphones size={15} className="text-[#FFD98A]" />
                )}
                {audioName ?? "Choose an audio file"}
              </span>
              {audioUrl && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAudioUrl(null);
                    setAudioName(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      setAudioUrl(null);
                      setAudioName(null);
                    }
                  }}
                  className="text-[11px] text-white/45 hover:text-danger"
                >
                  Remove
                </span>
              )}
            </button>
            <p className="mt-1 text-[11px] text-white/40">{AUDIO_FORMATS_HINT}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/45">
              Video upload
            </label>
            <button
              type="button"
              onClick={() => videoRef.current?.click()}
              disabled={uploading !== null}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-3.5 py-3 text-left transition-colors hover:border-white/35 hover:bg-white/[0.06] disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2 text-[13px] text-white/80">
                {uploading === "video" ? (
                  <Loader2 size={15} className="animate-spin text-[#FF8FB0]" />
                ) : (
                  <Play size={15} className="text-[#FF8FB0]" />
                )}
                {videoName ?? "Choose a video file"}
              </span>
              {videoUrl && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoUrl(null);
                    setVideoName(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      setVideoUrl(null);
                      setVideoName(null);
                    }
                  }}
                  className="text-[11px] text-white/45 hover:text-danger"
                >
                  Remove
                </span>
              )}
            </button>
            <p className="mt-1 text-[11px] text-white/40">{VIDEO_FORMATS_HINT}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/45">
              External link
            </label>
            <input
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="SoundCloud, Spotify, YouTube…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/35 focus:border-[#A9BEFF]/60 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/45">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What's this demo about?"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/35 focus:border-[#A9BEFF]/60 focus:outline-none"
            />
          </div>

          {error && <p className="text-[12px] text-danger">{error}</p>}

          <input
            ref={audioRef}
            type="file"
            accept={AUDIO_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onAudioFile(f);
              e.target.value = "";
            }}
          />
          <input
            ref={videoRef}
            type="file"
            accept={VIDEO_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onVideoFile(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/[0.1] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg px-4 text-[13px] font-medium text-white/55 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={uploading !== null}
            style={{ color: "#FFFFFF" }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-[13px] font-semibold hover:bg-accent/90 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Save demo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Per-block content ───────────────────────────────────────────────────────
function BlockContent(
  props: CreatorBlocksData & {
    id: BlockId;
    showcase: FeaturedContentItem[];
    videos: FeaturedContentItem[];
    photos: FeaturedContentItem[];
    demos: FeaturedContentItem[];
  }
) {
  const { id, isOwner, name } = props;

  switch (id) {
    case "featured":
      if (isOwner) {
        return (
          <BlockShowcase initialItems={props.featured} isOwner={true} />
        );
      }
      return props.showcase.length ? (
        <MediaGallery items={props.showcase} />
      ) : (
        <Empty isOwner={isOwner} name={name} thing="featured work" />
      );

    // Videos & Photos share Featured Work's functionality: the owner gets the
    // editable showcase (add / edit / reorder / pin); visitors see the filtered
    // gallery.
    case "videos":
      // Video uploads only — a dedicated video uploader, not the all-types
      // showcase.
      return (
        <VideosManager
          initial={props.featured}
          isOwner={isOwner}
          name={name}
        />
      );

    case "photos":
      // Image uploads only — a dedicated photo uploader, not the all-types
      // showcase.
      return (
        <PhotosManager
          initial={props.featured}
          isOwner={isOwner}
          name={name}
        />
      );

    case "demos":
      return (
        <DemosManager
          initial={props.featured}
          tracks={props.tracks}
          isOwner={isOwner}
          name={name}
        />
      );

    case "services":
      return props.services.length ? (
        <div className="grid gap-2.5">
          {props.services.map((s) => (
            <div
              key={s.title}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-white/[0.04] p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-[#A9BEFF]">
                <Briefcase size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-white">
                  {s.title}
                </p>
                <p className="font-mono text-[12px] text-white/55">{s.price}</p>
              </div>
              {s.slug && (
                <Link
                  href={`/blocks/${s.slug}`}
                  className="lg-btn !py-1.5 text-[12px]"
                >
                  View <ArrowUpRight size={12} />
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty
          isOwner={isOwner}
          name={name}
          thing="services"
          addLabel="Add a service"
          addHref="/profile/edit"
        />
      );

    case "looking": {
      const hasAny = props.openTo.length > 0 || props.seeking.length > 0;
      return (
        <div className="space-y-5">
          {props.openTo.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {props.openTo.map((o) => (
                <span key={o} className="lg-pill lg-pill-g">
                  <span className="h-[5px] w-[5px] rounded-full bg-[#2BC48A]" />
                  {o}
                </span>
              ))}
            </div>
          )}
          {props.seeking.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-white/45">
                Looking for
              </p>
              <div className="flex flex-wrap gap-2">
                {props.seeking.map((s) => (
                  <span
                    key={s}
                    className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/[0.05] px-4 text-[13px] text-white/90"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!hasAny && (
            <Empty
              isOwner={isOwner}
              name={name}
              thing="collaboration preferences"
              addLabel="Edit profile"
              addHref="/profile/edit"
            />
          )}
          {!isOwner && (
            <button
              type="button"
              onClick={() => openNewBlock(undefined, props.handle)}
              className="lg-btn lg-btn-p w-full"
              style={{ color: "#FFFFFF" }}
            >
              <Plus size={15} /> Start a Block with {name}
            </button>
          )}
        </div>
      );
    }

    case "story":
      return props.bio || props.tagline ? (
        <p className="whitespace-pre-line text-[14px] leading-relaxed text-white/85">
          {props.bio || props.tagline}
        </p>
      ) : (
        <Empty
          isOwner={isOwner}
          name={name}
          thing="an about me"
          addLabel="Write your bio"
          addHref="/profile/edit"
        />
      );

    case "inspiration":
      return props.skills.length ? (
        <div className="flex flex-wrap gap-2">
          {props.skills.map((s) => (
            <span
              key={s}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-4 text-[13px] text-white/90"
            >
              <Flame size={12} className="text-[#FFD98A]" />
              {s}
            </span>
          ))}
        </div>
      ) : (
        <Empty
          isOwner={isOwner}
          name={name}
          thing="genres or influences"
          addLabel="Add influences"
          addHref="/profile/edit"
        />
      );

    case "experience":
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { v: props.completedBlocks, l: "Completed", icon: Trophy },
              { v: `${props.rating}`, l: "Rating", icon: Star },
              { v: props.blockScore, l: "Block Score", icon: Sparkles },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-3 py-3 text-center"
              >
                <p className="text-[20px] font-semibold tabular-nums text-white">
                  {s.v}
                </p>
                <p className="mt-0.5 text-[10.5px] text-white/50">{s.l}</p>
              </div>
            ))}
          </div>

          {props.collaborators.length > 0 && (
            <div>
              <p className="mb-2.5 text-[11px] uppercase tracking-[0.12em] text-white/45">
                Worked with {props.collaborators.length} creator
                {props.collaborators.length === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {props.collaborators.map((c) => (
                  <Link
                    key={c.id}
                    href={`/profile/${c.handle}`}
                    className="flex items-center gap-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] p-2 transition-colors hover:bg-white/[0.08]"
                  >
                    <Avatar src={c.avatar} name={c.name} size={32} />
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-white">
                        {c.name}
                      </span>
                      <span className="block truncate text-[10px] text-white/50">
                        @{c.handle}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {props.credits.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-white/45">
                History
              </p>
              <ul className="divide-y divide-white/[0.07]">
                {props.credits.map((c, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-white">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-white/50">{c.role}</p>
                    </div>
                    <span className="font-mono text-[11px] text-white/50">
                      {c.year}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {props.collaborators.length === 0 &&
            props.credits.length === 0 &&
            props.completedBlocks === 0 && (
              <p className="py-4 text-center text-[13px] text-white/55">
                {isOwner
                  ? "Your track record builds as you complete Blocks."
                  : `${name} is just getting started.`}
              </p>
            )}
        </div>
      );

    default:
      return null;
  }
}
