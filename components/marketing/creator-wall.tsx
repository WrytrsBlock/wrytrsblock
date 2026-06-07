import Link from "next/link";
import { Play, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { cardCoverFor } from "@/lib/creator-image";
import { featuredCreators } from "@/lib/mock";

// A wall of real creators for the landing — reads as "look at all this talent,"
// not "look at this software." Masonry of creator imagery with name + score.
const ASPECTS = [
  "aspect-[3/4]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-square",
];

export function CreatorWall({ href = "/marketplace" }: { href?: string }) {
  const creators = featuredCreators();

  return (
    <div className="columns-2 md:columns-3 gap-3 md:gap-4 [column-fill:_balance]">
      {creators.map(({ person, profile }, i) => {
        const image = cardCoverFor(person, profile);
        return (
          <Link
            key={person.id}
            href={href}
            className={cn(
              "group relative mb-3 md:mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-line",
              ASPECTS[i % ASPECTS.length]
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

            {/* Play affordance */}
            <span className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play size={13} className="text-white fill-white translate-x-[1px]" />
            </span>

            {/* Identity */}
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="font-display text-[15px] text-white leading-tight truncate">
                {person.name}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/75 min-w-0">
                <span className="truncate">{profile.roles[0]}</span>
                <span className="inline-flex items-center gap-0.5 shrink-0">
                  <span aria-hidden>·</span>
                  <Star size={10} className="text-warning fill-warning" />
                  <span className="tabular-nums">{profile.blockScore}</span>
                </span>
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
