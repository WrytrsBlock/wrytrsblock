import Link from "next/link";
import { Bookmark, Star } from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import { Avatar } from "@/components/ui/primitives";
import { BlocksHeaderActions } from "@/components/block/blocks-header-actions";
import { BlockPartyCard } from "@/components/block/block-party-card";
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
          {/* Header — Figma My Blocks */}
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

          {/* Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {blocks.map((b, i) => {
              const lead = getPerson(b.leadId);
              const score = creatorProfiles[b.leadId]?.blockScore;
              if (b.blockType === "block_party") {
                return (
                  <div
                    key={b.id}
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <BlockPartyCard block={b} />
                  </div>
                );
              }
              return (
                <article
                  key={b.id}
                  className="group relative flex flex-col rounded-2xl border border-line bg-surface overflow-hidden hover:border-line-strong hover:shadow-elevated transition-all duration-300 animate-fade-up"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  {/* Whole card opens the Block (preserves existing behavior) */}
                  <Link
                    href={`/blocks/${b.slug}`}
                    aria-label={b.title}
                    className="absolute inset-0 z-0"
                  />

                  {/* Cover */}
                  <div className="pointer-events-none relative aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.cover}
                      alt=""
                      className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    {/* Status pill */}
                    <span className="absolute top-2.5 right-2.5 inline-flex items-center h-6 px-2.5 rounded-full bg-warning text-black text-[10px] font-bold uppercase tracking-[0.04em]">
                      {b.status}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="pointer-events-none p-3.5 flex flex-col flex-1">
                    {/* Name row */}
                    <div className="flex items-center gap-2">
                      {lead && (
                        <Avatar
                          src={lead.avatar}
                          name={lead.name}
                          size={22}
                          className="shrink-0"
                        />
                      )}
                      <span className="flex-1 min-w-0 font-display text-[15px] text-ink truncate">
                        {b.title}
                      </span>
                      <Bookmark
                        size={15}
                        className="text-muted shrink-0"
                        aria-hidden
                      />
                    </div>

                    {/* Description */}
                    <p className="mt-1.5 text-[12px] text-muted line-clamp-1">
                      {b.tagline}
                    </p>

                    {/* Footer — score/price + Message */}
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        {typeof score === "number" && (
                          <span className="inline-flex items-center gap-1 text-[12px]">
                            <Star
                              size={12}
                              className="text-warning fill-warning"
                            />
                            <span className="font-semibold text-ink tabular-nums">
                              {score}
                            </span>
                          </span>
                        )}
                        <p className="mt-0.5 text-[13px] text-ink font-semibold">
                          {b.price ? `From $${b.price}` : "Free"}
                        </p>
                      </div>
                      <Link
                        href="/messages"
                        className="pointer-events-auto relative z-10 inline-flex items-center h-8 px-4 rounded-lg bg-grad-accent text-white text-[12px] font-medium shadow-glow hover:opacity-95 transition-opacity"
                      >
                        Message
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
