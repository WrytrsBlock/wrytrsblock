"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Camera, Clock, Loader2, Users } from "lucide-react";
import { supabaseConfigured } from "@/lib/env";
import { IMAGE_ACCEPT, uploadToAvatars, validateImageFile } from "@/lib/upload-image";
import { updateBlockCoverAction } from "@/app/actions/blocks";
import { BlockCover } from "@/components/block/block-cover";
import type { Block } from "@/lib/mock";

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

function sentAgo(iso?: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(0, Math.floor(ms / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function memberLabel(b: Block): string {
  const n = b.memberCount ?? b.team?.length ?? 0;
  return n <= 1 ? "Just you" : `${n} Members`;
}

// The "My Blocks → Active" card. This is the ONE actually rendered on the
// page (app/(app)/blocks/page.tsx) — components/block/my-block-card.tsx looks
// similar but was never imported anywhere, so edits there never appeared live.
export function ActiveBlockCard({ block }: { block: Block }) {
  const isPending = block.myStatus === "pending";
  const realBlock = supabaseConfigured && isUuid(block.id);

  const [cover, setCover] = useState(block.cover);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onCoverFile(file: File) {
    if (validateImageFile(file)) return; // no room for an inline error on a card

    if (!realBlock) {
      setCover(URL.createObjectURL(file));
      return;
    }

    setUploading(true);
    try {
      const url = await uploadToAvatars(file, "block-cover");
      if (!url) return;
      const res = await updateBlockCoverAction(block.slug, url);
      if (res.ok) setCover(url);
    } catch (e) {
      console.error("Block cover upload failed:", e);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Link
      href={`/blocks/${block.slug}`}
      className="group block overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-colors hover:border-white/[0.16]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <BlockCover src={cover} type={block.blockType} />
        {/* Halved vs. the old flat black/40 wash so the cover reads through. */}
        <span className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {isPending && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#E8B43A]/40 bg-[#E8B43A]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#F5C95B] backdrop-blur-sm">
            <Clock size={11} /> Pending
          </span>
        )}

        {/* Change cover — right on the card. Nested inside the card's Link, so
            both the button and the file input stop propagation to avoid also
            triggering navigation to the Block. */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            inputRef.current?.click();
          }}
          aria-label="Change cover image"
          className="absolute left-1/2 top-2.5 -translate-x-1/2 inline-flex h-7 items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-2.5 text-[10.5px] font-medium text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
          {uploading ? "Uploading…" : "Change cover"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onCoverFile(f);
            e.target.value = "";
          }}
        />
      </div>
      <div className="flex items-center gap-3 p-3.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-white">
            {block.title}
          </p>
          {isPending ? (
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-[#F5C95B]/80">
              <Clock size={12} /> Request sent {sentAgo(block.pendingSince)}
            </p>
          ) : (
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-white/55">
              <Users size={12} /> {memberLabel(block)}
            </p>
          )}
        </div>
        <ArrowPill />
      </div>
    </Link>
  );
}

function ArrowPill() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grad-accent text-white transition-transform duration-200 group-hover:translate-x-0.5"
      style={{ color: "#FFFFFF" }}
    >
      <ArrowRight size={15} />
    </span>
  );
}
