import {
  Briefcase,
  Disc3,
  Film,
  Headphones,
  Image as ImageIcon,
  Instagram,
  Layers,
  Link2,
  MessageSquareQuote,
  Music2,
  PartyPopper,
  Rocket,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import type { ContentType, FeaturedContentItem } from "@/types";

export type { ContentType, FeaturedContentItem };

// How a creator supplies each content type. "link" types accept a URL plus an
// optional uploaded thumbnail; "text" types are free-form (e.g. testimonials).
type InputKind = "url" | "image" | "audio" | "link" | "text";

type ContentMeta = {
  id: ContentType;
  label: string;
  badge: string; // short tag shown on cards
  Icon: LucideIcon;
  accent: string; // tailwind text-color for the type's icon
  input: InputKind;
  placeholder: string;
  hint: string;
};

// Order here drives the "Add content" type picker in Settings.
export const CONTENT_TYPES: ContentMeta[] = [
  {
    id: "youtube",
    label: "YouTube Video",
    badge: "YouTube",
    Icon: Youtube,
    accent: "text-danger",
    input: "url",
    placeholder: "https://youtube.com/watch?v=…",
    hint: "Paste a YouTube video link.",
  },
  {
    id: "youtube_short",
    label: "YouTube Short",
    badge: "Short",
    Icon: Youtube,
    accent: "text-danger",
    input: "url",
    placeholder: "https://youtube.com/shorts/…",
    hint: "Paste a YouTube Shorts link.",
  },
  {
    id: "instagram",
    label: "Instagram Reel",
    badge: "Reel",
    Icon: Instagram,
    accent: "text-accent-2",
    input: "url",
    placeholder: "https://instagram.com/reel/…",
    hint: "Paste an Instagram Reel link.",
  },
  {
    id: "tiktok",
    label: "TikTok Video",
    badge: "TikTok",
    Icon: Music2,
    accent: "text-ink",
    input: "url",
    placeholder: "https://tiktok.com/@you/video/…",
    hint: "Paste a TikTok video link.",
  },
  {
    id: "audio",
    label: "Audio Clip",
    badge: "Audio",
    Icon: Headphones,
    accent: "text-accent",
    input: "audio",
    placeholder: "https://… (SoundCloud, or a hosted .mp3)",
    hint: "Paste a streaming link or a hosted audio file URL.",
  },
  {
    id: "image",
    label: "Image",
    badge: "Image",
    Icon: ImageIcon,
    accent: "text-success",
    input: "image",
    placeholder: "Upload an image, or paste an image URL",
    hint: "Upload an image or paste a direct image URL.",
  },
  {
    id: "portfolio",
    label: "Portfolio Project",
    badge: "Project",
    Icon: Link2,
    accent: "text-accent",
    input: "url",
    placeholder: "https://your-portfolio.com",
    hint: "Link to a portfolio or external piece of work.",
  },
  {
    id: "video",
    label: "Video",
    badge: "Video",
    Icon: Film,
    accent: "text-danger",
    input: "link",
    placeholder: "https://… (Vimeo, a hosted .mp4, or any video link)",
    hint: "Paste a video link; add a thumbnail so the tile looks great.",
  },
  {
    id: "song",
    label: "Song",
    badge: "Song",
    Icon: Music2,
    accent: "text-accent",
    input: "link",
    placeholder: "https://… (Spotify, Apple Music, SoundCloud)",
    hint: "Link a song; add cover art as the thumbnail.",
  },
  {
    id: "beat_pack",
    label: "Beat Pack",
    badge: "Beats",
    Icon: Disc3,
    accent: "text-accent-2",
    input: "link",
    placeholder: "https://… (store or download link)",
    hint: "Link a beat pack; add cover art as the thumbnail.",
  },
  {
    id: "service",
    label: "Service",
    badge: "Service",
    Icon: Briefcase,
    accent: "text-accent-2",
    input: "link",
    placeholder: "/blocks/your-service  or  https://…",
    hint: "Promote a service you offer.",
  },
  {
    id: "block",
    label: "Active Block",
    badge: "Block",
    Icon: Layers,
    accent: "text-accent",
    input: "link",
    placeholder: "/blocks/your-block",
    hint: "Feature an active Block collaborators can join.",
  },
  {
    id: "release",
    label: "Upcoming Release",
    badge: "Release",
    Icon: Rocket,
    accent: "text-warning",
    input: "link",
    placeholder: "https://… (pre-save, store, or info link)",
    hint: "Tease an upcoming release with cover art + date.",
  },
  {
    id: "block_party",
    label: "Block Party",
    badge: "Party",
    Icon: PartyPopper,
    accent: "text-warning",
    input: "link",
    placeholder: "/blocks/your-block-party",
    hint: "Promote a Block Party event.",
  },
  {
    id: "testimonial",
    label: "Testimonial",
    badge: "Praise",
    Icon: MessageSquareQuote,
    accent: "text-success",
    input: "text",
    placeholder: "“Working with them was incredible…”",
    hint: "Add a quote from someone you've collaborated with.",
  },
];

// Showcase ordering: pinned tiles first, otherwise original order (stable).
export function sortShowcase(items: FeaturedContentItem[]): FeaturedContentItem[] {
  return [...items].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
}

// The best image to represent a tile (explicit thumbnail → image url → YouTube
// thumb). Returns null when the tile should render an icon/text instead.
export function tileThumb(item: FeaturedContentItem): string | null {
  if (item.thumbnail) return item.thumbnail;
  if (item.type === "image") return item.url || null;
  if (isVideoType(item.type)) {
    const id = youtubeId(item.url);
    if (id) return youtubeThumb(id);
  }
  return null;
}

export const contentMeta = (t: ContentType): ContentMeta =>
  CONTENT_TYPES.find((c) => c.id === t) ?? CONTENT_TYPES[0];

export const isVideoType = (t: ContentType) =>
  t === "youtube" || t === "youtube_short";

// ── YouTube helpers ─────────────────────────────────────────────────────────
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}
export const youtubeThumb = (id: string) =>
  `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
export const youtubeEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}`;

// ── Direct-file detection (so we can render <img> / <audio> inline) ─────────
export const isDirectImage = (url: string) =>
  /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(url);
export const isDirectAudio = (url: string) =>
  /\.(mp3|wav|m4a|ogg|aac|flac)(\?.*)?$/i.test(url);

// The featured item: the one flagged `featured`, else the first.
export function pickFeatured(
  items: FeaturedContentItem[]
): FeaturedContentItem | null {
  if (!items.length) return null;
  return items.find((i) => i.featured) ?? items[0];
}

// Display title for an item — explicit title, else the type label.
export const itemTitle = (i: FeaturedContentItem) =>
  i.title?.trim() || contentMeta(i.type).label;

// Stable-enough id for a new item (client-side).
export const newContentId = () =>
  `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
