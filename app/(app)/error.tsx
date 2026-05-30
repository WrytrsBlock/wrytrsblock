"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/primitives";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this would report to your error tracker.
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-grad-mesh opacity-40" />
      <div className="relative text-center max-w-md">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface-2 text-danger shadow-soft">
          <RefreshCw size={22} strokeWidth={1.5} />
        </span>
        <h1 className="mt-5 font-display text-3xl text-ink tracking-tight">
          Something cut out.
        </h1>
        <p className="mt-2 text-[13.5px] text-muted leading-relaxed">
          An unexpected error interrupted this view. Your work is safe — try
          loading it again.
        </p>
        {error?.digest && (
          <p className="mt-3 text-[10.5px] font-mono text-muted/70">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-7 flex items-center justify-center">
          <Button variant="primary" size="lg" onClick={reset}>
            <RefreshCw size={14} /> Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
