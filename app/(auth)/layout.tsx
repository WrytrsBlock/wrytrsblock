import { Wordmark } from "@/components/marketing/wordmark";
import { CreativeCollage } from "@/components/marketing/creative-collage";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left — cinematic cover */}
      <div className="hidden lg:flex relative w-[52%] overflow-hidden border-r border-line bg-bg">
        {/* Dynamic, multi-discipline creator collage — always moving */}
        <CreativeCollage />
        {/* Legibility scrims (keep the logo + headline readable) */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/45 to-bg/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/55 via-transparent to-transparent" />
        <div className="absolute inset-0 vignette" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div className="flex items-center gap-2">
            <Wordmark variant="lockup" width={132} />
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.2em] text-muted">
              The CR8TV Collectv
            </p>
            <h2 className="mt-4 font-display text-5xl text-ink tracking-tighter leading-[1.05] max-w-md">
              Discover creators. Build Blocks. Get paid.
            </h2>
            <p className="mt-4 text-[14px] text-muted max-w-md leading-relaxed">
              The home for creators to find each other, collaborate on Blocks,
              and monetize the work they make together.
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
          <div className="lg:hidden mb-8 flex justify-center">
            <Wordmark variant="lockup" width={96} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
