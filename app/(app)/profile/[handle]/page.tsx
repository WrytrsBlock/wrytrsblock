import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ExternalLink,
  Globe,
  ImagePlus,
  LogOut,
  MapPin,
  Pencil,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { StartBlockFlow } from "@/components/block/start-block-flow";
import { ShareProfileButton } from "@/components/creator/share-profile-button";
import { CreatorBlocks } from "@/components/creator/creator-blocks";
import { FeaturedTracks } from "@/components/creator/featured-tracks";
import { tracksFromFeatured } from "@/lib/player";
import { HeroCover } from "@/components/creator/hero-cover";
import { MutualCreators } from "@/components/creator/mutual-creators";
import { tracksForCreator } from "@/lib/mock";
import { mutualCreators } from "@/lib/network";
import { heroImageFor, realAvatar } from "@/lib/creator-image";
import { sanitizeWebsiteUrl } from "@/lib/safe-url";
import {
  getBlockRelationship,
  getCreator,
  getCreatorCollab,
  getCurrentProfile,
} from "@/lib/data";

export const dynamic = "force-dynamic";

const SOCIAL_LABEL: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  spotify: "Spotify",
  linkedin: "LinkedIn",
  website: "Website",
};

function socialUrl(platform: string, value: string): string {
  const v = value.replace(/^@/, "");
  switch (platform) {
    case "instagram":
      return `https://instagram.com/${v}`;
    case "youtube":
      return `https://youtube.com/@${v}`;
    case "spotify":
      return `https://open.spotify.com/search/${encodeURIComponent(value)}`;
    case "linkedin":
      return `https://linkedin.com/in/${v}`;
    case "website":
      return sanitizeWebsiteUrl(value) ?? "#";
    default:
      return "#";
  }
}

