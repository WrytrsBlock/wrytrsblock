import {
  Headphones,
  Image as ImageIcon,
  Instagram,
  Link2,
  Music2,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import type { ContentType, FeaturedContentItem } from "@/types";

export type { ContentType, FeaturedContentItem };

// How a creator supplies each content type in Settings.
type InputKind = "url" | "image" | "audio";

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
    label: "Portfolio Link",
    badge: "Link",
    Icon: Link2,
    accent: "text-accent",
    input: "url",
    placeholder: "https://your-portfolio.com",
    hint: "Link to a portfolio or external piece of work.",
  },
];

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
