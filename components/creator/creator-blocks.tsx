"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
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
  isVideoType,
  itemTitle,
  newContentId,
  tileThumb,
} from "@/lib/featured-content";
import {
  AUDIO_ACCEPT,
  AUDIO_FORMATS_HINT,
  uploadAudioToAvatars,
  validateAudioFile,
} from "@/lib/upload-image";
import { updateShowcaseAction } from "@/app/actions/showcase";
import type { FeaturedContentItem } from "@/types";
import type { Track, ServiceOffer, Credit } from "@/lib/mock";
import type { ProfileCollaborator } from "@/lib/data";

// Audio items (uploaded demos + linked songs) are what the Demos block manages.
const IS_DEMO = (i: FeaturedContentItem) =>
  i.type === "audio" || i.type === "song";

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

const VIDEO = (i: FeaturedContentItem) => isVideoType(i.type) || i.type === "video";
const PHOTO = (i: FeaturedContentItem) => i.type === "image";

// The 9 identity blocks — a creative playground you explore, not a resume.
export function CreatorBlocks(props: CreatorBlocksData) {
  const [open, setOpen] = useState<BlockId | null>(null);

  const videos = props.featured.filter(VIDEO);
  const photos = props.featured.filter(PHOTO);
  const demos = props.featured.filter(IS_DEMO);
  // The Demos tile counts uploaded/linked audio first, falling back to any
  // legacy derived tracks so existing profiles still read correctly.
  const demoCount = demos.length || props.tracks.length;

  const thumb = (i?: FeaturedContentItem) => (i ? tileThumb(i) : null);
  const tiles: {
    id: BlockId;
    label: string;
    icon: typeof Sparkles;
    count: number;
    accent: string;
    desc: string;
    image?: string | null;
    playable?: boolean;
    text?: string;
    chips?: string[];
    stat?: string;
  }[] = [
    { id: "featured", label: "Featured Work", icon: Sparkles, count: props.featured.length, accent: "text-[#A9BEFF]", desc: "Showcase your best creative projects.", image: thumb(props.featured[0]) },
    { id: "videos", label: "My Videos", icon: Play, count: videos.length, accent: "text-[#FF8FB0]", desc: "Upload performances, music videos, and reels.", image: thumb(videos[0]), playable: true },
    { id: "photos", label: "My Photos", icon: ImageIcon, count: photos.length, accent: "text-[#7BEDC4]", desc: "Share studio shots, artwork, and behind-the-scenes moments.", image: thumb(photos[0]) },
    { id: "demos", label: "My Demos", icon: Headphones, count: demoCount, accent: "text-[#FFD98A]", desc: "Upload songs, rough mixes, beats, and works in progress.", image: thumb(demos[0]), text: demos[0] ? itemTitle(demos[0]) : props.tracks[0]?.name },
    { id: "services", label: "My Services", icon: Briefcase, count: props.services.length, accent: "text-[#A9BEFF]", desc: "Offer mixing, production, songwriting, photography, and more.", text: props.services[0]?.title },
    { id: "looking", label: "Looking For", icon: Target, count: props.seeking.length || props.openTo.length, accent: "text-[#7BEDC4]", desc: "Tell creators who you want to collaborate with.", text: props.openTo[0] ?? props.seeking[0] },
    { id: "story", label: "About Me", icon: User, count: props.bio ? 1 : 0, accent: "text-[#FF8FB0]", desc: "Tell people who you are, your background, and your creative journey." },
    { id: "inspiration", label: "My Genres & Influences", icon: Music, count: props.skills.length, accent: "text-[#FFD98A]", desc: "Add your genres and key creative influences." },
    {
      id: "experience",
      label: "My Journey",
      icon: Trophy,
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
          const has = t.count > 0;
          const hasImage = !!t.image;
          // Every block without a cover image uses the same centered icon hero
          // (icon → title → description), so all nine read identically. Only a
          // real cover image overrides it. Content (bio, genres, demos…) lives
          // inside the opened block, never on the tile preview.
          const iconHero = !hasImage;
          const isEmpty = iconHero && t.count === 0;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setOpen(t.id)}
              style={{ animationDelay: `${Math.min(i, 9) * 35}ms` }}
              className="group lg-glass animate-fade-up relative aspect-square overflow-hidden text-left transition-all duration-200 hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.12] hover:shadow-[0_14px_40px_-12px_rgba(0,0,0,0.6)] active:scale-[0.97]"
            >
              {/* Media preview as the tile background */}
              {hasImage && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.image!}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />
                  {t.playable && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-sm">
                        <Play size={14} className="ml-0.5 fill-current" />
                      </span>
                    </span>
                  )}
                </>
              )}

              {iconHero ? (
                // ── Icon hero — the icon is large + centered on a soft
                // glass/gradient with title + sub-line. Used both for empty
                // blocks (an invitation to create) and for blocks that hold
                // items but no cover artwork, so every iconographic tile reads
                // the same. ──
                <>
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,118,229,0.18),transparent_62%)]" />
                  {props.isOwner && isEmpty && (
                    <span className="absolute right-2.5 top-2.5 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/[0.12] text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                      <Plus size={14} strokeWidth={2.4} />
                    </span>
                  )}
                  <span className="relative flex h-full flex-col items-center justify-center gap-2.5 px-2 text-center">
                    <span
                      className={cn(
                        "inline-flex h-[54px] w-[54px] items-center justify-center rounded-[20px] border border-white/[0.12] bg-white/[0.05] shadow-[inset_0_1px_0_rgb(255_255_255/0.1)] transition-transform duration-300 group-hover:scale-[1.06] md:h-[100px] md:w-[100px] md:rounded-[24px]",
                        t.accent
                      )}
                    >
                      <Icon className="h-7 w-7 md:h-14 md:w-14" strokeWidth={1.3} />
                    </span>
                    <span className="line-clamp-2 block text-balance text-[14.5px] md:text-[20px] font-semibold leading-[1.15] tracking-tight text-white">
                      {t.label}
                    </span>
                  </span>
                </>
              ) : (
                <span className="relative flex h-full flex-col justify-between p-3">
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 backdrop-blur-sm",
                      hasImage ? "bg-black/35" : "bg-white/[0.07]",
                      t.accent
                    )}
                  >
                    <Icon size={16} strokeWidth={1.9} />
                  </span>
                  <span className="w-full">
                    <span className="block text-[12.5px] font-semibold leading-tight text-white drop-shadow">
                      {t.label}
                    </span>
                    {!hasImage && t.chips && t.chips.length > 0 ? (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {t.chips.map((c) => (
                          <span
                            key={c}
                            className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/70"
                          >
                            {c}
                          </span>
                        ))}
                      </span>
                    ) : !hasImage && t.text ? (
                      <span className="mt-0.5 line-clamp-2 block text-[10px] leading-snug text-white/55">
                        {t.text}
                      </span>
                    ) : !hasImage && t.stat ? (
                      <span className="mt-0.5 block text-[10.5px] text-white/55">
                        {t.stat}
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-[10.5px] text-white/60 drop-shadow">
                        {has ? `${t.count} item${t.count === 1 ? "" : "s"}` : "Explore"}
                      </span>
                    )}
                  </span>
                </span>
              )}

              {has && (
                <span className="absolute right-2 top-2 z-10 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[rgba(59,102,246,0.6)] px-1.5 text-[10px] font-bold tabular-nums text-white backdrop-blur-sm">
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {open && (
        <Sheet
          label={tiles.find((t) => t.id === open)!.label}
          icon={tiles.find((t) => t.id === open)!.icon}
          onClose={() => setOpen(null)}
        >
          <BlockContent
            id={open}
            {...props}
            videos={videos}
            photos={photos}
            demos={demos}
          />
        </Sheet>
      )}
    </>
  );
}

