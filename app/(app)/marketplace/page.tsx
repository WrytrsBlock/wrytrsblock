import { TopBar } from "@/components/shell/topbar";
import { SectionLabel } from "@/components/ui/primitives";
import { CreatorMarketplace } from "@/components/marketplace/creator-marketplace";
import { getCreators } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  // Real creators from Supabase (or the local dev seed when unconfigured).
  const creators = await getCreators();
  // Spotlight the highest-scored creator; the rest fill the discovery grid.
  const ranked = [...creators].sort(
    (a, b) => b.profile.blockScore - a.profile.blockScore
  );
  const featured = ranked[0];
  const rest = ranked.slice(1);

  return (
    <>
      <TopBar
        crumbs={[{ label: "The CR8TV Collectv" }, { label: "Block Market" }]}
      />
      <div className="flex-1 overflow-y-auto relative">
        {/* Ambient royal-blue fade behind the header */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-grad-fade-b opacity-40"
        />
        <div className="relative px-5 md:px-8 py-6 md:py-7 max-w-[1280px] w-full animate-fade-up space-y-5">
          {/* Compact header — discovery is the focus, not the masthead */}
          <div>
            <SectionLabel>The CR8TV Collectv</SectionLabel>
            <h1 className="mt-1.5 font-display text-3xl md:text-4xl text-ink tracking-tight leading-[1.03]">
              Find a creator.
            </h1>
            <p className="mt-1 text-[13px] md:text-[14px] text-muted">
              Search, filter, and start a Block in seconds.
            </p>
          </div>

          {/* Discovery — search, filters, spotlight, and the creator grid */}
          <CreatorMarketplace creators={rest} featured={featured} />
        </div>
      </div>
    </>
  );
}