export default async function ProfilePage({
  params,
}: {
  params: { handle: string };
}) {
  const data = await getCreator(params.handle);
  if (!data) notFound();
  const { person, profile } = data;
  const tracks = tracksForCreator(profile);
  // Up to 3 showcase tracks (real audio) for the Featured Tracks reel + player.
  const featuredTracks = tracksFromFeatured(profile.featuredContent, {
    name: person.name,
    handle: person.handle,
    type: profile.roles?.[0] ?? "Creator",
    genre: profile.skills?.[0],
  });
  // Hero image (cover → featured image → real photo → portfolio). Undefined ⇒
  // a branded gradient, never random stock.
  const heroImage = heroImageFor(person, profile);
  const avatar = realAvatar(person);

  const me = await getCurrentProfile();
  // Own-profile check by stable auth user id — handles can differ between the
  // base account (profiles) and the creator profile (creator_profiles), which
  // would otherwise hide Edit Profile + cover/photo controls on your own page.
  // Handle match kept as a fallback (mock/dev mode).
  const isMe = !!me && (me.id === person.id || me.handle === person.handle);
  const relationship = isMe ? null : await getBlockRelationship(person.handle);

  // Real Blocks + collaborators (Supabase; mock graph in demo mode).
  const collab = await getCreatorCollab(person.id);
  const mutual = me && !isMe ? mutualCreators(me.id, person.id) : [];

  // Website is rendered as its own chip, so keep it out of the social list to
  // avoid a duplicate "Website".
  const website = profile.website || profile.socials.website || "";
  const socialEntries = Object.entries(profile.socials).filter(
    ([k, v]) => v && k !== "website"
  ) as [string, string][];

  const availability: string[] = [];
  if (profile.openTo.includes("collaboration"))
    availability.push("Open to Collaboration");
  if (profile.openTo.includes("service")) availability.push("Open to Services");

  return (
    // No search bar on the profile — the hero leads. min-h-0 keeps this flex
    // child scrollable (esp. iOS Safari).
    <div className="flex-1 min-h-0 overflow-y-auto">
        {/* ── HERO — the dominant visual. Photo (or branded gradient), a minimal
            identity overlay at the bottom, no floating card. ── */}
        <section className="relative w-full h-[64vh] min-h-[460px] md:h-[800px] overflow-hidden">
          {heroImage ? (
            <HeroCover
              image={heroImage}
              alt={person.name}
              position={profile.coverPosition ?? 25}
              editable={isMe}
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(160deg,#26345C_0%,#1A2440_45%,#101524_100%)]" />
          )}

          {/* Owner prompt to add a cover when there's none */}
          {!heroImage && isMe && (
            <div className="absolute inset-x-0 top-10 flex flex-col items-center gap-2.5 px-6 text-center">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-white backdrop-blur-sm">
                <ImagePlus size={18} strokeWidth={1.75} />
              </span>
              <Link
                href="/profile/edit"
                className="lg-btn"
                style={{ color: "#FFFFFF" }}
              >
                <ImagePlus size={13} /> Add a cover
              </Link>
            </div>
          )}

          {/* Scrim for legible overlay text over any image */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />

          {/* Identity overlay — name, types, location, open-to. Minimal. */}
          <div className="page-fluid absolute inset-x-0 bottom-0 pb-5 md:pb-7">
            <h1 className="font-display text-[44px] md:text-[68px] font-bold leading-[1.0] md:leading-[0.98] tracking-tight text-white drop-shadow-[0_2px_12px_rgb(0_0_0/0.6)]">
              {person.name}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {profile.roles.map((r) => (
                <span key={r} className="lg-pill lg-pill-w">
                  {r}
                </span>
              ))}
              <span className="inline-flex items-center gap-1 text-[12px] text-white/85 drop-shadow">
                <MapPin size={12} className="shrink-0" />
                {profile.location}
              </span>
              {availability.map((a) => (
                <span key={a} className="lg-pill lg-pill-g">
                  <span className="h-[5px] w-[5px] rounded-full bg-[#2BC48A]" />
                  {a}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Actions + compact stats (no LinkedIn panel) ── */}
        <div className="page-fluid pt-3 md:pt-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {isMe ? (
              <Link href="/profile/edit" className="lg-btn lg-btn-p">
                <Pencil size={14} /> Edit Profile
              </Link>
            ) : (
              <StartBlockFlow
                handle={person.handle}
                name={person.name}
                avatar={avatar ?? undefined}
                myName={me?.name ?? "You"}
                myAvatar={me?.avatar}
                relationship={relationship ?? { status: "none" }}
              />
            )}
            <ShareProfileButton handle={person.handle} name={person.name} />
            {/* Settings reachable on mobile (the desktop sidebar menu is hidden);
                Settings holds Log out. */}
            {isMe && (
              <Link href="/settings" className="lg-btn" aria-label="Settings">
                <Settings size={14} /> Settings
              </Link>
            )}
            {/* Direct Log out — switching accounts is a primary need (testing
                onboarding), so it lives on the profile itself, not just buried in
                Settings. Posts to the existing server sign-out route. */}
            {isMe && (
              <form action="/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="lg-btn text-danger hover:bg-danger/10"
                  aria-label="Log out"
                >
                  <LogOut size={14} /> Log Out
                </button>
              </form>
            )}
            <span className="hidden flex-1 sm:block" />
            <div className="flex items-center gap-3 text-[12px] text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#A9BEFF]" />
                Block Score{" "}
                <span className="font-semibold text-white/85 tabular-nums">
                  {profile.blockScore}
                </span>
              </span>
              {collab.collaborators.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Users size={12} />
                  <span className="font-semibold text-white/85 tabular-nums">
                    {collab.collaborators.length}
                  </span>{" "}
                  worked with
                </span>
              )}
            </div>
          </div>

          {/* Mutual creators (visitor) */}
          {!isMe && mutual.length > 0 && (
            <div className="mt-3">
              <MutualCreators mutual={mutual} />
            </div>
          )}

          {/* Social links — compact, never a big section */}
          {(socialEntries.length > 0 || Boolean(website)) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {website && (
                <a
                  href={socialUrl("website", website)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11.5px] text-white/80 transition-colors hover:bg-white/[0.1]"
                >
                  <Globe size={12} /> Website <ExternalLink size={11} />
                </a>
              )}
              {socialEntries.map(([platform, value]) => (
                <a
                  key={platform}
                  href={socialUrl(platform, value)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11.5px] text-white/80 transition-colors hover:bg-white/[0.1]"
                >
                  {SOCIAL_LABEL[platform] ?? platform}
                  <ExternalLink size={11} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── CREATOR BLOCKS — the centerpiece. Explore this creator through
            their blocks. ── */}
        <div className="page-fluid pt-4 md:pt-4 pb-16 animate-fade-up">
          <FeaturedTracks tracks={featuredTracks} />
          <CreatorBlocks
            isOwner={isMe}
            name={person.name}
            handle={person.handle}
            featured={profile.featuredContent ?? []}
            tracks={tracks}
            services={profile.services}
            bio={profile.bio}
            tagline={profile.tagline}
            skills={profile.skills}
            seeking={[]}
            openTo={availability}
            credits={profile.credits}
            collaborators={collab.collaborators}
            blockScore={profile.blockScore}
            rating={profile.rating}
            completedBlocks={collab.completedBlocks}
          />
        </div>
    </div>
  );
}
