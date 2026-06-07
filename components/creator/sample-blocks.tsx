import type { LucideIcon } from "lucide-react";
import { Briefcase, PartyPopper, Users } from "lucide-react";
import { Badge, Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

// ── Sample Blocks ───────────────────────────────────────────────────────────
// Polished, illustrative example cards shown ONLY when a creator has no real
// Blocks yet, so a new profile never feels empty. These are 100% presentational
// and hardcoded here — they are NEVER written to the database and never link
// anywhere, and each is clearly marked EXAMPLE so demo data can't be confused
// with real user data.

type SampleBlock = {
  title: string;
  meta: string;
  typeLabel: string;
  tone: "accent" | "accent-2" | "warning";
  icon: LucideIcon;
  gradient: string; // gradient for the media area (no external image to break)
  status: string;
  percent: number;
};

const SAMPLE_BLOCKS: SampleBlock[] = [
  {
    title: "Midnight Sessions — EP",
    meta: "Collaboration · 4 collaborators",
    typeLabel: "Collaboration",
    tone: "accent",
    icon: Users,
    gradient: "from-accent/30 via-accent/10 to-transparent",
    status: "In progress",
    percent: 68,
  },
  {
    title: "Mix & Master — Single",
    meta: "Service · Audio engineering",
    typeLabel: "Service",
    tone: "accent-2",
    icon: Briefcase,
    gradient: "from-accent-2/30 via-accent-2/10 to-transparent",
    status: "Accepting requests",
    percent: 100,
  },
  {
    title: "Beat Lab — Live",
    meta: "Block Party · Live session",
    typeLabel: "Block Party",
    tone: "warning",
    icon: PartyPopper,
    gradient: "from-warning/30 via-warning/10 to-transparent",
    status: "Upcoming",
    percent: 25,
  },
];

export function SampleBlocks() {
  return (
    <section aria-label="Sample Blocks (examples)">
      <div className="flex items-center gap-2.5">
        <h2 className="font-display text-xl text-ink tracking-tight">
          Sample Blocks
        </h2>
        <span className="inline-flex items-center h-5 px-2 rounded-full bg-warning/15 border border-warning/30 text-warning text-[10px] font-bold uppercase tracking-[0.1em]">
          Example
        </span>
      </div>
      <p className="mt-1.5 text-[12.5px] text-muted leading-relaxed max-w-xl">
        A preview of what your Blocks will look like once you start
        collaborating. These are examples — not real Blocks.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SAMPLE_BLOCKS.map((b) => {
          const Icon = b.icon;
          return (
            // A non-interactive card (a <div>, not a link) so it can never be
            // mistaken for — or navigate to — a real Block.
            <div
              key={b.title}
              aria-label={`${b.typeLabel} (example)`}
              className="relative select-none cursor-default glass-card flex flex-col rounded-2xl overflow-hidden"
            >
              {/* EXAMPLE ribbon — always visible, top-right. */}
              <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center h-5 px-2 rounded-md bg-black/55 backdrop-blur-sm border border-white/20 text-white text-[9.5px] font-bold uppercase tracking-[0.12em]">
                Example
              </span>

              <div
                className={cn(
                  "relative aspect-[16/9] overflow-hidden bg-gradient-to-br",
                  b.gradient
                )}
              >
                <div className="absolute inset-0 bg-grad-mesh opacity-20" />
                <span className="absolute inset-0 flex items-center justify-center text-ink/70">
                  <Icon size={30} strokeWidth={1.5} />
                </span>
                <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute top-2.5 left-2.5">
                  <Badge tone={b.tone}>{b.typeLabel}</Badge>
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <p className="text-[13.5px] font-semibold text-ink tracking-tight truncate">
                  {b.title}
                </p>
                <p className="text-[11.5px] text-muted truncate mt-0.5">
                  {b.meta}
                </p>
                <div className="mt-3 pt-3 border-t border-line">
                  <div className="flex items-center justify-between text-[10.5px] text-muted mb-1.5">
                    <span>{b.status}</span>
                    <span className="tabular-nums">{b.percent}%</span>
                  </div>
                  <Progress value={b.percent} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
