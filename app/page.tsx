import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Boxes,
  Clapperboard,
  Film,
  Image as ImageIcon,
  Layers,
  MessagesSquare,
  Music,
  Radio,
  ShoppingBag,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Wordmark } from "@/components/marketing/wordmark";
import { AppPreview } from "@/components/marketing/app-preview";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/primitives";
import { supabaseConfigured } from "@/lib/env";
import { getCurrentProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

const features = [
  {
    icon: Layers,
    title: "Blocks",
    body: "One container per creative work — film, album, audio drama. Brief, board, files, threads, and team in a single room.",
  },
  {
    icon: MessagesSquare,
    title: "Threads",
    body: "Channels and DMs scoped to each Block. Real-time, with presence so you see who's editing what, right now.",
  },
  {
    icon: ImageIcon,
    title: "Media library",
    body: "Drop stems, cuts, stills, and scripts. Auto-tagged, versioned, transcribed, and searchable across every Block.",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    body: "Hire vetted collaborators — or get hired. Briefs drafted from your Block, paid by milestone with escrow.",
  },
  {
    icon: Zap,
    title: "Built for real time",
    body: "Live presence, streaming messages, and optimistic edits. Collaboration that feels like you're in the same studio.",
  },
  {
    icon: Sparkles,
    title: "Blocky, your sidekick",
    body: "Summaries, drafts, and briefs from the context of your work — never a blank page.",
  },
];

const audiences = [
  { icon: Radio, label: "Audio drama", note: "Serials, podcasts, fiction" },
  { icon: Film, label: "Film & video", note: "Shorts, docs, series" },
  { icon: Music, label: "Music", note: "Albums, scores, sound" },
  { icon: Clapperboard, label: "Media production", note: "Editorial, studios" },
];

export default async function LandingPage() {
  // Signed-in users skip the marketing page.
  if (supabaseConfigured) {
    const profile = await getCurrentProfile();
    if (profile) redirect("/home");
  }

  return (
    <div className="min-h-screen bg-bg text-ink overflow-x-hidden">
      {/* Ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grad-mesh opacity-60" />
        <div className="absolute inset-x-0 top-0 h-[60vh] bg-grad-fade-b opacity-40" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 glass border-b border-line">
        <div className="max-w-[1180px] mx-auto px-6 h-14 flex items-center justify-between">
          <Wordmark />
          <nav className="hidden md:flex items-center gap-6 text-[13px] text-muted">
            <a href="#features" className="hover:text-ink transition-colors">
              Features
            </a>
            <a href="#concept" className="hover:text-ink transition-colors">
              The Block
            </a>
            <a href="#who" className="hover:text-ink transition-colors">
              Who it's for
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/sign-in"
              className="hidden sm:inline-flex items-center h-8 px-3 rounded-lg text-[12.5px] text-ink hover:bg-surface-2 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-ink text-bg text-[12.5px] font-medium hover:bg-ink/90 transition-colors shadow-soft"
            >
              Get started <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1180px] mx-auto px-6 pt-16 pb-10 md:pt-24 md:pb-16">
        <div className="max-w-3xl">
          <Badge tone="soft" className="!h-6 !px-2.5">
            <Sparkles size={11} className="text-accent" /> A creative
            collaboration OS
          </Badge>
          <h1 className="mt-5 font-display text-5xl md:text-6xl tracking-tighter leading-[1.02]">
            The studio you wish
            <br />
            you <span className="text-gradient-accent">worked at</span>.
          </h1>
          <p className="mt-5 text-[15px] md:text-[16px] text-muted leading-relaxed max-w-xl">
            WrytrsBlock is where music, film, and media get made together.
            Organize every project into a <strong className="text-ink font-medium">Block</strong>,
            collaborate in real time, hire the right people, and keep every
            file in one cinematic workspace.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-grad-accent text-bg text-[14px] font-medium shadow-glow hover:opacity-95 transition-opacity"
            >
              Start free <ArrowRight size={15} />
            </Link>
            <Link
              href="/home"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-line text-[14px] font-medium hover:bg-surface-2 hover:border-line-strong transition-all"
            >
              Explore the demo
            </Link>
          </div>
          <p className="mt-3 text-[11.5px] text-muted">
            No credit card. Dark mode by default — because that's where the work
            happens.
          </p>
        </div>

        {/* App preview */}
        <div className="mt-14 relative">
          <div className="absolute -inset-x-8 -top-8 bottom-0 bg-grad-mesh opacity-40 blur-2xl -z-10" />
          <AppPreview />
        </div>
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
              Not folders. Not a dozen disconnected apps. A Block is a living
              container for one creative work — its brief, its board, its
              files, its conversations, and the people making it.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Plan with a board that moves from brief to shipped",
                "Keep media, docs, and versions where the work lives",
                "Talk in threads scoped to the project, not your whole life",
                "Invite collaborators with the right level of access",
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
            <AppPreview />
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
            Everything in one room
          </div>
          <h2 className="mt-4 font-display text-4xl tracking-tighter leading-tight">
            A workspace tuned for serious creative work.
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
            Build your first Block today.
          </h2>
          <p className="mt-4 text-[14.5px] text-muted leading-relaxed">
            Free to start. Bring your team, your files, and your next project
            into one place.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-grad-accent text-bg text-[14px] font-medium shadow-glow hover:opacity-95 transition-opacity"
            >
              Get started <ArrowRight size={15} />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center h-11 px-6 rounded-xl border border-line text-[14px] font-medium hover:bg-surface-2 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="max-w-[1180px] mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <Wordmark />
          <p className="text-[11.5px] text-muted">
            © {new Date().getFullYear()} WrytrsBlock. A creative collaboration
            OS.
          </p>
          <div className="flex items-center gap-5 text-[12px] text-muted">
            <a href="#features" className="hover:text-ink transition-colors">
              Features
            </a>
            <Link href="/sign-in" className="hover:text-ink transition-colors">
              Sign in
            </Link>
            <Link href="/sign-up" className="hover:text-ink transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
