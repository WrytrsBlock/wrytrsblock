import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  Folder,
  Globe,
  Lock,
  MessagesSquare,
  Radio,
  Ticket,
  Users,
} from "lucide-react";
import { Badge, Card, SectionLabel } from "@/components/ui/primitives";
import { TeamRoster } from "./team-roster";
import {
  formatPartyDate,
  partyCountLabel,
  partyCtaLabel,
  partyPriceLabel,
  partyStatusLabel,
} from "@/lib/party";
import { getPerson, type Block } from "@/lib/mock";

// Block Party overview — fast and social. Leads with the event state (Live /
// Upcoming / Ended), when it starts, who's hosting, entry, and the headline
// count, then the primary action and quick jumps into the room.
export function PartyOverviewPanel({ block }: { block: Block }) {
  const party = block.party;
  const host = getPerson(block.leadId);
  const isLive = party?.status === "live";

  const facts = party
    ? [
        { icon: CalendarClock, label: formatPartyDate(party.startsAt) },
        { icon: Radio, label: party.category },
        { icon: Ticket, label: partyPriceLabel(block) },
        {
          icon: party.access === "invite" ? Lock : Globe,
          label: party.access === "invite" ? "Invite-only" : "Public",
        },
      ]
    : [];

  const jump = [
    {
      label: "Guests",
      icon: Users,
      href: `/blocks/${block.slug}?tab=team`,
      hint: `${block.team.length} in the room`,
    },
    {
      label: "Chat",
      icon: MessagesSquare,
      href: `/blocks/${block.slug}?tab=messages`,
      hint: party?.chatEnabled ? "live chat on" : "chat off",
    },
    {
      label: "Media",
      icon: Folder,
      href: `/blocks/${block.slug}?tab=files`,
      hint: `${block.files.length} items`,
    },
  ];

  return (
    <div className="px-5 md:px-8 py-6 md:py-8 max-w-[900px] space-y-6 animate-fade-up">
      {/* Event status + headline */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          {party && (
            <span
              className={
                isLive
                  ? "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-danger/15 text-danger border border-danger/30 text-[11px] font-semibold"
                  : "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-surface-3 text-ink/80 border border-line text-[11px] font-semibold"
              }
            >
              {isLive && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-danger opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-danger" />
                </span>
              )}
              {partyStatusLabel(party.status)}
            </span>
          )}
          {party && (
            <span className="text-[12px] text-muted">
              {partyCountLabel(party)}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {facts.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/40 px-3 py-2.5"
              >
                <Icon size={14} className="text-accent shrink-0" />
                <span className="text-[12px] text-ink truncate">{f.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className={
              isLive
                ? "inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-danger text-white text-[13.5px] font-semibold shadow-soft hover:bg-danger/90 transition-colors"
                : "inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-grad-accent text-white text-[13.5px] font-semibold shadow-glow hover:opacity-95 transition-opacity"
            }
          >
            {isLive && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
            )}
            {partyCtaLabel(block)}
          </button>
          {host && (
            <span className="text-[12px] text-muted">
              Hosted by <span className="text-ink font-medium">{host.name}</span>
            </span>
          )}
        </div>
      </Card>

      {/* Who's in the room */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <SectionLabel>In the room</SectionLabel>
          {party?.capacity ? (
            <Badge tone="soft">Capacity {party.capacity}</Badge>
          ) : null}
        </div>
        <div className="mt-4">
          <TeamRoster ids={block.team} blockSlug={block.slug} />
        </div>
      </Card>

      {/* Jump to */}
      <section>
        <SectionLabel>Jump to</SectionLabel>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {jump.map((j) => {
            const Icon = j.icon;
            return (
              <Link key={j.label} href={j.href} className="group block">
                <Card hover className="p-4 h-full">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 border border-line text-accent">
                      <Icon size={16} strokeWidth={1.75} />
                    </span>
                    <ArrowUpRight
                      size={14}
                      className="text-muted/60 group-hover:text-ink transition-colors"
                    />
                  </div>
                  <p className="mt-3 text-[13px] font-medium text-ink">
                    {j.label}
                  </p>
                  <p className="text-[10.5px] text-muted mt-0.5">{j.hint}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
