import { notFound } from "next/navigation";
import { BlockHeader } from "@/components/block/block-header";
import { BlockViewerHeartbeat } from "@/components/block/block-viewer-heartbeat";
import { BlockBottomTabs } from "@/components/block/block-bottom-tabs";
import {
  tabsForType,
  defaultTabForType,
  type BlockTabId,
} from "@/components/block/block-tabs.config";
import { OverviewPanel } from "@/components/block/overview-panel";
import { PartyOverviewPanel } from "@/components/block/party-overview-panel";
import { ServiceDetailsPanel } from "@/components/block/service-details-panel";
import { RequestsPanel } from "@/components/block/requests-panel";
import { SplitSheetPanel } from "@/components/block/split-sheet-panel";
import { MediaPanel } from "@/components/block/media-panel";
import { ThreadsPanel } from "@/components/block/threads-panel";
import { TeamPanel } from "@/components/block/team-panel";
import { SettingsPanel } from "@/components/block/settings-panel";
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
  members: BlockMemberView[],
  isOwner: boolean
) {
  switch (tab) {
    case "team":
      return (
        <TeamPanel block={block} members={members} isOwner={isOwner} />
      );
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
    case "requests":
      return <RequestsPanel block={block} />;
    case "settings":
      return <SettingsPanel block={block} isOwner={isOwner} />;
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

  // The lead/creator is the owner — only they may delete the Block.
  const isOwner = myMembership?.isOwner ?? false;

  const validTabs: string[] = tabsForType(block.blockType).map((t) => t.id);
  const tab: BlockTabId = validTabs.includes(searchParams.tab ?? "")
    ? (searchParams.tab as BlockTabId)
    : defaultTabForType(block.blockType);

  // Messages owns its own scroll; every other tab scrolls the content area.
  const fullHeight = tab === "messages";

  return (
    // The whole Block is wrapped in a single contained, softly-lit frame on
    // desktop so it reads as "you're inside a Block." A 1px blue→violet gradient
    // edge with a low outer glow (kept deliberately subtle, not neon). Mobile
    // stays full-bleed.
    <div className="flex-1 min-h-0 flex flex-col lg:m-4 lg:rounded-[28px] lg:p-px lg:bg-gradient-to-br lg:from-indigo-400/25 lg:via-fuchsia-500/15 lg:to-sky-400/20 lg:shadow-[0_22px_70px_-34px_rgba(99,102,241,0.45)]">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-bg lg:rounded-[27px]">
        {/* No global search bar inside a Block — you're already collaborating.
            The Block opens straight on its header (title + creators) and chat. */}
        <BlockViewerHeartbeat blockId={block.id} />
        <BlockHeader block={block} members={members} />
        {/* The open chat (or selected section) is the main content; navigation
            lives in the bottom tab bar. */}
        <div
          className={cn(
            "flex-1 min-h-0",
            fullHeight ? "overflow-hidden" : "overflow-y-auto"
          )}
        >
          {renderPanel(tab, block, members, isOwner)}
        </div>
        <BlockBottomTabs
          slug={block.slug}
          blockType={block.blockType}
          active={tab}
        />
      </div>
    </div>
  );
}
