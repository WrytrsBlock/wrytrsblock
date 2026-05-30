import { Wordmark } from "@/components/marketing/wordmark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left — cinematic cover */}
      <div className="hidden lg:flex relative w-[52%] overflow-hidden border-r border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=2400&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30 dark:opacity-25 scale-110"
        />
        <div className="absolute inset-0 bg-grad-cinema" />
        <div className="absolute inset-0 vignette" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div className="flex items-center gap-2">
            <Wordmark />
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.2em] text-muted">
              A creative collaboration OS
            </p>
            <h2 className="mt-4 font-display text-5xl text-ink tracking-tighter leading-[1.05] max-w-md">
              The studio you wish you worked at.
            </h2>
            <p className="mt-4 text-[14px] text-muted max-w-md leading-relaxed">
              Blocks for every project. Threads with your team. A marketplace
              when you need to hire. All in one room.
            </p>
            <div className="mt-8 flex items-center gap-2">
              <span className="h-1.5 w-8 rounded-full bg-ink/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 relative">
        <div className="absolute inset-0 bg-grad-mesh opacity-30 pointer-events-none" />
        <div className="relative w-full max-w-[400px]">
          <div className="lg:hidden mb-8">
            <Wordmark />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
