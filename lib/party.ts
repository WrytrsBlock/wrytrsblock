// Block Party (event) presentation helpers — shared by the event cards (My
// Blocks) and the Block Party detail page so status, timing, the headline count,
// and the call-to-action stay consistent everywhere.

import type { Block, BlockParty, BlockPartyStatus } from "@/lib/mock";

// Human status label for the pill on cards / header.
export function partyStatusLabel(status: BlockPartyStatus): string {
  return status === "live"
    ? "Live"
    : status === "ended"
    ? "Ended"
    : "Upcoming";
}

// Is entry paid? Entry price reuses block.price (null/0 = free).
export function partyIsPaid(block: Block): boolean {
  return (block.price ?? 0) > 0;
}

// State-aware primary CTA. Mirrors the product rules:
//   live      → "Live Now"
//   upcoming  → "Buy Entry" (paid) / "RSVP" (free)
//   ended     → "View Recap"
// Free, non-live events fall back to the generic "Enter Block Party".
export function partyCtaLabel(block: Block): string {
  const status = block.party?.status ?? "upcoming";
  const paid = partyIsPaid(block);
  if (status === "live") return "Live Now";
  if (status === "ended") return "View Recap";
  return paid ? "Buy Entry" : "RSVP";
}

// Compact count, framed by lifecycle: "482 here now" / "213 interested" /
// "1.2k attended".
export function partyCountLabel(party: BlockParty): string {
  const n = formatCompact(party.interested);
  if (party.status === "live") return `${n} here now`;
  if (party.status === "ended") return `${n} attended`;
  return `${n} interested`;
}

// "Jun 10 · 6:00 PM" — graceful when the date is missing/unparseable.
export function formatPartyDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Time TBA";
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

// Entry label for a price chip: "Free" or "$8".
export function partyPriceLabel(block: Block): string {
  return partyIsPaid(block) ? `$${block.price}` : "Free";
}

// 1280 → "1.2k", 482 → "482".
export function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
}
