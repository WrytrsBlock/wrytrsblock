import Link from "next/link";
import { CalendarClock, Star, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { BlockCover } from "@/components/block/block-cover";
import {
  formatPartyDate,
  partyCountLabel,
  partyStatusLabel,
} from "@/lib/party";
import type { Block, Person } from "@/lib/mock";

// A My Blocks card in the same premium visual language as the Block Market
// creator cards: full-bleed cover, frosted-glass gradient band, large title,
// a status badge pinned top-right, and a type-aware CTA inside the overlay.
export function MyBlockCard({
  block,
  lead,
  score,
  index = 0,
}: {
  block: Block;
  lead: Person | null;
  score?: number;
  index?: number;
}) {
  const party = block.party;
  const isParty = block.blockType === "block_party";
  const isService = block.blockType === "service";
  const isLive = isParty && party?.status === "live";

  // Whole card opens the Block; Service's CTA jumps to its requests tab.
  const openHref = isParty
    ? `/blocks/${block.slug}?type=block_party`
    : `/blocks/${block.slug}`;
  const ctaHref = isService ? `/blocks/${block.slug}?tab=requests` : openHref;

  const cta = isParty
    ? isLive
      ? "Join Live"
      : party?.status === "ended"
        ? "View Recap"
        : "RSVP"
    : isService
      ? "View Requests"
      : "Open Block";

  const typeLabel = isParty
    ? party?.category ?? "Block Party"
    : isService
      ? "Service Block"
      : "Collaboration Block";

  const statusLabel = isParty
    ? partyStatusLabel(party?.status ?? "upcoming")
    : block.status;
  const priceLabel = block.price ? `From $${block.price}` : "Free";

  return (
    <article
      className="group relative aspect-[4/5] rounded-2xl overflow-hidden glass-tile glass-hover animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
    >
      {/* Full-bleed cover — branded placeholder when missing or it fails to load */}
      <BlockCover src={block.cover} type={block.blockType} />

      {/* Whole card opens the Block (preserves existing behavior) */}
      <Link
        href={openHref}
        aria-label={block.title}
        className="absolute inset-0 z-0"
      />

      {/* Status badge — pinned top-right */}
      <span
        className={cn(
          "absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.05em] border backdrop-blur-sm",
          isLive
            ? "bg-danger text-white border-danger/60"
            : "bg-black/45 text-white border-white/15"
        )}
      >
        {isLive && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        )}
        {statusLabel}
      </span>

      {/* Frosted glass gradient band — same language as Block Market cards */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/65 via-black/40 to-black/15 backdrop-blur-md border-t border-white/15 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]">
        <div className="relative px-3.5 pt-2 pb-2.5">
          {/* Block type — white for readability over bright images */}
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">
            {typeLabel}
          </span>

          {/* Title — primary, full white */}
          <Link href={openHref} className="block">
            <h3 className="font-display text-[16px] md:text-[18px] text-white leading-tight tracking-tight truncate">
              {block.title}
            </h3>
          </Link>

          {/* Meta — white opacity scale (name secondary, the rest tertiary) */}
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/60 leading-tight min-w-0">
            {isParty ? (
              <>
                <CalendarClock size={11} className="shrink-0" />
                <span className="truncate">
                  {formatPartyDate(party?.startsAt ?? "")}
                </span>
                {party && (
                  <>
                    <span className="text-white/40 shrink-0">·</span>
                    <Users size={11} className="shrink-0" />
                    <span className="shrink-0">{partyCountLabel(party)}</span>
                  </>
                )}
              </>
            ) : isService ? (
              <span className="truncate">
                {lead ? (
                  <>
                    <span className="font-medium text-white/80">
                      {lead.name}
                    </span>{" "}
                    · {priceLabel}
                  </>
                ) : (
                  priceLabel
                )}
              </span>
            ) : (
              <>
                <span className="truncate font-medium text-white/80">
                  {lead?.name ?? block.tagline}
                </span>
                {typeof score === "number" && (
                  <>
                    <span className="text-white/40 shrink-0">·</span>
                    <Star size={11} className="text-warning fill-warning shrink-0" />
                    <span className="shrink-0 tabular-nums">{score}</span>
                  </>
                )}
              </>
            )}
          </p>

          {/* CTA — type-aware, integrated into the overlay */}
          <Link
            href={ctaHref}
            aria-label={cta}
            className={cn(
              "mt-2.5 w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12.5px] font-semibold text-white transition-colors",
              isLive
                ? "bg-danger border border-danger hover:bg-danger/90"
                : "bg-white/[0.16] border border-white/25 hover:bg-accent hover:border-accent"
            )}
            style={{ color: "#FFFFFF" }}
          >
            {isLive && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            )}
            {cta}
          </Link>
        </div>
      </div>
    </article>
  );
}
