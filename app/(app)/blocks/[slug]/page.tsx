import { notFound } from "next/navigation";
import { TopBar } from "@/components/shell/topbar";
import { BlockHeader } from "@/components/block/block-header";
import { BlockTabs } from "@/components/block/block-tabs";
import {
  tabsForType,
  type BlockTabId,
} from "@/components/block/block-tabs.config";
import { OverviewPanel } from "@/components/block/overview-panel";
import { ServiceDetailsPanel } from "@/components/block/service-details-panel";
import { RequestsPanel } from "@/components/block/requests-panel";
import { BoardPanel } from "@/components/block/board-panel";
import { SplitSheetPanel } from "@/components/block/split-sheet-panel";
import { MediaPanel } from "@/components/block/media-panel";
import { ThreadsPanel } from "@/components/block/threads-panel";
import { TeamPanel } from "@/components/block/team-panel";
import { SettingsPanel } from "@/components/block/settings-panel";
import { cn } from "@/lib/cn";
import { getBlock, getBlocks } from "@/lib/data";
import type { Block, BlockType } from "@/lib/mock";

export async function generateStaticParams() {
  const all = await getBlocks();
  return all.map((b) => ({ slug: b.slug }));
}

function renderPanel(tab: BlockTabId, block: Block) {
  switch (tab) {
    case "team":
      return <TeamPanel block={block} />;
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
      return block.blockType === "service" ? (
        <ServiceDetailsPanel block={block} />
      ) : (
        <OverviewPanel block={block} />
      );
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
    searchParams.type === "service" || searchParams.type === "collaboration"
      ? (searchParams.type as BlockType)
      : undefined;

  const block = await getBlock(params.slug, typeHint);
  if (!block) notFound();

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
          { label: "Inkwell Studio" },
          { label: "Blocks", href: "/blocks" },
          { label: block.title },
        ]}
      />
      <BlockHeader block={block} />
      <BlockTabs active={tab} blockType={block.blockType} />
      <div
        className={cn(
          "flex-1 min-h-0",
          fullHeight ? "overflow-hidden" : "overflow-y-auto"
        )}
      >
        {renderPanel(tab, block)}
      </div>
    </>
  );
}
