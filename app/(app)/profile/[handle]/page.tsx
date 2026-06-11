import type { ReactNode } from "react";
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
import { StartBlockFlow } from "@/components/block/start-block-flow";
import { BlockScoreCard } from "@/components/creator/block-score";
import { BlockShowcase } from "@/components/creator/block-showcase";
import { ShareProfileButton } from "@/components/creator/share-profile-button";
import { ShowcaseAddButton } from "@/components/creator/showcase-add-button";
import { SampleBlocks } from "@/components/creator/sample-blocks";
import { MediaPlayer } from "@/components/creator/media-player";
import { blocksForPerson, tracksForCreator } from "@/lib/mock";
import { profileCompleteness, scoreFactorBreakdown } from "@/lib/block-score";
import { heroImageFor, realAvatar } from "@/lib/creator-image";
import {
  getBlockRelationship,
  getCreator,
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

// A premium empty-state card — centered icon + copy, with an optional action
// (e.g. an "Add Service" / "Add Demo" button for the profile owner).
function EmptyCard({
  icon,
  title,
  sub,
  action,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mt-4 glass-card rounded-2xl px-6 py-9 flex flex-col items-center text-center gap-2">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-muted">
        {icon}
      </span>
      <p className="text-[13.5px] font-medium text-ink">{title}</p>
      {sub && (
        <p className="max-w-xs text-[12px] leading-relaxed text-muted">{sub}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
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
  // Relationship drives the Start Block button's state (request sent / pending /
  // active). Only needed when viewing someone else's profile.
  const relationship = isMe ? null : await getBlockRelationship(person.handle);

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
        <section className="w-full pt-3 md:pt-4">
          {/* Side-by-side at lg+: the showcase column is a FIXED width equal to
              the banner's height, so the square 3×3 grid (whose height always
              equals its width) is exactly as tall as the cover — perfectly
              congruent, no dead space. */}
          <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-4 px-4 md:px-6 lg:grid-cols-[1fr_460px] lg:gap-4 xl:grid-cols-[1fr_520px] xl:gap-5">
            {/* LEFT — cover image + identity. Height matches the showcase column
                width (lg 460 / xl 520) so both sides are exactly the same height. */}
            <div className="relative h-[440px] md:h-[480px] lg:h-[460px] xl:h-[520px] overflow-hidden rounded-[28px] border border-white/10">
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

              {/* Identity overlay — only the essentials, sitting low at the
                  bottom-left. The gradient is concentrated in the lower portion
                  (tall transparent-to-dark fade) so the banner picture stays the
                  hero and the top stays clear. No bio / Edit / Share here. */}
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pb-5 pt-20 md:px-7 md:pb-6 md:pt-28">
                <div className="flex items-end gap-3.5">
                  {/* Profile photo */}
                  <div className="shrink-0">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt={person.name}
                        className="h-14 w-14 md:h-[68px] md:w-[68px] rounded-2xl border-2 border-white/30 object-cover shadow-lg"
                      />
                    ) : (
                      <span className="flex h-14 w-14 md:h-[68px] md:w-[68px] items-center justify-center rounded-2xl border-2 border-white/30 bg-white/15 font-display text-2xl text-white">
                        {person.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {/* Display name */}
                    <h1 className="truncate font-display text-[30px] sm:text-[40px] md:text-[46px] leading-[0.95] tracking-tight text-white drop-shadow-[0_2px_8px_rgb(0_0_0/0.45)]">
                      {person.name}
                    </h1>
                    {/* Roles · location · collaboration status */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                      {profile.roles.map((r) => (
                        <span
                          key={r}
                          className="inline-flex h-6 items-center rounded-full border border-white/25 bg-white/15 px-2.5 text-[11.5px] font-semibold text-white backdrop-blur-sm"
                        >
                          {r}
                        </span>
                      ))}
                      <span className="inline-flex items-center gap-1 text-[12px] text-white/85">
                        <MapPin size={12} className="shrink-0" />
                        {profile.location}
                      </span>
                      {availability.map((a) => (
                        <span
                          key={a}
                          className="inline-flex h-6 items-center gap-1.5 rounded-full border border-success/40 bg-success/20 px-2.5 text-[11px] font-medium text-success"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — integrated Block Showcase. Same definite height as the
                cover so the 3×3 grid aligns perfectly top and bottom with the
                banner image. The grid fills the panel edge-to-edge. */}
            {/* No outer frame — the 9 tiles sit directly in the hero so the
                showcase reads as one composition with the banner, not a box
                beside it. Capped width when stacked on small screens. */}
            <div className="mx-auto w-full max-w-[440px] lg:max-w-none">
              <BlockShowcase
                initialItems={profile.featuredContent ?? []}
                isOwner={isMe}
              />
            </div>
          </div>
        </section>

        {/* ── Bio + primary actions — a clean row directly under the banner ── */}
        <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6 pt-4 md:pt-5">
          {(profile.bio || profile.tagline) && (
            <p className="max-w-3xl text-[14px] md:text-[15px] leading-relaxed text-ink/85">
              {profile.bio || profile.tagline}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {isMe ? (
              <>
                <Link href="/profile/edit">
                  <Button
                    variant="primary"
                    size="lg"
                    style={{ color: "#FFFFFF" }}
                  >
                    <Pencil size={14} /> Edit Profile
                  </Button>
                </Link>
                <ShowcaseAddButton label="Add Content" />
              </>
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
          </div>
        </div>

        {/* ── Body — a creator portfolio, not a settings dashboard ── */}
        <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6 pt-8 md:pt-9 pb-12 space-y-9 animate-fade-up">
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
            ) : isMe ? (
              <EmptyCard
                icon={<Briefcase size={18} strokeWidth={1.75} />}
                title="Offer a service"
                sub="List a service you provide so clients can hire you directly from your profile."
                action={<ShowcaseAddButton type="service" label="Add Service" />}
              />
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
            ) : isMe ? (
              <EmptyCard
                icon={<Headphones size={18} strokeWidth={1.75} />}
                title="Showcase your sound"
                sub="Add a demo, track, or beat so collaborators can hear your work right away."
                action={<ShowcaseAddButton type="audio" label="Add Demo" />}
              />
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
