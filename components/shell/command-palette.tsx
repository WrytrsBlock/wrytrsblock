"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CircleDot,
  CornerDownLeft,
  LayoutGrid,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  Store,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Kbd } from "@/components/ui/primitives";
import { onUIEvent, openNewBlock } from "@/lib/ui-events";
import type { Block } from "@/lib/mock";

type Item = {
  id: string;
  label: string;
  sub?: string;
  icon: LucideIcon;
  href?: string;
  action?: () => void;
  group: "Navigate" | "Blocks" | "Actions";
  keywords?: string;
};

export function CommandPalette({ blocks }: { blocks: Block[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Open from anywhere (e.g. the topbar search button).
  useEffect(() => onUIEvent("wb:open-command", () => setOpen(true)), []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // focus after paint
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const nav: Item[] = [
      { id: "marketplace", label: "Block Market", icon: Store, href: "/marketplace", group: "Navigate" },
      { id: "blocks", label: "My Blocks", icon: LayoutGrid, href: "/blocks", group: "Navigate" },
      { id: "messages", label: "Messages", icon: MessageSquare, href: "/messages", group: "Navigate" },
      { id: "notifications", label: "Notifications", icon: Bell, href: "/notifications", group: "Navigate" },
      { id: "settings", label: "Settings", icon: Settings, href: "/settings", group: "Navigate" },
    ];
    const blockItems: Item[] = blocks.map((b) => ({
      id: `block-${b.slug}`,
      label: b.title,
      sub: `${b.blockType === "service" ? "Service" : "Collaboration"} · ${b.kind}`,
      icon: CircleDot,
      href: `/blocks/${b.slug}`,
      group: "Blocks",
      keywords: b.tags.join(" "),
    }));
    const actions: Item[] = [
      { id: "new-block", label: "Create new Block", icon: Plus, action: () => openNewBlock(), group: "Actions" },
      { id: "ask-wizee", label: "Ask WiZee AI", sub: "Your creative AI", icon: Sparkles, action: () => {}, group: "Actions" },
    ];
    return [...nav, ...blockItems, ...actions];
  }, [blocks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      `${it.label} ${it.sub ?? ""} ${it.keywords ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const order: Item["group"][] = ["Blocks", "Navigate", "Actions"];
    return order
      .map((g) => ({ group: g, items: filtered.filter((i) => i.group === g) }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  // Flat list for keyboard navigation, matching render order.
  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  function run(item: Item) {
    setOpen(false);
    if (item.href) router.push(item.href);
    item.action?.();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[active];
      if (item) run(item);
    }
  }

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[14vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg/70 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-[600px] rounded-2xl border border-line-strong bg-surface shadow-pop overflow-hidden animate-fade-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 h-12 border-b border-line">
          <Search size={16} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search creators, blocks, services, skills, genres…"
            className="flex-1 h-12 bg-transparent text-[14px] text-ink placeholder:text-muted/70 focus:outline-none py-4"
          />
          <Kbd>esc</Kbd>
        </div>

        {/* Results */}
        <div className="max-h-[52vh] overflow-y-auto py-2">
          {grouped.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-[13px] text-muted">No results for “{query}”</p>
            </div>
          )}
          {grouped.map((g) => (
            <div key={g.group} className="px-2 py-1">
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-[0.16em] font-medium text-muted/70">
                {g.group}
              </div>
              <ul>
                {g.items.map((it) => {
                  flatIndex += 1;
                  const idx = flatIndex;
                  const isActive = idx === active;
                  const Icon = it.icon;
                  return (
                    <li key={it.id}>
                      <button
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => run(it)}
                        className={cn(
                          "w-full flex items-center gap-3 px-2.5 h-9 rounded-lg text-left transition-colors",
                          isActive
                            ? "bg-surface-2 text-ink"
                            : "text-muted hover:text-ink"
                        )}
                      >
                        <Icon
                          size={14}
                          className={isActive ? "text-accent" : "text-muted"}
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13px] truncate text-ink">
                            {it.label}
                          </span>
                          {it.sub && (
                            <span className="block text-[10.5px] text-muted truncate">
                              {it.sub}
                            </span>
                          )}
                        </span>
                        {isActive && (
                          <CornerDownLeft size={12} className="text-muted" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 h-9 border-t border-line text-[10.5px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↵</Kbd> select
          </span>
          <div className="flex-1" />
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={10} className="text-accent" /> Ask WiZee{" "}
            <Kbd>⌘J</Kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
