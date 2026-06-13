import { TopBar } from "@/components/shell/topbar";
import { LgNewBlockButton } from "@/components/ui/lg-button";
import { MyBlockCard } from "@/components/block/my-block-card";
import { getBlocks } from "@/lib/data";
import { creatorProfiles, getPerson } from "@/lib/mock";

export default async function BlocksListPage() {
  const blocks = await getBlocks();

  return (
    <>
      {/* Global search — the page's visual anchor */}
      <TopBar />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="page-fluid pb-16 pt-8 md:pt-10 animate-fade-up">
          {/* Heading — search → My Blocks → grid */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-white tracking-tight">
                My Blocks
              </h1>
              <p className="mt-2 text-[13px] text-white/55">
                {blocks.length} Block{blocks.length === 1 ? "" : "s"}
              </p>
            </div>
            <LgNewBlockButton />
          </div>

          {/* Grid — premium cover cards, consistent heights, room to breathe */}
          {blocks.length === 0 ? (
            <div className="lg-glass mt-8 px-6 py-14 text-center">
              <p className="text-[13.5px] text-white/60">
                No Blocks yet — start one from the Block Market.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-4 md:gap-6">
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
          )}
        </div>
      </div>
    </>
  );
}
