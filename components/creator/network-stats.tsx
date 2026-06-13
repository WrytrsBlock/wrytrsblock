import { CheckCircle2, TrendingUp, Users } from "lucide-react";
import type { CreatorNetwork } from "@/lib/network";

// Collaboration-first trust signals, shown prominently so a creator can size up
// reputation at a glance: who they've worked with, what they've finished, and
// how reliably they carry Blocks to completion. Replaces the abstract score.
export function NetworkStats({ network }: { network: CreatorNetwork }) {
  const stats = [
    {
      icon: Users,
      value: network.creatorsConnected.length.toString(),
      label: "Creators Connected",
    },
    {
      icon: CheckCircle2,
      value: network.completedBlocks.toString(),
      label: "Completed Blocks",
    },
    {
      icon: TrendingUp,
      value: `${network.completionRate}%`,
      label: "Completion Rate",
    },
  ];

  return (
    <div className="lg-glass inline-flex flex-wrap items-stretch divide-x divide-white/[0.1] overflow-hidden">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-3 px-5 py-3.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.06] text-[#A9BEFF]">
              <Icon size={16} strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-[19px] font-semibold leading-none text-white tabular-nums">
                {s.value}
              </p>
              <p className="mt-1 text-[11px] leading-none text-white/55">
                {s.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
