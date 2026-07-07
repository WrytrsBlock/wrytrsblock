"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import {
  Layers,
  MapPin,
  Pause,
  Play,
  Plus,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { sanitizeUrl } from "@/lib/safe-url";
import { openNewBlock } from "@/lib/ui-events";
import { cardCoverFor } from "@/lib/creator-image";
import {
  contentMeta,
  isDirectAudio,
  isDirectVideo,
  isVideoType,
  pickFeatured,
  youtubeEmbed,
  youtubeId,
} from "@/lib/featured-content";
import type { CreatorProfile, Person } from "@/lib/mock";
import type { FeaturedContentItem } from "@/types";

type Creator = { person: Person; profile: CreatorProfile };

// One swipe = one creator, browsing their existing Featured content (video,
// audio, a photo carousel, or a featured collaboration) full-bleed. Fed by the
// SAME `filtered` list the Grid view uses, so switching modes never loses the
// active search/filters — it just changes how those results are browsed.
export function DiscoveryFeed({ creators }: { creators: Creator[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (creators.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-8 text-center">
        <div>
          <p className="text-[14px] font-medium text-white">No creators found</p>
          <p className="mt-1 text-[12.5px] text-white/55">
            Try clearing a filter or adjusting your search.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain"
    >
      {creators.map((c) => (
        <DiscoverySlide key={c.person.id} creator={c} containerRef={containerRef} />
      ))}
    </div>
  );
}

function DiscoverySlide({
  creator,
  containerRef,
}: {
  creator: Creator;
  containerRef: RefObject<HTMLDivElement>;
}) {
  const { person, profile } = creator;
  const slideRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  // Only the slide that's actually on screen plays media — everything else
  // stays paused/unmounted, so scrolling the feed never stacks up audio/video.
  useEffect(() => {
    const el = slideRef.current;
    const root = containerRef.current;
    if (!el || !root) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting && entry.intersectionRatio >= 0.6),
      { root, threshold: [0, 0.6, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  const media = resolveDiscoveryMedia(profile, person);

  return (
    <section
      ref={slideRef}
      className="relative h-full w-full snap-start snap-always overflow-hidden bg-black"
    >
      <DiscoveryMedia media={media} active={active} personName={person.name} />

      {/* Overlay — deliberately minimal: photo, name, primary type, location,
          Start Block. Nothing else, so the creator's content stays the focus. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-24">
        <div className="pointer-events-auto flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={person.avatar}
                name={person.name}
                size={40}
                className="border-2 border-white/30"
              />
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold text-white drop-shadow-[0_1px_4px_rgb(0_0_0/0.55)]">
                  {person.name}
                </p>
                <p className="truncate text-[12.5px] text-white/80 drop-shadow-[0_1px_3px_rgb(0_0_0/0.6)]">
                  {profile.roles[0] ?? "Creator"}
                </p>
              </div>
            </div>
            {profile.location && (
              <p className="mt-2 inline-flex items-center gap-1 text-[12px] text-white/70 drop-shadow-[0_1px_3px_rgb(0_0_0/0.6)]">
                <MapPin size={12} /> {profile.location}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => openNewBlock("collaboration", person.handle)}
            aria-label={`Start a Block with ${person.name}`}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors hover:bg-white/90"
          >
            <Plus size={14} strokeWidth={2.6} /> Start Block
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Featured-content resolution ─────────────────────────────────────────────
type DiscoveryMedia =
  | { kind: "photos"; images: string[] }
  | { kind: "video"; item: FeaturedContentItem }
  | { kind: "audio"; item: FeaturedContentItem }
  | { kind: "collab"; item: FeaturedContentItem }
  | { kind: "fallback"; image: string };

function resolveDiscoveryMedia(
  profile: CreatorProfile,
  person: Person
): DiscoveryMedia {
  const items = profile.featuredContent ?? [];
  const hero = pickFeatured(items);
  if (!hero) return { kind: "fallback", image: cardCoverFor(person, profile) };

  if (hero.type === "image") {
    const images = items
      .filter((i) => i.type === "image" && i.url)
      .map((i) => i.url);
    return { kind: "photos", images: images.length ? images : [hero.url] };
  }
  if (
    isVideoType(hero.type) ||
    hero.type === "video" ||
    hero.type === "instagram" ||
    hero.type === "tiktok"
  ) {
    return { kind: "video", item: hero };
  }
  if (hero.type === "audio" || hero.type === "song") {
    return { kind: "audio", item: hero };
  }
  if (hero.type === "block") {
    return { kind: "collab", item: hero };
  }
  return { kind: "fallback", image: cardCoverFor(person, profile) };
}

function DiscoveryMedia({
  media,
  active,
  personName,
}: {
  media: DiscoveryMedia;
  active: boolean;
  personName: string;
}) {
  switch (media.kind) {
    case "photos":
      return <PhotoCarousel images={media.images} alt={personName} />;
    case "video":
      return <VideoMedia item={media.item} active={active} />;
    case "audio":
      return <AudioMedia item={media.item} active={active} />;
    case "collab":
      return <CollabCard item={media.item} />;
    default:
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      );
  }
}

// Photo carousel — Stories-style: thin progress segments up top, tap the left
// or right half to step back/forward.
function PhotoCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const clamped = Math.max(0, Math.min(index, images.length - 1));

  function go(delta: number) {
    setIndex((i) => Math.max(0, Math.min(images.length - 1, i + delta)));
  }

  return (
    <div className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[clamped]}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {images.length > 1 && (
        <>
          <div className="absolute inset-x-3 top-[calc(env(safe-area-inset-top)+3.25rem)] z-10 flex gap-1">
            {images.map((_, i) => (
              <div
                key={i}
                className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25"
              >
                <div
                  className={cn(
                    "h-full bg-white transition-all duration-200",
                    i <= clamped ? "w-full" : "w-0"
                  )}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => go(-1)}
            className="absolute inset-y-0 left-0 z-10 w-1/2"
          />
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => go(1)}
            className="absolute inset-y-0 right-0 z-10 w-1/2"
          />
        </>
      )}
    </div>
  );
}

// Video — YouTube (embed) or a direct hosted file. Muted autoplay/loop while
// the slide is active (paused/unmounted otherwise), with a tap-to-unmute
// affordance since a feed full of loud clips would be unusable.
function VideoMedia({ item, active }: { item: FeaturedContentItem; active: boolean }) {
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active]);

  const ytId = isVideoType(item.type) ? youtubeId(item.url) : null;
  const direct = item.type === "video" && isDirectVideo(item.url);

  if (!ytId && !direct) return <ExternalContentCard item={item} />;

  return (
    <div className="absolute inset-0 bg-black">
      {ytId ? (
        active && (
          <iframe
            key={`${ytId}-${muted}`}
            src={`${youtubeEmbed(ytId)}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${ytId}&controls=0&playsinline=1&modestbranding=1`}
            title={item.title ?? "Featured video"}
            allow="autoplay; encrypted-media"
            className="absolute inset-0 h-full w-full"
          />
        )
      ) : (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          ref={videoRef}
          src={item.url}
          muted={muted}
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute right-3 top-[calc(env(safe-area-inset-top)+3.25rem)] z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  );
}

// Audio — tap to play/pause, consistent with the rest of the app never
// auto-starting sound. Pauses automatically once the slide scrolls away.
function AudioMedia({ item, active }: { item: FeaturedContentItem; active: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const playable = isDirectAudio(item.url);

  useEffect(() => {
    if (!active && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  }, [active]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().catch(() => {});
      setPlaying(true);
    }
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#33457E] to-[#1B2647]">
      {item.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
      )}
      {item.title && (
        <p className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+3.25rem)] px-8 text-center text-[13px] font-medium text-white/90">
          {item.title}
        </p>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        {playable ? (
          <>
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pause" : "Play"}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-xl transition-transform active:scale-95"
            >
              {playing ? (
                <Pause size={26} className="fill-current" />
              ) : (
                <Play size={26} className="translate-x-0.5 fill-current" />
              )}
            </button>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio ref={audioRef} src={item.url} loop />
          </>
        ) : (
          <ExternalContentCard item={item} />
        )}
      </div>
    </div>
  );
}

// Featured collaboration (an Active Block a creator wants to show off).
function CollabCard({ item }: { item: FeaturedContentItem }) {
  const href = sanitizeUrl(item.url) ?? "#";
  const internal = href.startsWith("/") && !href.startsWith("//");
  return (
    <Link
      href={href}
      {...(internal ? {} : { target: "_blank", rel: "noreferrer" })}
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#33457E] to-[#1B2647] px-8 text-center"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white">
        <Layers size={28} />
      </span>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
        Featured Collaboration
      </p>
      <p className="font-display text-xl text-white">{item.title || "Active Block"}</p>
    </Link>
  );
}

// Content that can't be embedded inline (Instagram/TikTok links, portfolio
// pieces, etc.) — a clean card linking out instead of a broken/blank slide.
function ExternalContentCard({ item }: { item: FeaturedContentItem }) {
  const meta = contentMeta(item.type);
  const Icon = meta.Icon;
  return (
    <a
      href={sanitizeUrl(item.url) ?? "#"}
      target="_blank"
      rel="noreferrer"
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#33457E] to-[#1B2647] px-8 text-center"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white">
        <Icon size={28} />
      </span>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
        {meta.badge}
      </p>
      <p className="font-display text-lg text-white">{item.title || meta.label}</p>
      <p className="text-[12px] text-white/60">Tap to view</p>
    </a>
  );
}
