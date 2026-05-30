// A stylized, non-interactive mock of the Block Workspace for the landing hero.
// Pure presentation — evokes the real UI without importing app chrome.

const columns = [
  { title: "Brief", cards: ["Ep. 4 cold open rewrite", "Foley shot list"] },
  { title: "In Progress", cards: ["Record VO — Imani", "Newsroom theme"] },
  { title: "Review", cards: ["Ep. 2 picture lock"] },
];

const tagColor = ["bg-accent/60", "bg-accent-2/60", "bg-success/60", "bg-warning/60"];

export function AppPreview() {
  return (
    <div className="relative rounded-2xl border border-line-strong bg-surface shadow-pop overflow-hidden">
      {/* window chrome */}
      <div className="h-9 border-b border-line flex items-center gap-1.5 px-3.5">
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="ml-3 text-[10px] text-muted font-mono">
          wrytrsblock / midnight-press
        </span>
      </div>

      <div className="flex h-[340px]">
        {/* sidebar */}
        <div className="hidden sm:flex flex-col w-[140px] shrink-0 border-r border-line p-2.5 gap-1 bg-bg/40">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="h-5 w-5 rounded bg-grad-accent" />
            <span className="h-2 w-16 rounded bg-surface-3" />
          </div>
          {["Home", "Blocks", "Messages", "Media"].map((l, i) => (
            <div
              key={l}
              className={`flex items-center gap-1.5 h-6 px-1.5 rounded-md ${
                i === 1 ? "bg-surface-2" : ""
              }`}
            >
              <span
                className={`h-2 w-2 rounded-sm ${
                  i === 1 ? "bg-accent" : "bg-surface-3"
                }`}
              />
              <span
                className={`h-1.5 rounded ${
                  i === 1 ? "w-12 bg-ink/40" : "w-10 bg-surface-3"
                }`}
              />
            </div>
          ))}
          <div className="mt-auto flex items-center gap-1.5">
            <span className="h-5 w-5 rounded-full bg-surface-3" />
            <span className="h-1.5 w-12 rounded bg-surface-3" />
          </div>
        </div>

        {/* main */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* header */}
          <div className="relative px-4 pt-4 pb-3 border-b border-line overflow-hidden">
            <div className="absolute inset-0 bg-grad-mesh opacity-50" />
            <div className="relative">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-slow-pulse" />
                <span className="text-[9px] uppercase tracking-[0.16em] text-muted">
                  Producing
                </span>
              </div>
              <p className="mt-1.5 font-display text-xl text-ink tracking-tight">
                Midnight Press
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-5 w-5 rounded-full bg-surface-3 ring-2 ring-surface -ml-1.5 first:ml-0"
                  />
                ))}
                <span className="ml-1 h-1.5 w-1 rounded bg-surface-3" />
                <span className="ml-auto h-1.5 w-10 rounded bg-grad-accent" />
              </div>
            </div>
          </div>

          {/* board */}
          <div className="flex-1 grid grid-cols-3 gap-2 p-3 bg-bg/30">
            {columns.map((col) => (
              <div
                key={col.title}
                className="rounded-lg border border-line bg-surface/50 p-1.5"
              >
                <div className="flex items-center justify-between px-1 pb-1.5">
                  <span className="text-[8.5px] uppercase tracking-wide text-ink/70 font-semibold">
                    {col.title}
                  </span>
                  <span className="text-[8px] font-mono text-muted">
                    {col.cards.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {col.cards.map((c, i) => (
                    <div
                      key={c}
                      className="rounded-md border border-line bg-surface p-1.5 shadow-soft"
                    >
                      <div className="h-1.5 w-full rounded bg-surface-3" />
                      <div className="mt-1.5 flex items-center justify-between">
                        <span
                          className={`h-1.5 w-6 rounded ${
                            tagColor[(col.title.length + i) % tagColor.length]
                          }`}
                        />
                        <span className="h-3.5 w-3.5 rounded-full bg-surface-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* context rail */}
        <div className="hidden lg:flex flex-col w-[128px] shrink-0 border-l border-line p-2.5 gap-2 bg-bg/40">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-slow-pulse" />
            <span className="text-[8px] font-mono text-muted tracking-wider">
              3 LIVE
            </span>
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-surface-3" />
              <div className="flex-1 space-y-1">
                <span className="block h-1.5 w-12 rounded bg-surface-3" />
                <span className="block h-1 w-9 rounded bg-surface-3/60" />
              </div>
            </div>
          ))}
          <div className="mt-2 space-y-1.5">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-md border border-line bg-surface p-1.5">
                <span className="block h-1.5 w-full rounded bg-surface-3" />
                <span className="mt-1 block h-1.5 w-10 rounded bg-surface-3/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
