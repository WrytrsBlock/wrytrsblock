import { CreatorMarketplace } from "@/components/marketplace/creator-marketplace";
import { getCreators } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  // Real creators from Supabase (or the local dev seed when unconfigured),
  // best Block Score first.
  const creators = await getCreators();
  const ranked = [...creators].sort(
    (a, b) => b.profile.blockScore - a.profile.blockScore
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* No global <TopBar/> pill here — the marketplace's own live search IS
          this page's single search experience, styled as the same centered
          glass pill. */}
      <div className="page-fluid pb-16 pt-5 md:pt-7 animate-fade-up">
        <CreatorMarketplace creators={ranked} />
      </div>
    </div>
  );
}
