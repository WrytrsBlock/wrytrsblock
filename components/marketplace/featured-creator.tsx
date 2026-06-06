import Link from "next/link";
import { ArrowUpRight, Headphones, MapPin, Play, Sparkles, Star } from "lucide-react";
import { StartBlockButton } from "@/components/block/start-block-button";
import {
  isVideoType,
  pickFeatured,
  youtubeId,
  youtubeThumb,
} from "@/lib/featured-content";
import type { CreatorProfile, Person } from "@/lib/mock";

// Resolve the spotlight background from the creator's pinned Featured Content,
// matching the discovery cards.
function spotlightMedia(
  profile: CreatorProfile,
  person: Person
): { image: string | undefined; mediaIcon: "play" | "audio" | null } {
  const f = pickFeatured(profile.featuredContent ?? []);
  let image: string | undefined;
  let mediaIcon: "play" | "audio" | null = null;
  if (f) {
    if (f.type === "image") image = f.url;
    else if (isVideoType(f.type)) {
      const id = youtubeId(f.url);
      image = id ? youtubeThumb(id) : undefined;
      mediaIcon = "play";
    } else if (f.type === "instagram" || f.type === "tiktok") mediaIcon = "play";
    else if (f.type === "audio") mediaIcon = "audio";
  }
  if (!image) image = profile.portfolio[0] ?? profile.banner ?? person.avatar;
  return { image, mediaIcon };
}

// A compact spotlight — a full-bleed Featured Content background with the same
// frosted-glass gradient language as the discovery cards (legible identity on
// the left, the creator's work showing through on the right).
export function FeaturedCreator({
  person,
  profile,
}: {
  person: Person;
  profile: CreatorProfile;
}) {
  const href = `/profile/${person.handle}`;
  const { image, mediaIcon } = spotlightMedia(profile, person);

  return (
    <section className="relative overflow-hidden rounded-2xl glass-tile glass-hover animate-fade-up">
      {/* Full-bleed Featured Content / image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Frosted glass gradient — dark/legible on the left, work shows on the right */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />

      {/* Whole spotlight → profile (beneath the CTAs) */}
      <Link
        href={href}
        aria-label={`View ${person.name}'s profile`}
        className="absolute inset-0 z-0"
      />

      {/* Small monochrome media indicator for video / audio */}
      {mediaIcon && (
        <span className="absolute top-2.5 right-2.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm border border-white/20 text-white">
          {mediaIcon === "audio" ? (
            <Headphones size={13} />
          ) : (
            <Play size={13} className="fill-current ml-0.5" />
          )}
        </span>
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center gap-4 p-4 md:p-5 min-h-[140px] md:min-h-[152px]">
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
            <Sparkles size={11} className="text-accent-2" /> Featured Creator
          </span>
          <Link href={href} className="block">
            <h2 className="mt-1 font-display text-[22px] md:text-[28px] text-white leading-[1.05] tracking-tight truncate">
              {person.name}
            </h2>
          </Link>
          <p className="mt-1 flex items-center gap-x-2.5 gap-y-0.5 text-[12px] md:text-[12.5px] text-white/75 flex-wrap min-w-0">
            <span className="text-white/90 font-medium truncate">
              {profile.roles.slice(0, 2).join(" · ")}
            </span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Star size={11} className="text-warning fill-warning" />
              <span className="font-semibold tabular-nums text-white/90">
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
            className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-lg text-white bg-white/[0.1] border border-white/20 hover:bg-white/[0.18] transition-colors"
          >
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
