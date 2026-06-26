"use client";

import { usePathname } from "next/navigation";

// Per-screen ambient radial-gradient backdrop (liquid glass mockup). Longest
// prefix wins; everything else falls back to the home wash.
const AMBIENTS: [prefix: string, cls: string][] = [
  ["/marketplace", "lg-amb-market"],
  ["/blocks", "lg-amb-blocks"],
  ["/profile", "lg-amb-profile"],
  ["/home", "lg-amb-home"],
];

export function Ambient() {
  const path = usePathname() ?? "";
  const cls =
    AMBIENTS.find(([prefix]) => path.startsWith(prefix))?.[1] ?? "lg-amb-home";
  // First child of the relative shell — paints under <main>, which follows it
  // in document order. (A negative z-index would hide it behind the shell's
  // opaque canvas background.)
  return (
    <div aria-hidden className={`absolute inset-0 pointer-events-none ${cls}`} />
  );
}
