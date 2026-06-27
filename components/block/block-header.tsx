import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { BlockCollaborators } from "./block-collaborators";
import type { Block } from "@/lib/mock";
import type { BlockMemberView } from "@/lib/data";

// The Block's identity bar — title, tagline, and the collaborators who are in it
// (cards side by side with a "+"). Navigation now lives in the bottom tab bar,
// and the Block opens on the chat, so this stays compact.
export function BlockHeader({
  block,
  members,
}: {
  block: Block;
  members: BlockMemberView[];
}) {
  const isService = block.blockType === "service";
  const isParty = block.blockType === "block_party";

  const typeLabel = isParty
    ? "Block Party"
    : isService
      ? "Service Block"
      : "Collaboration Block";
  const typeTone = isParty ? "warning" : isService ? "accent-2" : "accent";

  return (
    <div
      className="shrink-0 border-b border-white/[0.08] page-fluid pb-5"
      // Top safe-area + spacing — the global search bar that used to sit above
      // the Block is removed, so the header is now the topmost element and must
      // clear the status bar / notch on mobile.
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)" }}
    >
      {/* Mobile-only exit: the global app dock is hidden inside a Block, so this
          is how phone users back out to My Blocks. Desktop uses the sidebar. */}
      <Link
        href="/blocks"
        className="lg:hidden mb-3 -ml-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-muted transition-colors hover:text-ink"
      >
        <ChevronLeft size={15} /> Blocks
      </Link>

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

      <h1 className="mt-2.5 font-display text-3xl leading-tight tracking-tight text-ink md:text-[34px]">
        {block.title}
      </h1>
      {block.tagline && (
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-muted">
          {block.tagline}
        </p>
      )}

      <BlockCollaborators members={members} />
    </div>
  );
}
