"use client";

import { useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Users, X } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import type { CreatorRef } from "@/lib/network";

// Mutual Creators — the creative-network equivalent of mutual connections.
// Shows how much of two creators' collaboration circles overlap, so you can
// gauge trust before starting a Block together. Identities only: never which
// Blocks they share. Renders nothing when there's no overlap (no empty state).
export function MutualCreators({ mutual }: { mutual: CreatorRef[] }) {
  const [open, setOpen] = useState(false);
  if (mutual.length === 0) return null;

  const shown = mutual.slice(0, 5);
  const extra = mutual.length - shown.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg-glass group inline-flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.12]"
      >
        <div className="flex -space-x-2">
          {shown.map((c) => (
            <Avatar
              key={c.id}
              src={c.avatar}
              name={c.name}
              size={26}
              ring
            />
          ))}
          {extra > 0 && (
            <span
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-[#1b1d24] text-[9px] font-semibold text-white/80 ring-2 ring-[#0b0c11]"
              style={{ width: 26, height: 26 }}
            >
              +{extra}
            </span>
          )}
        </div>
        <span className="text-[12.5px] font-semibold text-white">
          {mutual.length} Mutual Creator{mutual.length === 1 ? "" : "s"}
        </span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-up"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Mutual creators"
          >
            <div
              className="lg-glass w-full max-w-md overflow-hidden"
              style={{ background: "rgba(18,20,26,0.9)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 border-b border-white/[0.12] px-5 py-3.5">
                <Users size={16} className="text-[#A9BEFF]" />
                <h3 className="flex-1 text-[14px] font-semibold text-white">
                  {mutual.length} Mutual Creator{mutual.length === 1 ? "" : "s"}
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <ul className="max-h-[60vh] divide-y divide-white/[0.07] overflow-y-auto">
                {mutual.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/profile/${c.handle}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.06]"
                    >
                      <Avatar src={c.avatar} name={c.name} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-white">
                          {c.name}
                        </p>
                        <p className="truncate text-[11.5px] text-white/55">
                          {c.role} · @{c.handle}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
