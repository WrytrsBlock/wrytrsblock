import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Boxes,
  ChevronDown,
  Clapperboard,
  Layers,
  MessagesSquare,
  Music,
  PieChart,
  Radio,
  ShoppingBag,
  Star,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Wordmark } from "@/components/marketing/wordmark";
import { CreatorWall } from "@/components/marketing/creator-wall";
import { CreativeCollage } from "@/components/marketing/creative-collage";
import {
  LandingSignInButton,
  LandingSignInDialog,
} from "@/components/marketing/landing-sign-in";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { supabaseConfigured } from "@/lib/env";
import { getCurrentProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

const features = [
  {
    icon: ShoppingBag,
    title: "Block Market",
    body: "Discover creators across every craft — producers, writers, engineers, designers, and more — and start a Block with anyone.",
  },
  {
    icon: Layers,
    title: "Start a Block",
    body: "A Block is a creative collaboration you own. Spin one up, bring people in, and make the work together.",
  },
  {
    icon: MessagesSquare,
    title: "Block Party",
    body: "Create in real time — drop in, listen together, and move a Block forward without leaving the room.",
  },
  {
    icon: PieChart,
    title: "Split Sheet",
    body: "Decide who owns what up front. Every Block carries its splits, so credit and pay stay clear.",
  },
  {
    icon: Wallet,
    title: "Monetize a Block",
    body: "Sell it, gate it, or take tips. Set a price on any Block and get paid through Stripe or PayPal.",
  },
  {
    icon: Star,
    title: "Block Score",
    body: "Reputation you earn by completing Blocks — the trust signal that gets you discovered.",
  },
];

const audiences = [
  { icon: Music, label: "Producers", note: "Beats & production" },
  { icon: Radio, label: "Vocalists & writers", note: "Toplines & lyrics" },
  { icon: Zap, label: "Engineers", note: "Mixing & mastering" },
  { icon: Clapperboard, label: "Artists & filmmakers", note: "Visuals & video" },
];

export default async function LandingPage() {
  // Signed-in users skip the marketing page.
  if (supabaseConfigured) {
    const profile = await getCurrentProfile();
    if (profile) redirect("/marketplace");
  }

  return (
    <div className="min-h-screen bg-bg text-ink overflow-x-hidden">
      {/* Ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grad-mesh opacity-60" />
        <div className="absolute inset-x-0 top-0 h-[60vh] bg-grad-fade-b opacity-40" />
      </div>

      {/* HERO — a full-screen creative world */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Living, multi-discipline creator collage behind everything */}
        <CreativeCollage columns={5} />
        {/* Depth + legibility scrims (fades to bg at the bottom for scroll) */}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-transparent to-bg" />
        <div className="absolute inset-0 bg-grad-mesh opacity-25" />

        {/* Nav — floats over the hero */}
        <header className="relative z-30">
          <div className="max-w-[1180px] mx-auto px-6 h-16 flex items-center justify-between">
            <Wordmark variant="horizontal" />
            <nav className="hidden md:flex items-center gap-6 text-[13px] text-white/70">
              <a href="#creators" className="hover:text-white transition-colors">
                Creators
              </a>
              <a href="#concept" className="hover:text-white transition-colors">
                The Block
              </a>
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
            </nav>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Theme toggle hides on mobile to keep room for both auth CTAs. */}
              <span className="hidden sm:inline-flex">
                <ThemeToggle />
              </span>
              {/* Inline sign-in — opens a modal on the landing page itself, no
                  navigation. Visible on mobile and desktop. */}
              <LandingSignInButton className="inline-flex items-center h-8 px-3 sm:px-3.5 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-[12.5px] font-medium text-white/90 hover:bg-white/15 hover:text-white transition-colors">
                Sign in
              </LandingSignInButton>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 h-8 px-3 sm:px-3.5 rounded-lg bg-white text-black text-[12.5px] font-semibold hover:bg-white/90 transition-colors shadow-soft"
              >
                Get started <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </header>

        {/* Brand — large, centered, on top of the collage */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-6 pb-12">
          {/* Official WrytrsBlock logo — the primary hero element, as designed */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/wrytrsblock-white.svg"
            alt="WrytrsBlock — The CR8TV Collectv"
            draggable={false}
            className="w-[168px] md:w-[248px] h-auto drop-shadow-[0_10px_44px_rgba(0,0,0,0.6)]"
          />
          <p className="mt-5 text-[15px] md:text-[18px] text-white/85 max-w-xl leading-relaxed">
            Where creators discover each other, collaborate on{" "}
            <strong className="text-white font-semibold">Blocks</strong>, and get
            paid for the work they make together.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-grad-accent text-white text-[15px] font-semibold shadow-glow hover:opacity-95 transition-opacity"
            >
              Join the Collectv <ArrowRight size={16} />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-white/30 bg-white/5 backdrop-blur-sm text-white text-[15px] font-medium hover:bg-white/10 transition-colors"
            >
              Explore the Block Market
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="relative z-20 pb-8 flex flex-col items-center gap-1.5">
          <span className="text-[10.5px] uppercase tracking-[0.2em] text-white/50">
            Scroll to explore
          </span>
          <ChevronDown size={18} className="text-white/60 animate-bounce" />
        </div>
      </section>

      {/* Creators — the wall, revealed after the hero */}
      <section
        id="creators"
        className="max-w-[1180px] mx-auto px-6 py-16 md:py-24"
      >
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.18em] text-muted font-semibold">
              The CR8TV Collectv
            </p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl tracking-tight">
              Meet the creators.
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="shrink-0 text-[12.5px] text-accent hover:text-accent-2 transition-colors inline-flex items-center gap-1"
          >
            Explore the Block Market <ArrowRight size={13} />
          </Link>
        </div>
        <CreatorWall />
      </section>

      {/* Concept */}
      <section
        id="concept"
        className="max-w-[1180px] mx-auto px-6 py-16 md:py-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-muted">
              <Boxes size={13} className="text-accent" /> The core idea
            </div>
            <h2 className="mt-4 font-display text-4xl tracking-tighter leading-tight">
              Everything you make is a Block.
            </h2>
            <p className="mt-4 text-[14.5px] text-muted leading-relaxed">
              A Block is a creative collaboration you own — a song, a beat, a
              project, an open call. Bring in collaborators, agree the splits,
              and turn it into something you can sell.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Discover collaborators in the Block Market and start a Block together",
                "Agree who owns what with a Split Sheet built into every Block",
                "Monetize a Block — sell it, gate it, or take tips",
                "Build your Block Score and get discovered as you complete work",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[13.5px]">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                  <span className="text-ink/90">{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-grad-mesh opacity-40 blur-xl -z-10" />
            <CreatorWall />
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="max-w-[1180px] mx-auto px-6 py-16 md:py-20"
      >
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-muted">
            Built on Blocks
          </div>
          <h2 className="mt-4 font-display text-4xl tracking-tighter leading-tight">
            From discovery to payout — all on Blocks.
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-line bg-surface p-6 shadow-soft hover:border-line-strong hover:shadow-elevated transition-all duration-300"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 border border-line text-accent">
                  <Icon size={17} strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[12.5px] text-muted leading-relaxed">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Who it's for */}
      <section id="who" className="max-w-[1180px] mx-auto px-6 py-16 md:py-20">
        <div className="rounded-3xl border border-line p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-grad-mesh opacity-50" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-4xl tracking-tighter leading-tight max-w-xl">
              Made for the people who make things.
            </h2>
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {audiences.map((a) => {
                const Icon = a.icon;
                return (
                  <div
                    key={a.label}
                    className="rounded-2xl border border-line bg-surface/70 backdrop-blur-sm p-5"
                  >
                    <Icon size={20} className="text-accent" strokeWidth={1.5} />
                    <p className="mt-3 text-[14px] font-semibold tracking-tight">
                      {a.label}
                    </p>
                    <p className="text-[11.5px] text-muted mt-0.5">{a.note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1180px] mx-auto px-6 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <Users size={22} className="text-accent mx-auto" strokeWidth={1.5} />
          <h2 className="mt-5 font-display text-4xl md:text-5xl tracking-tighter leading-[1.05]">
            Start your first Block today.
          </h2>
          <p className="mt-4 text-[14.5px] text-muted leading-relaxed">
            Join THE CR8TV COLLECTV — discover creators, start a Block, and get
            paid for what you make together.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-grad-accent text-white text-[14px] font-medium shadow-glow hover:opacity-95 transition-opacity"
            >
              Join the Collectv <ArrowRight size={15} />
            </Link>
            <LandingSignInButton className="inline-flex items-center h-11 px-6 rounded-xl border border-line text-[14px] font-medium hover:bg-surface-2 transition-colors">
              Sign in
            </LandingSignInButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="max-w-[1180px] mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <Wordmark variant="horizontal" />
          <p className="text-[11.5px] text-muted">
            © {new Date().getFullYear()} WrytrsBlock — THE CR8TV COLLECTV.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-muted">
            <a href="#features" className="hover:text-ink transition-colors">
              Features
            </a>
            <Link href="/terms" className="hover:text-ink transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">
              Privacy
            </Link>
            <Link
              href="/community-guidelines"
              className="hover:text-ink transition-colors"
            >
              Community
            </Link>
            <Link href="/sign-in" className="hover:text-ink transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>

      {/* Inline sign-in modal — opened by any "Sign in" trigger above. */}
      <LandingSignInDialog />
    </div>
  );
}
