"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

// Profile/Blocks segmented toggle — the prototype's profile structure. Slots
// are server-rendered and passed in; this only owns the active-tab state.
export function ProfileTabs({
  profileSlot,
  blocksSlot,
  blocksCount,
}: {
  profileSlot: React.ReactNode;
  blocksSlot: React.ReactNode;
  blocksCount: number;
}) {
  const [tab, setTab] = useState<"profile" | "blocks">("profile");

  const tabs: { id: "profile" | "blocks"; label: string; count?: number }[] = [
    { id: "profile", label: "Profile" },
    { id: "blocks", label: "Blocks", count: blocksCount },
  ];

  return (
    <div>
      {/* Segmented control */}
      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface-2 border border-line">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-200",
                active
                  ? "bg-bg text-ink shadow-soft"
                  : "text-muted hover:text-ink"
              )}
            >
              {t.label}
              {typeof t.count === "number" && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-semibold tabular-nums",
                    active
                      ? "bg-accent/15 text-accent"
                      : "bg-surface-3 text-muted"
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div className="mt-5">
        <div className={cn(tab === "profile" ? "block" : "hidden")}>
          {profileSlot}
        </div>
        <div className={cn(tab === "blocks" ? "block" : "hidden")}>
          {blocksSlot}
        </div>
      </div>
    </div>
  );
}
