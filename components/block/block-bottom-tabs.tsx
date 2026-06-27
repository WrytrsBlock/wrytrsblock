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
      <div className="page-fluid flex items-stretch gap-1 overflow-x-auto py-2">
        {tabs.map((t) => {
          const on = t.id === active;
          const Icon = t.icon;
          return (
            <Link
              key={t.id}
              href={`/blocks/${slug}?tab=${t.id}`}
              aria-current={on ? "page" : undefined}
              className={cn(
                "inline-flex min-w-[60px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[10.5px] font-medium transition-colors",
                on
                  ? "bg-surface-2 text-ink"
                  : "text-muted hover:bg-surface-2/50 hover:text-ink"
              )}
            >
              <Icon
                size={18}
                strokeWidth={on ? 2.1 : 1.8}
                className={on ? "text-accent" : ""}
              />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
