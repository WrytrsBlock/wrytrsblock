import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { BlockHeaderActions } from "./block-header-actions";
import { BlockProgress } from "./block-journey";
import { tabsForType, type BlockTabId } from "./block-tabs.config";
import type { Block } from "@/lib/mock";

// The Block's identity bar — persists across every view so you always know which
// Block you're inside. Navigation lives inside the Block (the Overview's icon
// launcher), so the only way back from a task is right here: the title returns
// to the Block home, and a back link appears whenever you're inside a task.
export function BlockHeader({
  block,
  tab = "overview",
}: {
  block: Block;
  tab?: BlockTabId;
}) {
  const isService = block.blockType === "service";
  const isParty = block.blockType === "block_party";

  const typeLabel = isParty
    ? "Block Party"
    : isService
    ? "Service Block"
    : "Collaboration Block";
  const typeTone = isParty ? "warning" : isService ? "accent-2" : "accent";

  const inTask = tab !== "overview";
  const sectionLabel = tabsForType(block.blockType).find(
    (t) => t.id === tab
  )?.label;

  return (
    <div className="shrink-0 border-b border-white/[0.08] page-fluid py-5">
      {/* Back to the Block home — shown only when you're inside a task */}
      {inTask && (
        <Link
          href={`/blocks/${block.slug}`}
          className="mb-3 inline-flex items-center gap-1 text-[12px] text-white/55 transition-colors hover:text-white"
        >
          <ChevronLeft size={14} /> Block{sectionLabel ? ` · ${sectionLabel}` : ""}
        </Link>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={typeTone}>{typeLabel}</Badge>
            {!isService && !isParty && block.category && (
              <Badge tone="soft">{block.category}</Badge>
            )}
            {block.price ? (
              <Badge tone="accent">
                ${block.price} · {isParty ? "entry" : "one-time"}
              </Badge>
            ) : null}
          </div>
          {/* Title returns to the Block home (where the launcher lives) */}
          <Link href={`/blocks/${block.slug}`} className="block">
            <h1 className="mt-2.5 font-display text-3xl md:text-[34px] leading-tight text-ink tracking-tight transition-colors hover:text-white">
              {block.title}
            </h1>
          </Link>
          <p className="mt-1.5 text-[13.5px] text-muted max-w-2xl leading-relaxed">
            {block.tagline}
          </p>
          {/* Journey, distilled to a percent — inline, never its own section */}
          <BlockProgress block={block} className="mt-3.5" />
        </div>

        <div className="md:pt-1 md:shrink-0">
          <BlockHeaderActions slug={block.slug} blockType={block.blockType} />
        </div>
      </div>
    </div>
  );
}
