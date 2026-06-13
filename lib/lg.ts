import type { Block } from "@/lib/mock";

// Shared mappings for the liquid-glass screens (home + my blocks): block-type
// icon-tile gradients, status pills, and the colored-initial avatar palette —
// all lifted from the mockup.

export function lgTileGradient(b: Pick<Block, "blockType">): string {
  if (b.blockType === "service")
    return "linear-gradient(150deg,#1D9E75,#0B5C45)";
  if (b.blockType === "block_party")
    return "linear-gradient(150deg,#C4582F,#7E3318)";
  return "linear-gradient(150deg,#5A4ACF,#352B85)";
}

export function lgStatus(b: Block): { cls: string; label: string } {
  if (b.blockType === "block_party") {
    const s = b.party?.status ?? "upcoming";
    if (s === "live") return { cls: "lg-pill-g", label: "Live" };
    if (s === "ended") return { cls: "lg-pill-w", label: "Ended" };
    return { cls: "lg-pill-b", label: "Upcoming" };
  }
  switch (b.completion.status) {
    case "active":
      return { cls: "lg-pill-g", label: "Active" };
    case "in_review":
      return { cls: "lg-pill-y", label: "In review" };
    case "completed":
      return { cls: "lg-pill-w", label: "Completed" };
    default:
      return { cls: "lg-pill-b", label: "Open" };
  }
}

export function lgProgress(b: Block): number {
  return b.completion?.percent ?? b.progress ?? 0;
}

const AV_COLORS = ["#3B66F6", "#D85A30", "#7F77DD", "#D4537E", "#1D9E75"];

export function lgAvColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}
