import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { TeamRoster } from "./team-roster";
import { tabsForType } from "./block-tabs.config";
import { getPerson, type Block } from "@/lib/mock";

// You're inside the Block. Everything happens here. The Overview is a single
// contained surface — no stacked partition cards. A row of plain icons launches
// each task (Files, Tasks, Split Sheet, Messages, Team); below them, who's
// involved. The journey lives as a percent up in the header.
export function OverviewPanel({ block }: { block: Block }) {
  const lead = getPerson(block.leadId);

  // The launcher IS the Block's navigation — there's no top tab strip anymore.
  // It mirrors the Block's tabs (everything except Overview itself, which is
  // this page), so every task — Files, Tasks, Splits, Messages, Team, Settings —
  // opens straight from here.
  const launch = tabsForType(block.blockType).filter(
    (t) => t.id !== "overview"
  );

  const hintFor = (id: string): number | undefined => {
    if (id === "files") return block.files.length;
    if (id === "messages") return block.threads.length;
    if (id === "team") return block.team.length;
    return undefined;
  };

  return (
    <div className="page-fluid py-6 md:py-8 animate-fade-up">
      <div className="lg-glass p-6 md:p-8 space-y-8">
        {/* Launcher — just icons; each opens its task */}
        <div>
          <p className="mb-5 text-[11px] uppercase tracking-[0.14em] text-white/45">
            Inside this Block
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-5 sm:gap-x-8">
            {launch.map((j) => {
              const Icon = j.icon;
              const hint = hintFor(j.id);
              return (
                <Link
                  key={j.id}
                  href={`/blocks/${block.slug}?tab=${j.id}`}
                  className="group flex w-[60px] flex-col items-center gap-2 text-center"
                >
                  <span className="relative inline-flex h-[58px] w-[58px] items-center justify-center rounded-2xl border border-white/[0.14] bg-white/[0.06] text-white/80 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[rgba(140,170,255,0.5)] group-hover:bg-[rgba(59,102,246,0.28)] group-hover:text-white">
                    <Icon size={22} strokeWidth={1.8} />
                    {hint !== undefined && hint > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-white/20 bg-[#07080d] px-1 text-[10px] font-semibold tabular-nums text-white/85">
                        {hint}
                      </span>
                    )}
                  </span>
                  <span className="text-[11.5px] leading-tight text-white/65 transition-colors group-hover:text-white">
                    {j.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Who's involved — same surface, just a divider */}
        <div className="border-t border-white/[0.08] pt-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
              Who&rsquo;s involved
            </p>
            {lead && (
              <span className="text-[11px] text-white/50">
                Lead · <span className="text-white/80">{lead.name}</span>
              </span>
            )}
          </div>

          {block.seeking && block.seeking.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-white/50">Looking for</span>
              {block.seeking.map((s) => (
                <Badge key={s} tone="soft">
                  {s}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-4">
            <TeamRoster ids={block.team} blockSlug={block.slug} />
          </div>
        </div>
      </div>
    </div>
  );
}
