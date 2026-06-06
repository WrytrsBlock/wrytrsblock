import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
import { Wordmark } from "@/components/marketing/wordmark";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-grad-mesh opacity-50" />
      <div className="absolute top-6 left-6">
        <Wordmark variant="horizontal" />
      </div>

      <div className="relative text-center max-w-md">
        <p className="font-display text-7xl text-gradient-accent tracking-tighter">
          404
        </p>
        <h1 className="mt-3 font-display text-3xl text-ink tracking-tight">
          This take didn't make the cut.
        </h1>
        <p className="mt-2 text-[13.5px] text-muted leading-relaxed">
          The page you're after has moved, been archived, or never existed.
          Let's get you back to the Collectv.
        </p>
        <div className="mt-7 flex items-center justify-center gap-2.5">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-ink text-bg text-[13px] font-medium shadow-soft hover:bg-ink/90 transition-colors"
          >
            <Store size={14} /> Explore Block Market
          </Link>
          <Link
            href="/blocks"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-line text-[13px] font-medium hover:bg-surface-2 hover:border-line-strong transition-all"
          >
            <ArrowLeft size={14} /> Browse Blocks
          </Link>
        </div>
      </div>
    </div>
  );
}
