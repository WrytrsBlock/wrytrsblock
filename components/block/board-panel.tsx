import { Filter, Plus, Sliders } from "lucide-react";
import { Button, SectionLabel } from "@/components/ui/primitives";
import { BoardCanvas } from "./board-canvas";
import type { Block } from "@/lib/mock";

export function BoardPanel({ block }: { block: Block }) {
  const totalCards = block.board.reduce((n, c) => n + c.cards.length, 0);

  return (
    <div className="px-8 py-7 space-y-5 animate-fade-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionLabel>Production</SectionLabel>
          <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
            Board
          </h2>
          <p className="text-[12.5px] text-muted mt-1">
            {totalCards} tasks across {block.board.length} columns · grouped by
            phase
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md">
            <Sliders size={12} /> Group: Phase
          </Button>
          <Button variant="outline" size="md">
            <Filter size={12} /> Filters
          </Button>
          <Button variant="primary" size="md">
            <Plus size={12} /> New task
          </Button>
        </div>
      </div>

      <BoardCanvas columns={block.board} blockSlug={block.slug} />
    </div>
  );
}
