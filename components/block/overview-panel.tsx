import Link from "next/link";
import {
  ArrowUpRight,
  Folder,
  ListChecks,
  MessagesSquare,
  PieChart,
} from "lucide-react";
import { Badge, Card, SectionLabel } from "@/components/ui/primitives";
import { TeamRoster } from "./team-roster";
import { getPerson, type Block } from "@/lib/mock";

// Clean, calm Overview. Answers: who's involved, and where everything lives.
// (What the project is + how to invite are answered by the always-visible header.)
export function OverviewPanel({ block }: { block: Block }) {
  const lead = getPerson(block.leadId);

  const jump = [
    { label: "Files", icon: Folder, href: `/blocks/${block.slug}?tab=files`, hint: `${block.files.length} items` },
    { label: "Split Sheet", icon: PieChart, href: `/blocks/${block.slug}?tab=splits`, hint: block.splits ? block.splits.status : "not started" },
    { label: "Messages", icon: MessagesSquare, href: `/blocks/${block.slug}?tab=messages`, hint: `${block.threads.length} threads` },
    { label: "Tasks", icon: ListChecks, href: `/blocks/${block.slug}?tab=tasks`, hint: "board" },
  ];

  return (
    <div className="px-6 md:px-8 py-8 max-w-[900px] space-y-6 animate-fade-up">
      {/* Who's involved */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <SectionLabel>Who's involved</SectionLabel>
          {lead && (
            <span className="text-[11px] text-muted">
              Lead · <span className="text-ink">{lead.name}</span>
            </span>
          )}
        </div>

        {block.seeking && block.seeking.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted">Looking for</span>
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
      </Card>

      {/* Jump to */}
      <section>
        <SectionLabel>Jump to</SectionLabel>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  <p className="text-[10.5px] text-muted mt-0.5 capitalize">
                    {j.hint}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
