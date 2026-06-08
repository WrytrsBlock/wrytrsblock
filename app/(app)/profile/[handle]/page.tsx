import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Briefcase,
  ExternalLink,
  Globe,
  Headphones,
  ImagePlus,
  MapPin,
  Pencil,
} from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import { Badge, Button, Progress } from "@/components/ui/primitives";
import { StartBlockButton } from "@/components/block/start-block-button";
import { BlockScoreCard } from "@/components/creator/block-score";
import { BlockShowcase } from "@/components/creator/block-showcase";
import { ShareProfileButton } from "@/components/creator/share-profile-button";
import { SampleBlocks } from "@/components/creator/sample-blocks";
import { MediaPlayer } from "@/components/creator/media-player";
import { blocksForPerson, tracksForCreator } from "@/lib/mock";
import { profileCompleteness, scoreFactorBreakdown } from "@/lib/block-score";
import { heroImageFor, realAvatar } from "@/lib/creator-image";
import { getCreator, getCurrentProfile } from "@/lib/data";

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
      return value.startsWith("http") ? value : `https://${value}`;
    default:
      return "#";
  }
}

// A clean, consistent empty state for a profile section — so sections are never
// hidden just because the live profile has no data yet.
function SectionEmpty({ label }: { label: string }) {
  return (
    <div className="mt-4 glass-card rounded-2xl px-5 py-8 text-center">
      <p className="text-[13px] text-muted">{label}</p>
    </div>
  );
}

