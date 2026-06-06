import Link from "next/link";
import { cn } from "@/lib/cn";

// WrytrsBlock brand lockup (THE CR8TV COLLECTV) from /public/brand.
//
//   variant="horizontal" (default, for app chrome / nav):
//     official symbol  +  WrytrsBlock (primary, dominant)
//                          ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
//                          THE CR8TV COLLECTV (small supporting tagline)
//
//   variant="lockup": the full official vertical logo file (symbol + WRYTRS
//     BLOCK + CR8TV COLLECTV) for spacious surfaces (auth). Shipped black
//     colorway in light, white colorway in dark — both real, never redrawn.
//
//   variant="mark": the official symbol only.
export function Wordmark({
  className,
  href = "/",
  variant = "horizontal",
  width = 124,
}: {
  className?: string;
  href?: string;
  variant?: "horizontal" | "lockup" | "mark";
  width?: number;
}) {
  if (variant === "lockup" || variant === "mark") {
    const isMark = variant === "mark";
    return (
      <Link
        href={href}
        aria-label="WrytrsBlock — The CR8TV Collectv"
        className={cn("inline-flex items-center shrink-0 select-none", className)}
      >
        {isMark ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/brand/wrytrsblock-symbol.svg"
            alt="WrytrsBlock"
            width={32}
            height={32}
            draggable={false}
            className="h-8 w-8 dark:invert"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/wrytrsblock-black.svg"
              alt="WrytrsBlock — The CR8TV Collectv"
              style={{ width }}
              draggable={false}
              className="h-auto block dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/wrytrsblock-white.svg"
              alt=""
              aria-hidden
              style={{ width }}
              draggable={false}
              className="h-auto hidden dark:block"
            />
          </>
        )}
      </Link>
    );
  }

  // Horizontal lockup — WrytrsBlock leads, CR8TV COLLECTV supports beneath.
  return (
    <Link
      href={href}
      aria-label="WrytrsBlock — The CR8TV Collectv"
      className={cn("inline-flex items-center gap-2.5 shrink-0 select-none", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/wrytrsblock-symbol.svg"
        alt=""
        aria-hidden
        width={30}
        height={30}
        draggable={false}
        className="h-[30px] w-[30px] dark:invert"
      />
      <span className="flex flex-col">
        <span className="font-display text-[17px] font-extrabold tracking-tight text-ink leading-[1.05]">
          WrytrsBlock
        </span>
        <span className="text-[7px] font-semibold uppercase tracking-[0.26em] text-muted leading-none mt-[3px]">
          The CR8TV Collectv
        </span>
      </span>
    </Link>
  );
}
