"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Workspace } from "@/lib/mock";
import { openNewBlock } from "@/lib/ui-events";

const STORAGE_KEY = "wb-active-workspace";

export function WorkspaceSwitcher({
  workspaces,
}: {
  workspaces: Workspace[];
}) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(workspaces[0]?.id);
  const ref = useRef<HTMLDivElement>(null);

  // Restore last-selected workspace.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && workspaces.some((w) => w.id === stored)) {
        setActiveId(stored);
      }
    } catch {}
  }, [workspaces]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const active =
    workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  function select(id: string) {
    setActiveId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
    setOpen(false);
  }

  if (!active) return null;

  return (
    <div className="relative mx-3 mt-3" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-2 transition-colors duration-200 group"
        type="button"
      >
        <span
          className={cn(
            "h-7 w-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-bg text-[11px] font-semibold shadow-soft",
            active.hue
          )}
        >
          {active.initials}
        </span>
        <span className="flex-1 text-left min-w-0">
          <span className="block text-[12.5px] font-semibold leading-tight truncate">
            {active.name}
          </span>
          <span className="block text-[10.5px] text-muted leading-tight mt-0.5">
            Workspace · 12
          </span>
        </span>
        <ChevronsUpDown
          size={12}
          className="text-muted group-hover:text-ink transition-colors"
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-line-strong bg-surface shadow-pop overflow-hidden animate-fade-up">
          <div className="px-3 pt-2.5 pb-1.5 text-[10px] uppercase tracking-[0.16em] font-medium text-muted/70">
            Workspaces
          </div>
          <ul className="px-1.5 pb-1.5">
            {workspaces.map((w) => {
              const isActive = w.id === active.id;
              return (
                <li key={w.id}>
                  <button
                    onClick={() => select(w.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2 h-9 rounded-lg transition-colors text-left",
                      isActive ? "bg-surface-2" : "hover:bg-surface-2/60"
                    )}
                  >
                    <span
                      className={cn(
                        "h-6 w-6 rounded-md bg-gradient-to-br flex items-center justify-center text-bg text-[10px] font-semibold shrink-0",
                        w.hue
                      )}
                    >
                      {w.initials}
                    </span>
                    <span className="flex-1 text-[12.5px] text-ink truncate">
                      {w.name}
                    </span>
                    {isActive && <Check size={13} className="text-accent" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-line p-1.5 space-y-px">
            <button
              onClick={() => {
                setOpen(false);
                openNewBlock();
              }}
              className="w-full flex items-center gap-2.5 px-2 h-8 rounded-lg text-[12px] text-muted hover:text-ink hover:bg-surface-2/60 transition-colors"
            >
              <Plus size={13} /> New Block
            </button>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-2 h-8 rounded-lg text-[12px] text-muted hover:text-ink hover:bg-surface-2/60 transition-colors"
            >
              <Settings size={13} /> Workspace settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
