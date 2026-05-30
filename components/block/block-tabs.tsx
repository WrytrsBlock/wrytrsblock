"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import type { BlockType } from "@/lib/mock";
import { tabsForType, type BlockTabId } from "./block-tabs.config";

export type { BlockTabId } from "./block-tabs.config";

export function BlockTabs({
  active,
  blockType,
}: {
  active: BlockTabId;
  blockType: BlockType;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const tabs = tabsForType(blockType);

  function hrefFor(id: string) {
    const next = new URLSearchParams(params?.toString());
    if (id === "overview") next.delete("tab");
    else next.set("tab", id);
    // Preserve the type hint for demo-synthesized Blocks.
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="sticky top-0 z-20 glass-strong border-b border-line">
      <div className="px-6 flex items-center gap-0 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <Link
              key={t.id}
              href={hrefFor(t.id)}
              scroll={false}
              className={cn(
                "relative flex items-center gap-1.5 px-3 h-11 text-[12px] transition-colors duration-200 whitespace-nowrap font-medium",
                isActive ? "text-ink" : "text-muted hover:text-ink"
              )}
            >
              <Icon size={13} strokeWidth={1.75} />
              {t.label}
              {isActive && (
                <span className="absolute left-3 right-3 -bottom-px h-px bg-ink" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
