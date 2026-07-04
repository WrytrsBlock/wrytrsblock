"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CalendarPlus,
  Camera,
  Inbox,
  Loader2,
  Play,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { supabaseConfigured } from "@/lib/env";
import { IMAGE_ACCEPT, uploadToAvatars, validateImageFile } from "@/lib/upload-image";
import { updateBlockCoverAction } from "@/app/actions/blocks";
import { BlockCover } from "@/components/block/block-cover";
import {
  formatPartyDate,
  partyCountLabel,
  partyStatusLabel,
} from "@/lib/party";
import type { Block, Person } from "@/lib/mock";

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

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

  // A single, recognizable icon for the square CTA, per Block type/state.
  const CtaIcon = isLive
    ? Play
    : isParty
      ? party?.status === "ended"
        ? Play
        : CalendarPlus
      : isService
        ? Inbox
        : ArrowUpRight;

  const typeLabel = isParty
    ? party?.category ?? "Block Party"
    : isService
      ? "Service Block"
      : "Collaboration Block";

  const statusLabel = isParty
    ? partyStatusLabel(party?.status ?? "upcoming")
    : block.status;
  const priceLabel = block.price ? `From $${block.price}` : "Free";

  const realBlock = supabaseConfigured && isUuid(block.id);
  const [cover, setCover] = useState(block.cover);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);

  async function onCoverFile(file: File) {
    const invalid = validateImageFile(file);
    if (invalid) return; // no space for an inline error on a card; fail quietly

    if (!realBlock) {
      setCover(URL.createObjectURL(file));
      return;
    }

    setCoverUploading(true);
    try {
      const url = await uploadToAvatars(file, "block-cover");
      if (!url) return;
      const res = await updateBlockCoverAction(block.slug, url);
      if (res.ok) setCover(url);
    } catch (e) {
      console.error("Block cover upload failed:", e);
    } finally {
      setCoverUploading(false);
    }
  }

  return (
    <article
      className="group relative aspect-[4/5] rounded-[20px] overflow-hidden glass-tile glass-hover animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
    >
      {/* Full-bleed cover — branded placeholder when missing or it fails to load */}
      <BlockCover src={cover} type={block.blockType} />

      {/* Whole card opens the Block (preserves existing behavior) */}
      <Link
        href={openHref}
        aria-label={block.title}
        className="absolute inset-0 z-0"
      />

      {/* Change cover — right on the card, no need to open Settings. Sits above
          the card's Link so a click here doesn't navigate. */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          coverInput.current?.click();
        }}
        aria-label="Change cover image"
        className="absolute top-2 left-1/2 z-20 -translate-x-1/2 inline-flex h-7 items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-2.5 text-[10.5px] font-medium text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
      >
        {coverUploading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Camera size={12} />
        )}
        {coverUploading ? "Uploading…" : "Change cover"}
      </button>
      <input
        ref={coverInput}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onCoverFile(f);
          e.target.value = "";
        }}
      />

      {/* Status badge — pinned top-right. An unanswered invite reads as Pending
          (amber); otherwise the Block's own status. */}
      <span
        className={cn(
          "absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.05em] border backdrop-blur-sm",
          block.myStatus === "pending"
            ? "bg-[#E8B43A] text-black border-[#E8B43A]/60"
            : isLive
              ? "bg-danger text-white border-danger/60"
              : "bg-black/45 text-white border-white/15"
        )}
      >
        {isLive && block.myStatus !== "pending" && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        )}
        {block.myStatus === "pending" ? "Invited" : statusLabel}
      </span>

      {/* Owner tag — bottom-left corner, only on Blocks you own. */}
      {block.isOwner && (
        <span className="absolute top-2 left-2 z-10 inline-flex h-6 items-center rounded-full border border-white/20 bg-black/45 px-2.5 text-[10px] font-bold uppercase tracking-[0.05em] text-white backdrop-blur-sm">
          Owner
        </span>
      )}

      {/* Translucent gradient, low on the card — halved opacity vs. before so
          the cover shows through clearly rather than reading as a solid band.
          Title/meta on the left, a square type-aware CTA on the right.
          pointer-events-none so taps fall through to the card link; the title
          and CTA re-enable their own clicks. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2.5 bg-gradient-to-t from-black/38 via-black/14 to-transparent px-3.5 pb-3 pt-14 md:px-4">
        <div className="min-w-0">
          {/* Block type */}
          <span className="block truncate text-[10px] font-bold uppercase tracking-[0.12em] text-white/75 drop-shadow-[0_1px_3px_rgb(0_0_0/0.6)]">
            {typeLabel}
          </span>

          {/* Title */}
          <Link href={openHref} className="pointer-events-auto block">
            <h3 className="mt-0.5 font-display text-[16px] md:text-[19px] text-white leading-tight tracking-tight truncate drop-shadow-[0_1px_4px_rgb(0_0_0/0.55)]">
              {block.title}
            </h3>
          </Link>

          {/* Meta */}
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-white/75 leading-tight min-w-0 drop-shadow-[0_1px_3px_rgb(0_0_0/0.6)]">
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
                    <span className="font-medium text-white/85">
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
                <span className="truncate font-medium text-white/85">
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
        </div>

        {/* Square CTA — type-aware icon (live is red) */}
        <Link
          href={ctaHref}
          aria-label={cta}
          title={cta}
          className={cn(
            "pointer-events-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white backdrop-blur-md transition-colors",
            isLive
              ? "bg-danger border border-danger hover:bg-danger/90"
              : "bg-[rgba(59,102,246,0.55)] border border-[rgba(140,170,255,0.6)] border-t-[rgba(185,205,255,0.75)] shadow-[0_4px_18px_rgba(59,102,246,0.4)] hover:bg-[rgba(59,102,246,0.78)]"
          )}
          style={{ color: "#FFFFFF" }}
        >
          <CtaIcon
            size={18}
            strokeWidth={2.2}
            className={CtaIcon === Play ? "fill-current ml-0.5" : ""}
          />
        </Link>
      </div>
    </article>
  );
}
