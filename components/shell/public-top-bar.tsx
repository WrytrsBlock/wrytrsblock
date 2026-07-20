import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/marketing/wordmark";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Minimal chrome for a signed-out visitor browsing a public page (Marketplace,
// a creator's profile) — the authenticated shell in app/(app)/layout.tsx
// assumes a signed-in profile (Sidebar, the user's Blocks list, notifications,
// the music player), none of which apply here. Just enough navigation to sign
// in or create an account; the page's own content underneath is unchanged.
export function PublicTopBar() {
  return (
    <header className="relative z-30 border-b border-line/60 bg-surface/70 backdrop-blur-sm">
      <div className="max-w-[1180px] mx-auto px-6 h-16 flex items-center justify-between">
        <Wordmark variant="horizontal" />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="inline-flex shrink-0 items-center whitespace-nowrap h-8 px-3 sm:px-3.5 rounded-lg border border-line text-[12.5px] font-medium text-ink/90 hover:bg-surface-2 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap h-8 px-3 sm:px-3.5 rounded-lg bg-grad-accent text-white text-[12.5px] font-semibold hover:opacity-95 transition-opacity"
          >
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </header>
  );
}