export default async function ProfilePage({
  params,
}: {
  params: { handle: string };
}) {
  const data = await getCreator(params.handle);
  if (!data) notFound();
  const { person, profile } = data;
  const activeBlocks = blocksForPerson(person.id);
  const tracks = tracksForCreator(profile);
  // Cover/hero image (cover → featured image → real photo → portfolio). Never a
  // dicebear avatar or random stock — undefined ⇒ branded gradient instead.
  const heroImage = heroImageFor(person, profile);
  // The profile photo (avatar) shown in the identity card — real photo only.
  const avatar = realAvatar(person);

  const me = await getCurrentProfile();
  const isMe = me?.handle === person.handle;

  const completeness = profileCompleteness({
    bio: profile.bio,
    skills: profile.skills,
    portfolio: profile.portfolio,
    socials: profile.socials,
    website: profile.website,
  });
  const scoreFactors = scoreFactorBreakdown({
    blockScore: profile.blockScore,
    completedBlocks: activeBlocks.length,
    rating: profile.rating,
    profileCompleteness: completeness,
  });

  const completedBlocks = activeBlocks.length;
  const isNewCreator = completedBlocks === 0 && profile.reviews < 3;

  const socialEntries = Object.entries(profile.socials).filter(
    ([, v]) => v
  ) as [string, string][];

  const availability: string[] = [];
  if (profile.openTo.includes("collaboration"))
    availability.push("Open to Collaboration");
  if (profile.openTo.includes("service")) availability.push("Open to Services");

  return (
    <>
      <TopBar
        crumbs={[
          { label: "Block Market", href: "/marketplace" },
          { label: person.name },
        ]}
      />
      {/* min-h-0 is required so this flex child actually scrolls (esp. iOS
          Safari) instead of growing to its content height and clipping. */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* ── Split banner — identity over the cover image (≈65%) on the left,
            the integrated Block Showcase 3×3 grid (≈35%) on the right, both the
            same full height. Communicates who/what/why at a glance, no scroll. ── */}
        <section className="w-full px-3 md:px-5 pt-3 md:pt-4">
          <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-3 lg:grid-cols-[1.85fr_1fr] lg:gap-4">
            {/* LEFT — cover image + identity */}
            <div className="relative min-h-[440px] md:min-h-[470px] lg:min-h-[510px] overflow-hidden rounded-[28px] border border-white/10">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  alt={person.name}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
              ) : (
                <div className="absolute inset-0 bg-grad-accent">
                  <div className="absolute inset-0 bg-grad-mesh opacity-30" />
                </div>
              )}
              {/* Top scrim for legibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent" />

              {/* Owner prompt when there's no cover yet */}
              {!heroImage && isMe && (
                <div className="absolute inset-x-0 top-7 flex flex-col items-center gap-2.5 px-6 text-center">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm text-white">
                    <ImagePlus size={18} strokeWidth={1.75} />
                  </span>
                  <p className="text-white text-[13.5px] font-medium max-w-xs leading-snug">
                    Add a cover image to make your profile stand out
                  </p>
                  <Link href="/profile/edit">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/35 text-white hover:bg-white/15"
                      style={{ color: "#FFFFFF" }}
                    >
                      <ImagePlus size={13} /> Add cover image
                    </Button>
                  </Link>
                </div>
              )}

              {/* Frosted identity panel */}
              <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-gradient-to-t from-black/90 via-black/55 to-transparent backdrop-blur-md p-5 md:p-7">
                <div className="flex items-end gap-4">
                  {/* Profile photo */}
                  <div className="shrink-0">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt={person.name}
                        className="h-16 w-16 md:h-20 md:w-20 rounded-2xl border-2 border-white/25 object-cover shadow-lg"
                      />
                    ) : (
                      <span className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl border-2 border-white/25 bg-white/15 font-display text-2xl text-white">
                        {person.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
                      @{person.handle}
                    </p>
                    <h1 className="mt-0.5 truncate font-display text-[34px] sm:text-[44px] md:text-[52px] leading-[0.95] tracking-tight text-white">
                      {person.name}
                    </h1>
                  </div>
                </div>

                {/* Creator type(s) · location · collaboration status */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  {profile.roles.map((r) => (
                    <span
                      key={r}
                      className="inline-flex h-7 items-center rounded-full border border-white/25 bg-white/15 px-3 text-[12px] font-semibold text-white backdrop-blur-sm"
                    >
                      {r}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 text-[12.5px] text-white/75">
                    <MapPin size={13} className="shrink-0" />
                    {profile.location}
                  </span>
                  {availability.map((a) => (
                    <span
                      key={a}
                      className="inline-flex h-7 items-center gap-1.5 rounded-full border border-success/40 bg-success/20 px-2.5 text-[11.5px] font-medium text-success"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      {a}
                    </span>
                  ))}
                </div>

                {/* Short bio */}
                {(profile.bio || profile.tagline) && (
                  <p className="mt-3 max-w-2xl text-[13px] md:text-[13.5px] leading-relaxed text-white/75 line-clamp-2">
                    {profile.bio || profile.tagline}
                  </p>
                )}

                {/* Actions: Edit (owner) / Start Block (visitor) + Share */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {isMe ? (
                    <Link href="/profile/edit">
                      <Button variant="primary" size="lg" style={{ color: "#FFFFFF" }}>
                        <Pencil size={14} /> Edit Profile
                      </Button>
                    </Link>
                  ) : (
                    <StartBlockButton
                      handle={person.handle}
                      name={person.name}
                      size="lg"
                    />
                  )}
                  <ShareProfileButton handle={person.handle} name={person.name} />
                </div>
              </div>
            </div>

            {/* RIGHT — integrated Block Showcase */}
            <div className="flex min-h-[440px] md:min-h-[470px] lg:min-h-[510px] flex-col rounded-[28px] border border-white/10 bg-black/35 p-3 backdrop-blur-sm">
              <div className="mb-2.5 flex items-center justify-between px-1">
                <h2 className="font-display text-[15px] tracking-tight text-ink">
                  Block Showcase
                </h2>
                <span className="text-[10.5px] text-muted">
                  {isMe ? "Drag · pin · edit" : "Tap a tile to view"}
                </span>
              </div>
              <div className="min-h-0 flex-1">
                <BlockShowcase
                  initialItems={profile.featuredContent ?? []}
                  isOwner={isMe}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Body — a creator portfolio, not a settings dashboard ── */}
        <div className="mx-auto w-full max-w-[1320px] px-5 md:px-8 pt-9 md:pt-10 pb-12 space-y-9 animate-fade-up">
          {/* Skills & Genres — premium pills */}
          {profile.skills.length > 0 && (
            <section>
              <h2 className="font-display text-xl text-ink tracking-tight">
                Skills &amp; Genres
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center h-9 px-4 rounded-full glass-tile border border-white/10 text-[13px] font-medium text-ink/90"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Services — always shown; empty state when none yet. */}
          <section>
            <h2 className="font-display text-xl text-ink tracking-tight">
              Services
            </h2>
            {profile.services.length > 0 ? (
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {profile.services.map((s) => (
                  <div
                    key={s.title}
                    className="glass-card glass-hover flex items-center gap-3 rounded-2xl p-4"
                  >
                    <span className="h-10 w-10 rounded-xl bg-accent-2/10 border border-accent-2/30 flex items-center justify-center text-accent-2 shrink-0">
                      <Briefcase size={16} strokeWidth={1.75} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium text-ink truncate">
                        {s.title}
                      </p>
                      <p className="text-[12px] text-muted font-mono">
                        {s.price}
                      </p>
                    </div>
                    {s.slug ? (
                      <Link href={`/blocks/${s.slug}`}>
                        <Button variant="outline" size="sm">
                          View <ArrowUpRight size={12} />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm">
                        Request
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <SectionEmpty label="No services yet." />
            )}
          </section>

          {/* Demos — always shown; empty state when none yet. */}
          <section>
            <h2 className="font-display text-xl text-ink tracking-tight inline-flex items-center gap-2">
              <Headphones size={16} className="text-accent" /> Demos
            </h2>
            {tracks.length > 0 ? (
              <div className="mt-4 glass-card rounded-2xl p-5">
                <MediaPlayer tracks={tracks} />
              </div>
            ) : (
              <SectionEmpty label="No demos yet." />
            )}
          </section>

          {/* Blocks — the creator's real Blocks when they have them; otherwise
              polished, clearly-labeled SAMPLE examples (presentational only,
              never persisted) so a new profile never feels empty. */}
          {activeBlocks.length > 0 ? (
            <section>
              <h2 className="font-display text-xl text-ink tracking-tight">
                Blocks
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeBlocks.map((b) => (
                  <Link
                    key={b.id}
                    href={`/blocks/${b.slug}`}
                    className="group glass-card glass-hover flex flex-col rounded-2xl overflow-hidden"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.cover}
                        alt=""
                        className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute top-2.5 left-2.5">
                        <Badge
                          tone={
                            b.blockType === "service"
                              ? "accent-2"
                              : b.blockType === "block_party"
                                ? "warning"
                                : "accent"
                          }
                        >
                          {b.blockType === "service"
                            ? "Service"
                            : b.blockType === "block_party"
                              ? "Block Party"
                              : b.category ?? "Collaboration"}
                        </Badge>
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <p className="text-[13.5px] font-semibold text-ink tracking-tight truncate">
                        {b.title}
                      </p>
                      <p className="text-[11.5px] text-muted truncate mt-0.5">
                        {b.kind} · {b.tagline}
                      </p>
                      <div className="mt-3 pt-3 border-t border-line">
                        <div className="flex items-center justify-between text-[10.5px] text-muted mb-1.5">
                          <span>{b.completion.status}</span>
                          <span className="tabular-nums">
                            {b.completion.percent}%
                          </span>
                        </div>
                        <Progress value={b.completion.percent} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <SampleBlocks />
          )}

          {/* Block Score — a supporting credibility signal, below the showcase */}
          <section>
            <BlockScoreCard
              score={profile.blockScore}
              factors={scoreFactors}
              isNew={isNewCreator}
            />
          </section>

          {/* History */}
          {profile.credits.length > 0 && (
            <section>
              <h2 className="font-display text-xl text-ink tracking-tight">
                History
              </h2>
              <ul className="mt-4 glass-card rounded-2xl divide-y divide-white/[0.06] px-5">
                {profile.credits.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 py-3 first:pt-4 last:pb-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-ink font-medium">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-muted">{c.role}</p>
                    </div>
                    <span className="text-[11px] font-mono text-muted">
                      {c.year}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Links */}
          {(socialEntries.length > 0 || Boolean(profile.website)) && (
            <section>
              <h2 className="font-display text-xl text-ink tracking-tight">
                Links
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.website && (
                  <a
                    href={socialUrl("website", profile.website)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-full glass-tile glass-hover border border-white/10 text-[12.5px] text-ink"
                  >
                    <Globe size={14} className="text-muted" /> {profile.website}
                    <ExternalLink size={12} className="text-muted" />
                  </a>
                )}
                {socialEntries.map(([platform, value]) => (
                  <a
                    key={platform}
                    href={socialUrl(platform, value)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-full glass-tile glass-hover border border-white/10 text-[12.5px] text-ink"
                  >
                    {SOCIAL_LABEL[platform] ?? platform}
                    <ExternalLink size={12} className="text-muted" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
