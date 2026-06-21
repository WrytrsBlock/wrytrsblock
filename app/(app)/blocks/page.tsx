import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Inbox,
  Send,
} from "lucide-react";
import {
  BlockRequestInbox,
  type IncomingRequest,
} from "@/components/block/block-request-inbox";
import {
  getBlocks,
  getIncomingBlockRequests,
  getOutgoingBlockRequests,
  type OutgoingRequest,
} from "@/lib/data";
import { getPerson, type Block } from "@/lib/mock";

// My Blocks is a collaboration DASHBOARD — not a creation page. Blocks are
// created from Creator Profiles or Marketplace cards, never here.
export default async function BlocksListPage() {
  const [blocks, incoming, outgoing] = await Promise.all([
    getBlocks(),
    getIncomingBlockRequests(),
    getOutgoingBlockRequests(),
  ]);

  const active = blocks.filter((b) => !isCompleted(b) && !b.archived);
  const completed = blocks.filter((b) => isCompleted(b) && !b.archived);
  const hasPending = incoming.length > 0 || outgoing.length > 0;
  const isEmpty = !hasPending && active.length === 0 && completed.length === 0;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="page-fluid pb-16 pt-6 animate-fade-up">
        <header className="mb-4">
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
          <div className="space-y-5">
            {/* 1 — Pending Requests */}
            {hasPending && (
              <Section title="Pending Requests" count={incoming.length + outgoing.length}>
                {incoming.length > 0 && (
                  <div className="mb-3">
                    <SubLabel icon={Inbox} text="Incoming" />
                    <BlockRequestInbox requests={incoming} hideHeading />
                  </div>
                )}
                {outgoing.length > 0 && (
                  <div>
                    <SubLabel icon={Send} text="Outgoing" />
                    <div className="space-y-2">
                      {outgoing.map((o) => (
                        <OutgoingRow key={o.id} req={o} />
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* 2 — Active Blocks */}
            {active.length > 0 && (
              <Section title="Active Blocks" count={active.length}>
                <div className="space-y-2">
                  {active.map((b) => (
                    <ActiveRow key={b.id} block={b} />
                  ))}
                </div>
              </Section>
            )}

            {/* 3 — Completed Blocks */}
            {completed.length > 0 && (
              <Section title="Completed Blocks" count={completed.length}>
                <div className="space-y-2">
                  {completed.map((b) => (
                    <CompletedRow key={b.id} block={b} />
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// A Block is "done" once its completion is marked completed or it has shipped.
function isCompleted(b: Block): boolean {
  return b.completion?.status === "completed" || b.status === "Shipped";
}

// ── Layout helpers ──────────────────────────────────────────────────────────
function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-white/55">
        {title}
        {typeof count === "number" && (
          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white/[0.08] px-1.5 text-[10.5px] font-semibold tabular-nums text-white/70">
            {count}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

function SubLabel({
  icon: Icon,
  text,
}: {
  icon: typeof Inbox;
  text: string;
}) {
  return (
    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/40">
      <Icon size={12} /> {text}
    </p>
  );
}

// Compact avatar stack from a team's member ids (resolves in demo/mock data).
function Collaborators({ ids }: { ids: string[] }) {
  const people = ids.map((id) => getPerson(id)).filter(Boolean).slice(0, 4);
  const extra = ids.length - people.length;
  if (people.length === 0) {
    return <span className="text-[11.5px] text-white/40">Just you</span>;
  }
  return (
    <div className="flex items-center -space-x-1.5">
      {people.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p!.id}
          src={p!.avatar}
          alt={p!.name}
          className="h-5 w-5 rounded-full border border-[#0d0f14] object-cover"
        />
      ))}
      {extra > 0 && (
        <span className="flex h-5 items-center rounded-full border border-[#0d0f14] bg-white/[0.1] px-1.5 text-[10px] font-medium text-white/70">
          +{extra}
        </span>
      )}
    </div>
  );
}

// ── Rows ────────────────────────────────────────────────────────────────────
function ActiveRow({ block }: { block: Block }) {
  const last = block.activity?.[0]?.at;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-white">
          {block.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Collaborators ids={block.team} />
          <span className="inline-flex items-center gap-1 text-[11px] text-white/45">
            <Clock size={11} /> {last ?? "No recent activity"}
          </span>
        </div>
      </div>
      <Link
        href={`/blocks/${block.slug}`}
        className="lg-btn shrink-0 !py-1.5 !px-3 text-[12px]"
      >
        Open <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function CompletedRow({ block }: { block: Block }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5">
      <CheckCircle2 size={16} className="shrink-0 text-emerald-400/80" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-white">
          {block.title}
        </p>
        <div className="mt-1">
          <Collaborators ids={block.team} />
        </div>
      </div>
      <span className="shrink-0 text-[11.5px] text-white/45">
        {block.deadline}
      </span>
    </div>
  );
}

function OutgoingRow({ req }: { req: OutgoingRequest }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-white">
          {req.blockTitle}
        </p>
        <p className="mt-0.5 text-[11.5px] text-white/45">Request sent</p>
      </div>
      <span className="shrink-0 inline-flex h-6 items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 text-[11px] font-medium text-amber-300">
        Pending
      </span>
    </div>
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
      <Link href="/marketplace" className="lg-btn lg-btn-p" style={{ color: "#FFFFFF" }}>
        <Compass size={14} /> Browse Creators
      </Link>
    </div>
  );
}
