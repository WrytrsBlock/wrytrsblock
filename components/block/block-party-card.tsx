import Link from "next/link";
import { CalendarClock, Radio, Users } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import {
  formatPartyDate,
  partyCountLabel,
  partyCtaLabel,
  partyPriceLabel,
  partyStatusLabel,
} from "@/lib/party";
import { getPerson, type Block } from "@/lib/mock";

// Event-style card for a Block Party — built to feel fast and social. Leads with
// the live/upcoming state and a big people count, then a state-aware CTA
// (Live Now / Buy Entry / RSVP / View Recap).
export function BlockPartyCard({ block }: { block: Block }) {
  const party = block.party;
  const host = getPerson(block.leadId);
  const isLive = party?.status === "live";
  const cta = partyCtaLabel(block);

  return (
    <article className="group relative flex flex-col rounded-2xl border border-line bg-surface overflow-hidden hover:border-line-strong hover:shadow-elevated transition-all duration-300 animate-fade-up">
      {/* Whole card opens the Block Party room */}
      <Link
        href={`/blocks/${block.slug}?type=block_party`}
        aria-label={block.title}
        className="absolute inset-0 z-0"
      />

      {/* Cover */}
      <div className="pointer-events-none relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={block.cover}
          alt=""
          className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Status pill */}
        {party && (
          <span
            className={
              isLive
                ? "absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-danger text-white text-[10px] font-bold uppercase tracking-[0.05em]"
                : "absolute top-2.5 left-2.5 inline-flex items-center h-6 px-2.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-[0.05em]"
            }
          >
            {isLive && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            )}
            {partyStatusLabel(party.status)}
          </span>
        )}

        {/* People count */}
        {party && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-medium">
            <Users size={12} />
            {partyCountLabel(party)}
          </span>
        )}

        {/* Category */}
        {party && (
          <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-accent/85 text-white text-[10px] font-semibold uppercase tracking-[0.04em]">
            <Radio size={11} />
            {party.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="pointer-events-none p-3.5 flex flex-col flex-1">
        {/* Title + host */}
        <div className="flex items-center gap-2">
          {host && (
            <Avatar
              src={host.avatar}
              name={host.name}
              size={22}
              className="shrink-0"
            />
          )}
          <span className="flex-1 min-w-0 font-display text-[15px] text-ink truncate">
            {block.title}
          </span>
        </div>
        {host && (
          <p className="mt-1 text-[11.5px] text-muted truncate">
            Hosted by {host.name}
          </p>
        )}

        {/* Date / time */}
        {party && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-ink/90">
            <CalendarClock size={13} className="text-accent shrink-0" />
            {formatPartyDate(party.startsAt)}
          </p>
        )}

        {/* Footer — entry price + state CTA */}
        <div className="mt-3 flex items-end justify-between gap-2">
          <p className="text-[13px] text-ink font-semibold">
            {partyPriceLabel(block)}
          </p>
          <Link
            href={`/blocks/${block.slug}?type=block_party`}
            className={
              isLive
                ? "pointer-events-auto relative z-10 inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-danger text-white text-[12px] font-semibold shadow-soft hover:bg-danger/90 transition-colors"
                : "pointer-events-auto relative z-10 inline-flex items-center h-8 px-4 rounded-lg bg-grad-accent text-white text-[12px] font-medium shadow-glow hover:opacity-95 transition-opacity"
            }
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
