"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// Segmented tab control for the Blocks dashboard — Requests / Active / Completed.
// The tab panels are server-rendered nodes passed in as props (RSC); only the
// active-tab selection lives on the client.
export function BlocksTabs({
  tabs,
  initial,
}: {
  tabs: { id: string; label: string; count: number; node: ReactNode }[];
  initial: string;
}) {
  const [active, setActive] = useState(
    tabs.some((t) => t.id === initial) ? initial : tabs[0]?.id
  );
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div
        role="tablist"
        className="mb-5 grid grid-cols-3 gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1"
      >
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.id)}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium transition-colors",
                on
                  ? "bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.1)]"
                  : "text-white/55 hover:text-white"
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={cn(
                    "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-semibold tabular-nums",
                    on ? "bg-white/15 text-white" : "bg-white/[0.08] text-white/60"
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{current?.node}</div>
    </div>
  );
}
