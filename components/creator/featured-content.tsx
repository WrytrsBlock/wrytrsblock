import Link from "next/link";
import { ArrowUpRight, Headphones, Play, Plus, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  contentMeta,
  isDirectAudio,
  isVideoType,
  itemTitle,
  pickFeatured,
  youtubeEmbed,
  youtubeId,
  youtubeThumb,
  type FeaturedContentItem,
} from "@/lib/featured-content";

// ── Featured Content — a curated, premium showcase (NOT a feed). One featured
// item shown large, then a small gallery (up to 6). Empty state for owners. ──
export function FeaturedContent({
  items,
  isOwner,
}: {
  items: FeaturedContentItem[];
  isOwner: boolean;
}) {
  const featured = pickFeatured(items);

  if (!featured) {
    if (!isOwner) return null;
    return (
      <section>
        <h2 className="font-display text-xl text-ink tracking-tight">
          Featured Content
        </h2>
        <div className="mt-3 glass-card rounded-2xl px-5 py-8 text-center">
          <p className="text-[13.5px] text-ink font-medium">
            Showcase your work by adding Featured Content.
          </p>
          <p className="text-[12px] text-muted mt-1 max-w-xs mx-auto leading-relaxed">
            Show visitors why they should Start a Block with you.
          </p>
          <Link
            href="/profile/edit"
            className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-accent text-[12.5px] font-semibold text-white hover:bg-accent/90 transition-colors"
            style={{ color: "#FFFFFF" }}
          >
            <Plus size={14} /> Add Content
          </Link>
        </div>
      </section>
    );
  }

  const rest = items.filter((i) => i.id !== featured.id).slice(0, 6);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-ink tracking-tight">
          Featured Content
        </h2>
        {isOwner && (
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:underline"
          >
            Manage <ArrowUpRight size={12} />
          </Link>
        )}
      </div>

      <div className="mt-3.5">
        <FeaturedHero item={featured} />
      </div>

      {rest.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rest.map((item) => (
            <GalleryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── The featured (large) item ───────────────────────────────────────────────
function FeaturedHero({ item }: { item: FeaturedContentItem }) {
  const meta = contentMeta(item.type);
  const title = itemTitle(item);

  return (
    <div className="glass-card glass-glow rounded-3xl overflow-hidden">
      <div className="relative aspect-video bg-surface-2">
        <HeroMedia item={item} />
      </div>
      <div className="flex items-center gap-3 px-4 md:px-5 py-3.5">
        <span
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10",
            meta.accent
          )}
        >
          <meta.Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-warning">
              <Star size={11} className="fill-warning" /> Featured
            </span>
            <span className="text-[10px] text-muted">· {meta.badge}</span>
          </div>
          <p className="text-[14px] font-semibold text-ink truncate">{title}</p>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-[12.5px] font-medium text-ink bg-white/[0.06] border border-white/12 hover:bg-white/[0.1] hover:border-white/20 transition-colors"
        >
          Open <ArrowUpRight size={14} />
        </a>
      </div>
    </div>
  );
}

function HeroMedia({ item }: { item: FeaturedContentItem }) {
  if (isVideoType(item.type)) {
    const id = youtubeId(item.url);
    if (id) {
      return (
        <iframe
          src={youtubeEmbed(id)}
          title={itemTitle(item)}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      );
    }
    return <LinkMedia item={item} />;
  }
  if (item.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={itemTitle(item)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  if (item.type === "audio") return <AudioMedia item={item} />;
  return <LinkMedia item={item} />;
}

// Premium link card for embeds we don't inline (Instagram / TikTok / Portfolio).
function LinkMedia({ item }: { item: FeaturedContentItem }) {
  const meta = contentMeta(item.type);
  const cta =
    item.type === "portfolio"
      ? "Open Portfolio"
      : item.type === "instagram"
        ? "Watch on Instagram"
        : item.type === "tiktok"
          ? "Watch on TikTok"
          : `Open ${meta.badge}`;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-white/[0.07] to-white/[0.01] hover:from-white/[0.1] transition-colors"
    >
      <span
        className={cn(
          "inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/10",
          meta.accent
        )}
      >
        <meta.Icon size={30} />
      </span>
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">
        {cta} <ArrowUpRight size={15} />
      </span>
    </a>
  );
}

function AudioMedia({ item }: { item: FeaturedContentItem }) {
  const direct = isDirectAudio(item.url);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-accent/12 to-white/[0.01] px-6">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 border border-accent/30 text-accent">
        <Headphones size={26} />
      </span>
      <p className="text-[13px] font-semibold text-ink text-center line-clamp-1">
        {itemTitle(item)}
      </p>
      {direct ? (
        <audio controls src={item.url} className="w-full max-w-sm" />
      ) : (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-accent"
        >
          Listen <ArrowUpRight size={14} />
        </a>
      )}
    </div>
  );
}

// ── A compact gallery tile ──────────────────────────────────────────────────
function GalleryCard({ item }: { item: FeaturedContentItem }) {
  const meta = contentMeta(item.type);
  const title = itemTitle(item);
  const thumb = thumbFor(item);
  const showPlay = isVideoType(item.type) || item.type === "audio";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      aria-label={title}
      className="group glass-tile glass-hover rounded-2xl overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[4/3] bg-surface-2">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/[0.06] to-white/[0.01]",
              meta.accent
            )}
          >
            <meta.Icon size={26} />
          </span>
        )}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />

        {showPlay && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm border border-white/20 text-white">
              <Play size={16} className="fill-current ml-0.5" />
            </span>
          </span>
        )}

        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-black/45 backdrop-blur-sm border border-white/15 text-white text-[9.5px] font-semibold">
          <meta.Icon size={10} /> {meta.badge}
        </span>
      </div>
      <div className="p-2.5">
        <p className="text-[12px] font-medium text-ink truncate">{title}</p>
      </div>
    </a>
  );
}

function thumbFor(item: FeaturedContentItem): string | null {
  if (item.type === "image") return item.url;
  if (isVideoType(item.type)) {
    const id = youtubeId(item.url);
    return id ? youtubeThumb(id) : null;
  }
  return null;
}
