import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Briefcase,
  ExternalLink,
  Globe,
  Headphones,
  MapPin,
  Pencil,
} from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import { Avatar, Badge, Button, Progress } from "@/components/ui/primitives";
import { StartBlockButton } from "@/components/block/start-block-button";
import { BlockScoreCard } from "@/components/creator/block-score";
import { FeaturedContent } from "@/components/creator/featured-content";
import { MediaPlayer } from "@/components/creator/media-player";
import { blocksForPerson, tracksForCreator } from "@/lib/mock";
import { profileCompleteness, scoreFactorBreakdown } from "@/lib/block-score";
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
  const bannerImg = profile.banner ?? profile.portfolio[0];

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
  const collaborators = profile.reviews; // placeholder proxy until tracked
  const ratingDisplay =
    profile.reviews >= 3 ? profile.rating.toFixed(1) : "New";
  const isNewCreator = completedBlocks === 0 && profile.reviews < 3;

  const socialEntries = Object.entries(profile.socials).filter(
    ([, v]) => v
  ) as [string, string][];

  const availability: string[] = [];
  if (profile.openTo.includes("collaboration"))
    availability.push("Open to Collaboration");
  if (profile.openTo.includes("service")) availability.push("Open to Services");

  const stats = [
    { value: completedBlocks, label: "Completed Blocks" },
    { value: collaborators, label: "Collaborators" },
    { value: ratingDisplay, label: "Rating" },
  ];

  return (
    <>
      <TopBar
        crumbs={[
          { label: "Block Market", href: "/marketplace" },
          { label: person.name },
        ]}
      />
      <div className="flex-1 overflow-y-auto">
        {/* ── Creator hero — full-width cover + frosted-glass identity overlay ── */}
        <section className="relative w-full">
          <div className="relative h-[360px] sm:h-[440px] md:h-[500px] w-full overflow-hidden">
            {bannerImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerImg}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-grad-accent" />
            )}
            {/* Top scrim so the breadcrumb stays legible */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent" />

            {/* Frosted glass identity overlay — same language as the cards */}
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/50 to-black/10 backdrop-blur-md border-t border-white/15 shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]">
              <div className="mx-auto max-w-[1100px] px-5 md:px-8 py-5 md:py-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  {/* Identity */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-3.5">
                      <Avatar
                        src={person.avatar}
                        name={person.name}
                        size={76}
                        online={person.online}
                        className="shrink-0 border-2 border-white/30 shadow-glow"
                      />
                      <div className="min-w-0">
                        <h1 className="font-display text-[28px] sm:text-[38px] md:text-[44px] text-white leading-[1.0] tracking-tight truncate">
                          {person.name}
                        </h1>
                        <p className="mt-0.5 text-[12.5px] text-white/60">
                          @{person.handle}
                        </p>
                      </div>
                    </div>

                    {/* Role · location · availability */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      {profile.roles.map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center h-7 px-3 rounded-full bg-white/15 border border-white/25 text-white text-[12px] font-semibold backdrop-blur-sm"
                        >
                          {r}
                        </span>
                      ))}
                      <span className="inline-flex items-center gap-1 text-[12.5px] text-white/70">
                        <MapPin size={13} className="shrink-0" />
                        {profile.location}
                      </span>
                      {availability.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-success/20 border border-success/40 text-success text-[11.5px] font-medium"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          {a}
                        </span>
                      ))}
                    </div>

                    {/* Bio */}
                    {(profile.bio || profile.tagline) && (
                      <p className="mt-3 text-[13px] md:text-[13.5px] text-white/75 leading-relaxed max-w-2xl line-clamp-2">
                        {profile.bio || profile.tagline}
                      </p>
                    )}
                  </div>

                  {/* CTA + stats */}
                  <div className="shrink-0 flex flex-col items-start md:items-end gap-4">
                    {isMe ? (
                      <Link href="/profile/edit">
                        <Button
                          variant="primary"
                          size="lg"
                          style={{ color: "#FFFFFF" }}
                        >
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

                    <div className="flex items-center gap-5 md:gap-7">
                      {stats.map((s) => (
                        <div key={s.label} className="text-left md:text-right">
                          <div className="font-display text-[24px] md:text-[28px] text-white tabular-nums leading-none">
                            {s.value}
                          </div>
                          <div className="mt-1.5 text-[9.5px] uppercase tracking-[0.1em] text-white/55">
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Body — a creator portfolio, not a settings dashboard ── */}
        <div className="px-5 md:px-8 pt-7 md:pt-8 pb-12 max-w-[1100px] w-full space-y-9 animate-fade-up">
          {/* Featured Content — first thing visitors see */}
          <FeaturedContent items={profile.featuredContent ?? []} isOwner={isMe} />

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

          {/* Block Score — premium match/score card (breakdown tucked inside) */}
          <section>
            <BlockScoreCard
              score={profile.blockScore}
              factors={scoreFactors}
              isNew={isNewCreator}
            />
          </section>

          {/* Services */}
          {profile.services.length > 0 && (
            <section>
              <h2 className="font-display text-xl text-ink tracking-tight">
                Services
              </h2>
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
            </section>
          )}

          {/* Demos */}
          {tracks.length > 0 && (
            <section>
              <h2 className="font-display text-xl text-ink tracking-tight inline-flex items-center gap-2">
                <Headphones size={16} className="text-accent" /> Demos
              </h2>
              <div className="mt-4 glass-card rounded-2xl p-5">
                <MediaPlayer tracks={tracks} />
              </div>
            </section>
          )}

          {/* Blocks — the creator's public Blocks */}
          {activeBlocks.length > 0 && (
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
          )}

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