// ── Bottom sheet (mobile) / centered dialog (desktop) ───────────────────────
function Sheet({
  label,
  icon: Icon,
  onClose,
  children,
}: {
  label: string;
  icon: typeof Sparkles;
  onClose: () => void;
  children: ReactNode;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/65 backdrop-blur-sm md:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="lg-glass animate-fade-up flex max-h-[85vh] w-full flex-col overflow-hidden !rounded-b-none !rounded-t-3xl md:max-h-[80vh] md:max-w-2xl md:!rounded-3xl"
        style={{ background: "rgba(14,16,22,0.86)" }}
      >
        <div className="flex shrink-0 items-center gap-2.5 border-b border-white/[0.1] px-5 py-3.5">
          <Icon size={17} className="text-[#A9BEFF]" />
          <h3 className="flex-1 text-[15px] font-semibold text-white">{label}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div
          className="overflow-y-auto px-5 py-5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
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
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-[13px] text-white/55">
        {isOwner
          ? `You haven't added ${thing} yet.`
          : `${name} hasn't added ${thing} yet.`}
      </p>
      {isOwner && addLabel && addHref && (
        <OwnerAdd label={addLabel} href={addHref} />
      )}
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

// ── Demos — a focused audio library that lives entirely inside the block ─────
// Owners upload audio files directly here (no redirect to Edit Profile), play
// them back, and remove them. Demos persist as `audio` items in the same
// featured_content the showcase uses, so we keep the full list and only mutate
// the audio entries — non-audio showcase tiles pass through untouched.
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const demos = items.filter(IS_DEMO);

  function persist(next: FeaturedContentItem[]) {
    setItems(next);
    setError(null);
    startSave(async () => {
      const res = await updateShowcaseAction(next);
      if (!res.ok) setError(res.error);
    });
  }

  async function onFile(file: File) {
    setError(null);
    const invalid = validateAudioFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadAudioToAvatars(file);
      if (!url) {
        setError("Upload didn't complete. Try again.");
        return;
      }
      const item: FeaturedContentItem = {
        id: newContentId(),
        type: "audio",
        url,
        title: file.name.replace(/\.[^./\\]+$/, "").trim() || "Untitled demo",
      };
      persist([...items, item]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function removeDemo(id: string) {
    persist(items.filter((i) => i.id !== id));
  }

  const hasContent = demos.length > 0 || tracks.length > 0;

  return (
    <div className="space-y-4">
      {/* Upload control (owner) — opens the picker straight away. */}
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
                <Upload size={15} /> Upload Demo
              </>
            )}
          </button>
          <p className="mt-1.5 text-center text-[11px] text-white/45">
            {AUDIO_FORMATS_HINT}
          </p>
          {error && (
            <p className="mt-1.5 text-center text-[12px] text-danger">{error}</p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={AUDIO_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Uploaded / linked demos */}
      {demos.length > 0 && (
        <ul className="space-y-2.5">
          {demos.map((d) => (
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
                <p className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-white">
                  {itemTitle(d)}
                </p>
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
              {isDirectAudio(d.url) ? (
                <audio controls src={d.url} className="mt-2.5 w-full" />
              ) : (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#A9BEFF] hover:text-white"
                >
                  <Play size={12} className="fill-current" /> Listen
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Legacy derived tracks keep playing for existing profiles. */}
      {tracks.length > 0 && <MediaPlayer tracks={tracks} />}

      {!hasContent && (
        <p className="py-6 text-center text-[13px] text-white/55">
          {isOwner
            ? "Upload your first demo — songs, rough mixes, beats, or works in progress."
            : `${name} hasn't added demos yet.`}
        </p>
      )}
    </div>
  );
}

// ── Per-block content ───────────────────────────────────────────────────────
function BlockContent(
  props: CreatorBlocksData & {
    id: BlockId;
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
      return props.featured.length ? (
        <MediaGallery items={props.featured} />
      ) : (
        <Empty isOwner={isOwner} name={name} thing="featured work" />
      );

    // Videos & Photos share Featured Work's functionality: the owner gets the
    // editable showcase (add / edit / reorder / pin); visitors see the filtered
    // gallery.
    case "videos":
      if (isOwner) {
        return <BlockShowcase initialItems={props.featured} isOwner={true} />;
      }
      return props.videos.length ? (
        <MediaGallery items={props.videos} />
      ) : (
        <Empty isOwner={isOwner} name={name} thing="videos" />
      );

    case "photos":
      if (isOwner) {
        return <BlockShowcase initialItems={props.featured} isOwner={true} />;
      }
      return props.photos.length ? (
        <MediaGallery items={props.photos} />
      ) : (
        <Empty isOwner={isOwner} name={name} thing="photos" />
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
