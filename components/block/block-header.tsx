import { Badge } from "@/components/ui/primitives";
import { BlockHeaderActions } from "./block-header-actions";
import type { Block } from "@/lib/mock";

// Clean, calm Block header. One type badge, the title, a short description, and
// the primary actions top-right. No cover, no status clutter, no progress box.
export function BlockHeader({ block }: { block: Block }) {
  const isService = block.blockType === "service";
  const isParty = block.blockType === "block_party";

  const typeLabel = isParty
    ? "Block Party"
    : isService
    ? "Service Block"
    : "Collaboration Block";
  const typeTone = isParty ? "warning" : isService ? "accent-2" : "accent";

  return (
    <div className="shrink-0 border-b border-line bg-bg/60 px-5 md:px-8 py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between max-w-[1100px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={typeTone}>{typeLabel}</Badge>
            {isParty && block.party && (
              <Badge tone="soft">{block.party.category}</Badge>
            )}
            {!isService && !isParty && block.category && (
              <Badge tone="soft">{block.category}</Badge>
            )}
            {block.price ? (
              <Badge tone="accent">
                ${block.price} · {isParty ? "entry" : "one-time"}
              </Badge>
            ) : (
              <Badge tone="soft">Free{isParty ? " entry" : ""}</Badge>
            )}
            {block.visibility && block.visibility !== "Public" && (
              <Badge tone="soft">{block.visibility}</Badge>
            )}
          </div>
          <h1 className="mt-2.5 font-display text-3xl md:text-[34px] leading-tight text-ink tracking-tight">
            {block.title}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted max-w-2xl leading-relaxed">
            {block.tagline}
          </p>
        </div>

        <div className="md:pt-1 md:shrink-0">
          <BlockHeaderActions slug={block.slug} blockType={block.blockType} />
        </div>
      </div>
    </div>
  );
}
