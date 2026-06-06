import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Avatar, Badge, Card, SectionLabel } from "@/components/ui/primitives";
import { TeamRoster } from "./team-roster";
import { InviteButton } from "./invite-button";
import { getPerson, type Block } from "@/lib/mock";
import type { BlockMemberView } from "@/lib/data";

export function TeamPanel({
  block,
  members,
}: {
  block: Block;
  // Real block_members from Supabase. Falls back to the mock roster in demo mode.
  members?: BlockMemberView[];
}) {
  const real = members && members.length > 0 ? members : null;
  const leadMember = real?.find((m) => m.isLead) ?? null;
  const lead = getPerson(block.leadId);
  const count = real ? real.length : block.team.length;

  return (
    <div className="px-8 py-7 space-y-5 max-w-[1000px] animate-fade-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionLabel>Collaborators</SectionLabel>
          <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
            Team
          </h2>
          <p className="text-[12.5px] text-muted mt-1">
            Everyone building this Block. Invite more from the Marketplace or by
            handle.
          </p>
        </div>
        <InviteButton blockSlug={block.slug} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 p-6">
          <SectionLabel>On this Block · {count}</SectionLabel>
          <div className="mt-4">
            {real ? (
              <ul className="space-y-2">
                {real.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 px-3 py-2.5"
                  >
                    <Avatar src={m.avatar} name={m.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink truncate">
                        {m.name}
                      </p>
                      <p className="text-[11px] text-muted truncate">
                        @{m.handle}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {m.isLead ? (
                        <Badge tone="accent">Lead</Badge>
                      ) : (
                        <Badge tone="soft" className="capitalize">
                          {m.role}
                        </Badge>
                      )}
                      {m.status === "invited" && (
                        <Badge tone="warning">Pending</Badge>
                      )}
                      {m.status === "declined" && (
                        <Badge tone="soft">Declined</Badge>
                      )}
                      <Link
                        href={`/profile/${m.handle}`}
                        aria-label={`View ${m.name}`}
                        className="text-muted hover:text-ink transition-colors"
                      >
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <TeamRoster ids={block.team} blockSlug={block.slug} />
            )}
          </div>
        </Card>

        <div className="space-y-3">
          {(leadMember || lead) && (
            <Card className="p-5">
              <SectionLabel>Lead</SectionLabel>
              <div className="mt-3 flex items-center gap-3">
                <Avatar
                  src={leadMember?.avatar ?? lead?.avatar}
                  name={leadMember?.name ?? lead?.name ?? "Lead"}
                  size={40}
                  online={lead?.online}
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink truncate">
                    {leadMember?.name ?? lead?.name}
                  </p>
                  <p className="text-[11px] text-muted truncate">
                    {leadMember ? `@${leadMember.handle}` : lead?.role}
                  </p>
                </div>
              </div>
              <Link
                href={`/profile/${leadMember?.handle ?? lead?.handle}`}
                className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent-2 transition-colors"
              >
                View profile <ArrowUpRight size={11} />
              </Link>
            </Card>
          )}

          {block.seeking && block.seeking.length > 0 && (
            <Card className="p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-grad-mesh opacity-50" />
              <div className="relative">
                <SectionLabel>Still seeking</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {block.seeking.map((s) => (
                    <Badge key={s} tone="accent">
                      {s}
                    </Badge>
                  ))}
                </div>
                <Link
                  href="/marketplace"
                  className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent-2 transition-colors"
                >
                  Find in Marketplace <ArrowUpRight size={11} />
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
