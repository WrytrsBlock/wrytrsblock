import { TopBar } from "@/components/shell/topbar";
import { BlocksHeaderActions } from "@/components/block/blocks-header-actions";
import { MyBlockCard } from "@/components/block/my-block-card";
import { getBlocks } from "@/lib/data";
import { creatorProfiles, getPerson } from "@/lib/mock";

export default async function BlocksListPage() {
  const blocks = await getBlocks();

  return (
    <>
      <TopBar
        crumbs={[{ label: "The CR8TV Collectv" }, { label: "My Blocks" }]}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 md:px-8 py-6 md:py-8 max-w-[1280px] w-full animate-fade-up">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 md:mb-7">
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-ink tracking-tight">
                My Blocks
              </h1>
              <p className="mt-1.5 text-[13px] text-muted">
                {blocks.length} Block{blocks.length === 1 ? "" : "s"}
              </p>
            </div>
            <BlocksHeaderActions />
          </div>

          {/* Grid — unified premium cards (same language as Block Market) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {blocks.map((b, i) => (
              <MyBlockCard
                key={b.id}
                block={b}
                lead={getPerson(b.leadId) ?? null}
                score={creatorProfiles[b.leadId]?.blockScore}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
