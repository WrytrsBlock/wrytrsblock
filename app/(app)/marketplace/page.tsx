import { TopBar } from "@/components/shell/topbar";
import { SectionLabel } from "@/components/ui/primitives";
import { CreatorMarketplace } from "@/components/marketplace/creator-marketplace";
import { featuredCreators } from "@/lib/mock";

export default function MarketplacePage() {
  const creators = featuredCreators();

  return (
    <>
      <TopBar crumbs={[{ label: "Inkwell Studio" }, { label: "Marketplace" }]} />
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 md:px-8 py-8 max-w-[1280px] w-full animate-fade-up">
          {/* Header */}
          <div className="mb-6">
            <SectionLabel>Discover creative talent</SectionLabel>
            <h1 className="mt-2 font-display text-4xl text-ink tracking-tighter">
              Creator Marketplace
            </h1>
            <p className="text-[13px] text-muted mt-1.5 max-w-xl">
              Find producers, writers, engineers, designers, and more — then
              start a Block to collaborate.
            </p>
          </div>

          <CreatorMarketplace creators={creators} />
        </div>
      </div>
    </>
  );
}
