import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/marketing/wordmark";

// Public shell for the legal pages — reachable without signing in so the links
// can be shared anywhere. Kept intentionally separate from the (app) shell.
const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/community-guidelines", label: "Community Guidelines" },
];

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      {/* Header */}
      <header className="border-b border-line">
        <div className="max-w-[820px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="WrytrsBlock home">
            <Wordmark variant="horizontal" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} /> Back to WrytrsBlock
          </Link>
        </div>
      </header>

      {/* Document */}
      <main className="flex-1">
        <div className="max-w-[820px] mx-auto px-6 py-10 md:py-14">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="max-w-[820px] mx-auto px-6 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[12px] text-muted">
            © {new Date().getFullYear()} WrytrsBlock — THE CR8TV COLLECTV.
          </p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[12.5px] text-muted hover:text-ink transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="mailto:support@wrytrsblock.com"
              className="text-[12.5px] text-muted hover:text-ink transition-colors"
            >
              Contact Support
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
