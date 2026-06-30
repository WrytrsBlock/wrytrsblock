import Link from "next/link";
import { cn } from "@/lib/cn";
import { tabsForType, type BlockTabId } from "./block-tabs.config";
import type { BlockType } from "@/lib/mock";

// In-Block navigation, moved to the bottom. The Block opens on the chat; every
// other section (Team, Files, Splits, Tasks, Invite, Settings) is one tap away
// here. Replaces the old "Inside this Block" launcher.
export function BlockBottomTabs({
  slug,
  blockType,
  active,
}: {
  slug: string;
  blockType: BlockType;
  active: BlockTabId;
}) {
  const tabs = tabsForType(blockType);
  return (
    <nav
      className="shrink-0 border-t border-white/[0.08] bg-bg/80 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Slim, icon-only navigation — labels removed so the bar reads as a
          compact dock at the foot of the Block. */}
      <div className="page-fluid flex items-stretch gap-1 overflow-x-auto py-1.5">
        {tabs.map((t) => {
          const on = t.id === active;
          const Icon = t.icon;
          return (
            <Link
              key={t.id}
              href={`/blocks/${slug}?tab=${t.id}`}
              aria-current={on ? "page" : undefined}
              aria-label={t.label}
              title={t.label}
              className={cn(
                "inline-flex min-w-[44px] flex-1 items-center justify-center rounded-lg px-2 py-2 transition-colors",
                on
                  ? "bg-surface-2 text-ink"
                  : "text-muted hover:bg-surface-2/50 hover:text-ink"
              )}
            >
              <Icon
                size={20}
                strokeWidth={on ? 2.1 : 1.8}
                className={on ? "text-accent" : ""}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
