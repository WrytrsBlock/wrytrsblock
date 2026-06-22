import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Avatar, Badge, Card, SectionLabel } from "@/components/ui/primitives";
import { TeamManager } from "./team-manager";
import { getPerson, type Block } from "@/lib/mock";
import type { BlockMemberView } from "@/lib/data";

export function TeamPanel({
  block,
  members,
  isOwner = false,
}: {
  block: Block;
  // Real block_members from Supabase. Falls back to the mock roster in demo mode.
  members?: BlockMemberView[];
  isOwner?: boolean;
}) {
  const roster = members ?? [];
  const leadMember = roster.find((m) => m.isLead) ?? null;
  const lead = getPerson(block.leadId);

  return (
    <div className="page-fluid py-7 space-y-5 animate-fade-up">
      <div>
        <SectionLabel>Collaborators</SectionLabel>
        <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
          Team
        </h2>
        <p className="text-[12.5px] text-muted mt-1">
          Everyone building this Block — invite collaborators, manage roles, and
          review pending invitations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <TeamManager slug={block.slug} members={roster} isOwner={isOwner} />
        </div>

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
