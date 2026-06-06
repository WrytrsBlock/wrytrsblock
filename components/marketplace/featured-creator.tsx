import Link from "next/link";
import { ArrowUpRight, MapPin, Sparkles, Star } from "lucide-react";
import { StartBlockButton } from "@/components/block/start-block-button";
import type { CreatorProfile, Person } from "@/lib/mock";

// A compact spotlight strip — keeps a single creator featured without the
// magazine-cover dominance that pushed search + discovery below the fold.
export function FeaturedCreator({
  person,
  profile,
}: {
  person: Person;
  profile: CreatorProfile;
}) {
  const href = `/profile/${person.handle}`;
  const image = profile.portfolio[0] ?? profile.banner ?? person.avatar;

  return (
    <section className="relative overflow-hidden rounded-2xl glass-card glass-hover animate-fade-up">
      <div className="flex items-center gap-3.5 p-3 md:p-3.5">
        {/* Thumbnail → profile */}
        <Link
          href={href}
          aria-label={`View ${person.name}'s profile`}
          className="relative h-[72px] w-[72px] md:h-[88px] md:w-[88px] shrink-0 rounded-xl overflow-hidden bg-surface-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-cover" />
        </Link>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent-2">
            <Sparkles size={11} /> Featured
          </span>
          <Link href={href} className="block">
            <h2 className="font-display text-[18px] md:text-[22px] text-ink leading-tight truncate">
              {person.name}
            </h2>
          </Link>
          <p className="mt-0.5 flex items-center gap-x-2.5 gap-y-0.5 text-[11.5px] md:text-[12.5px] text-muted flex-wrap min-w-0">
            <span className="text-ink/85 font-medium truncate">
              {profile.roles.slice(0, 2).join(" · ")}
            </span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Star size={11} className="text-warning fill-warning" />
              <span className="font-semibold tabular-nums text-ink/90">
                {profile.blockScore}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 min-w-0">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{profile.location}</span>
            </span>
          </p>
        </div>

        {/* CTAs */}
        <div className="shrink-0 flex items-center gap-2">
          <StartBlockButton
            handle={person.handle}
            name={person.name}
            variant="primary"
            size="md"
          />
          <Link
            href={href}
            aria-label={`View ${person.name}'s profile`}
            className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-lg text-ink bg-white/[0.06] border border-white/12 hover:bg-white/[0.1] hover:border-white/20 transition-colors"
          >
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
