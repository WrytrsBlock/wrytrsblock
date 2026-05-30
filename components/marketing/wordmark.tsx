import Link from "next/link";
import { cn } from "@/lib/cn";

export function Wordmark({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative h-7 w-7 rounded-md bg-grad-accent flex items-center justify-center shadow-glow">
        <span className="font-display text-bg text-lg leading-none translate-y-[1px]">
          W
        </span>
      </span>
      <span className="font-display text-xl text-ink tracking-tight">
        wrytrsblock
      </span>
    </Link>
  );
}
