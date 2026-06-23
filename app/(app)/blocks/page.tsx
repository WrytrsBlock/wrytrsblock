import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass, Inbox, Users } from "lucide-react";
import { PendingRequests } from "@/components/block/pending-requests";
import { BlocksTabs } from "@/components/block/blocks-tabs";
import { getBlocks, getPendingRequests } from "@/lib/data";
import type { Block } from "@/lib/mock";

// My Blocks is a collaboration DASHBOARD — not a creation page. Blocks are
// created from Creator Profiles or Marketplace cards, never here. Requests,
// Active and Completed live in clear tabs so requests are never hidden away.
export default async function BlocksListPage() {
  const [blocks, pending] = await Promise.all([
    getBlocks(),
    getPendingRequests(),
  ]);

  const active = blocks.filter((b) => !isCompleted(b) && !b.archived);
  const completed = blocks.filter((b) => isCompleted(b) && !b.archived);
  const requestCount = pending.incoming.length + pending.outgoing.length;
  const isEmpty = requestCount === 0 && active.length === 0 && completed.length === 0;

  // Land on whichever tab actually needs the user — requests first (an incoming
  // one needs a decision), otherwise the work in progress.
  const initial =
    requestCount > 0 ? "requests" : active.length > 0 ? "active" : "completed";

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="page-fluid pb-16 pt-6 animate-fade-up">
        <header className="mb-5">
          <h1 className="font-display text-3xl md:text-4xl text-white tracking-tight">
            My Blocks
          </h1>
          <p className="mt-1 text-[12.5px] text-white/50">
            Your collaboration dashboard
          </p>
        </header>

        {isEmpty ? (
          <EmptyState />
        ) : (
          <BlocksTabs
            initial={initial}
            tabs={[
              {
                id: "requests",
                label: "Requests",
                count: requestCount,
                node:
                  requestCount > 0 ? (
                    <PendingRequests
                      incoming={pending.incoming}
                      outgoing={pending.outgoing}
                    />
                  ) : (
                    <TabEmpty icon={Inbox} text="No pending requests." />
                  ),
              },
              {
                id: "active",
                label: "Active",
                count: active.length,
                node:
                  active.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                      {active.map((b) => (
                        <ActiveCard key={b.id} block={b} />
                      ))}
                    </div>
                  ) : (
                    <TabEmpty icon={Users} text="No active Blocks yet." />
                  ),
              },
              {
                id: "completed",
                label: "Completed",
                count: completed.length,
                node:
                  completed.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      {completed.map((b) => (
                        <CompletedCard key={b.id} block={b} />
                      ))}
                    </div>
                  ) : (
                    <TabEmpty
                      icon={CheckCircle2}
                      text="No completed Blocks yet."
                    />
                  ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}

function TabEmpty({
  icon: Icon,
  text,
}: {
  icon: typeof Inbox;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/40">
        <Icon size={22} />
      </span>
      <p className="text-[13px] text-white/55">{text}</p>
    </div>
  );
}

// A Block is "done" once its completion is marked completed or it has shipped.
function isCompleted(b: Block): boolean {
  return b.completion?.status === "completed" || b.status === "Shipped";
}

function memberLabel(b: Block): string {
  const n = b.team?.length ?? 0;
  if (n <= 0) return "Just you";
  return `${n} Member${n === 1 ? "" : "s"}`;
}

// ── Cards ───────────────────────────────────────────────────────────────────
function ActiveCard({ block }: { block: Block }) {
  return (
    <Link
      href={`/blocks/${block.slug}`}
      className="group block overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-colors hover:border-white/[0.16]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={block.cover}
          alt={block.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="flex items-center gap-3 p-3.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-white">
            {block.title}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-white/55">
            <Users size={12} /> {memberLabel(block)}
          </p>
        </div>
        <ArrowPill />
      </div>
    </Link>
  );
}

function CompletedCard({ block }: { block: Block }) {
  return (
    <Link
      href={`/blocks/${block.slug}`}
      className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 transition-colors hover:border-white/[0.16]"
    >
      <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={block.cover}
          alt={block.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-white">
          {block.title}
        </p>
        <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-white/55">
          <Users size={12} /> {memberLabel(block)}
        </p>
        <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11.5px] text-emerald-400/80">
          <CheckCircle2 size={12} /> Completed {block.deadline}
        </p>
      </div>
      <ArrowPill />
    </Link>
  );
}

function ArrowPill() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grad-accent text-white transition-transform duration-200 group-hover:translate-x-0.5"
      style={{ color: "#FFFFFF" }}
    >
      <ArrowRight size={15} />
    </span>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="lg-glass mt-6 flex flex-col items-center gap-4 px-6 py-14 text-center !rounded-2xl">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/45">
        <Compass size={26} />
      </span>
      <div>
        <h2 className="text-[17px] font-semibold tracking-tight text-white">
          Start Your First Collaboration
        </h2>
        <p className="mx-auto mt-1.5 max-w-[34ch] text-[13px] leading-snug text-white/55">
          Find creators in the Marketplace and send a Block Request to begin
          collaborating.
        </p>
      </div>
      <Link
        href="/marketplace"
        className="lg-btn lg-btn-p"
        style={{ color: "#FFFFFF" }}
      >
        <Compass size={14} /> Browse Creators
      </Link>
    </div>
  );
}
