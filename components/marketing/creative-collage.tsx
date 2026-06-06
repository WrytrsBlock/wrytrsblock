import { cn } from "@/lib/cn";

// An immersive, always-moving wall of creativity — creators across disciplines:
// musicians, producers, writers, photographers, filmmakers, performers. Columns
// drift at different speeds; edges fade; imagery layers for depth. Pure CSS
// motion (respects prefers-reduced-motion). Designed to be a full-bleed
// background so entering WrytrsBlock feels like stepping into a creative world.
type Tile = { src: string; label: string };

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=640&q=70`;

const TILES: Tile[] = [
  { src: img("1511671782779-c97d3d27a1d4"), label: "Musician" },
  { src: img("1485846234645-a62644f84728"), label: "Filmmaker" },
  { src: img("1452587925148-ce544e77e70d"), label: "Photographer" },
  { src: img("1455390582262-044cdead277a"), label: "Writer" },
  { src: img("1501386761578-eac5c94b800a"), label: "Performer" },
  { src: img("1598488035139-bdbb2231ce04"), label: "Producer" },
  { src: img("1493225457124-a3eb161ffa5f"), label: "Musician" },
  { src: img("1478720568477-152d9b164e26"), label: "Filmmaker" },
  { src: img("1500051638674-ff996a0ec29e"), label: "Photographer" },
  { src: img("1517842645767-c639042777db"), label: "Writer" },
  { src: img("1516280440614-37939bbacd81"), label: "Performer" },
  { src: img("1574169208507-84376144848b"), label: "Producer" },
  { src: img("1508700115892-45ecd05ae2ad"), label: "Musician" },
  { src: img("1518834107812-67b0b7c58434"), label: "Performer" },
  { src: img("1574717024653-61fd2cf4d44d"), label: "Filmmaker" },
];

export function CreativeCollage({
  className,
  columns = 3,
}: {
  className?: string;
  columns?: number;
}) {
  // Distribute tiles round-robin so each column stays discipline-varied.
  const cols: Tile[][] = Array.from({ length: columns }, () => []);
  TILES.forEach((t, i) => cols[i % columns].push(t));

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Drifting columns — slightly over-scaled + tilted for depth */}
      <div className="absolute inset-0 scale-[1.18] -rotate-3 flex gap-2.5 md:gap-3 opacity-95">
        {cols.map((col, ci) => (
          <div
            key={ci}
            className={cn(
              "relative flex-1 overflow-hidden",
              // Fewer, larger columns on phones — big enough that the drift is
              // clearly visible (and more premium). All columns show on desktop.
              ci >= 4 ? "hidden lg:block" : ci === 3 ? "hidden sm:block" : ""
            )}
          >
            <div
              className={cn(
                // will-change + a 3D layer keep the animation alive on mobile
                // Safari/Chrome; the keyframes use translate3d for the same reason.
                "absolute inset-x-0 flex flex-col gap-2.5 md:gap-3 will-change-transform [backface-visibility:hidden]",
                ci % 2 === 1 ? "animate-collage-down" : "animate-collage-up",
                "motion-reduce:animate-none"
              )}
              style={{ animationDuration: `${34 + (ci % 4) * 9}s` }}
            >
              {[...col, ...col].map((t, i) => (
                <figure
                  key={`${ci}-${i}`}
                  className="relative overflow-hidden rounded-xl border border-white/10 aspect-[3/4]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.src}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <figcaption className="absolute bottom-1.5 left-1.5 inline-flex items-center h-5 px-2 rounded-full bg-black/45 backdrop-blur-sm text-white/90 text-[8.5px] font-bold uppercase tracking-[0.12em]">
                    {t.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edge fades — imagery dissolves in/out as it drifts */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
    </div>
  );
}
