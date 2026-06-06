import { notFound } from "next/navigation";
import { TopBar } from "@/components/shell/topbar";
import { BlockHeader } from "@/components/block/block-header";
import { BlockTabs } from "@/components/block/block-tabs";
import {
  tabsForType,
  type BlockTabId,
} from "@/components/block/block-tabs.config";
import { OverviewPanel } from "@/components/block/overview-panel";
import { PartyOverviewPanel } from "@/components/block/party-overview-panel";
import { ServiceDetailsPanel } from "@/components/block/service-details-panel";
import { RequestsPanel } from "@/components/block/requests-panel";
import { BoardPanel } from "@/components/block/board-panel";
import { SplitSheetPanel } from "@/components/block/split-sheet-panel";
import { MediaPanel } from "@/components/block/media-panel";
import { ThreadsPanel } from "@/components/block/threads-panel";
import { TeamPanel } from "@/components/block/team-panel";
import { SettingsPanel } from "@/components/block/settings-panel";
import { InvitationBanner } from "@/components/block/invitation-banner";
import { cn } from "@/lib/cn";
import {
  getBlock,
  getBlockMembers,
  getMyBlockMembership,
  type BlockMemberView,
} from "@/lib/data";
import type { Block, BlockType } from "@/lib/mock";

// Block workspaces are per-user and auth-gated — render per request. (A previous
// generateStaticParams here called the Supabase server client at build time,
// which uses cookies() outside a request scope and broke `next build`.)
export const dynamic = "force-dynamic";

function renderPanel(
  tab: BlockTabId,
  block: Block,
  members: BlockMemberView[]
) {
  switch (tab) {
    case "team":
      return <TeamPanel block={block} members={members} />;
    case "files":
      return (
        <MediaPanel
          block={block}
          title="Files"
          subtitle={
            block.blockType === "service"
              ? "Stems in, deliverables out — everything shared with the client."
              : "Stems, cuts, stills, scripts — versioned and shared with the team."
          }
        />
      );
    case "splits":
      return <SplitSheetPanel block={block} />;
    case "messages":
      return <ThreadsPanel block={block} />;
    case "tasks":
      return <BoardPanel block={block} />;
    case "requests":
      return <RequestsPanel block={block} />;
    case "settings":
      return <SettingsPanel block={block} />;
    case "overview":
    default:
      if (block.blockType === "service")
        return <ServiceDetailsPanel block={block} />;
      if (block.blockType === "block_party")
        return <PartyOverviewPanel block={block} />;
      return <OverviewPanel block={block} />;
  }
}

export default async function BlockPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tab?: string; type?: string };
}) {
  const typeHint =
    searchParams.type === "service" ||
    searchParams.type === "collaboration" ||
    searchParams.type === "block_party"
      ? (searchParams.type as BlockType)
      : undefined;

  const block = await getBlock(params.slug, typeHint);
  if (!block) notFound();

  // Real membership roster + the viewer's own invitation status.
  const [members, myMembership] = await Promise.all([
    getBlockMembers(params.slug),
    getMyBlockMembership(params.slug),
  ]);

  const validTabs: string[] = tabsForType(block.blockType).map((t) => t.id);
  const tab: BlockTabId = validTabs.includes(searchParams.tab ?? "")
    ? (searchParams.tab as BlockTabId)
    : "overview";

  // Messages owns its own scroll; every other tab scrolls the content area.
  const fullHeight = tab === "messages";

  return (
    <>
      <TopBar
        crumbs={[
          { label: "The CR8TV Collectv" },
          { label: "Blocks", href: "/blocks" },
          { label: block.title },
        ]}
      />
      <BlockHeader block={block} />
      {myMembership?.status === "invited" && (
        <InvitationBanner slug={block.slug} />
      )}
      <BlockTabs active={tab} blockType={block.blockType} />
      <div
        className={cn(
          "flex-1 min-h-0",
          fullHeight ? "overflow-hidden" : "overflow-y-auto"
        )}
      >
        {renderPanel(tab, block, members)}
      </div>
    </>
  );
}
