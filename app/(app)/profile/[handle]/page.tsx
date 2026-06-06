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
import {
  Avatar,
  Badge,
  Button,
  Card,
  Progress,
  SectionLabel,
} from "@/components/ui/primitives";
import { CreatorActions } from "@/components/block/creator-actions";
import { StartBlockButton } from "@/components/block/start-block-button";
import { BlockScoreCard } from "@/components/creator/block-score";
import { FeaturedContent } from "@/components/creator/featured-content";
import { MediaPlayer } from "@/components/creator/media-player";
import { ProfileTabs } from "@/components/creator/profile-tabs";
import {
  blocksForPerson,
  tracksForCreator,
} from "@/lib/mock";
import {
  profileCompleteness,
  scoreFactorBreakdown,
} from "@/lib/block-score";
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
  const firstName = person.name.split(" ")[0];
  // Creator-uploaded banner (falls back to a portfolio image).
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

  // Social-proof stats — placeholders where not yet tracked.
  const completedBlocks = activeBlocks.length;
  const collaborators = profile.reviews; // placeholder proxy until tracked
  const ratingDisplay =
    profile.reviews >= 3 ? profile.rating.toFixed(1) : "New";

  // A creator with no completed Blocks and no meaningful ratings is "new" — we
  // surface a "Building Reputation" state instead of a punishing 0 / 1000.
  const isNewCreator = completedBlocks === 0 && profile.reviews < 3;

  const socialEntries = Object.entries(profile.socials).filter(
    ([, v]) => v
  ) as [string, string][];

  // ── Profile tab content — a single, mobile-first column in priority order:
  // Skills → Featured Work → Demos → Services → Block Score → History → Links.
  // Every section is hidden when it has no content (no empty placeholders).
  const profileSlot = (
    <div className="max-w-[820px] space-y-4">
      {/* Skills — directly below the bio, above Featured Work */}
      {profile.skills.length > 0 && (
        <Card className="p-6">
          <SectionLabel>Skills</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <Badge key={s} tone="soft">
                {s}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Featured Content — the creator's curated showcase (above About/Services) */}
      <FeaturedContent
        items={profile.featuredContent ?? []}
        isOwner={isMe}
      />

      {/* Demos — audio. Hidden when the creator has none. */}
      {tracks.length > 0 && (
        <Card className="p-6">
          <SectionLabel className="flex items-center gap-1.5">
            <Headphones size={11} className="text-accent" /> Demos
          </SectionLabel>
          <div className="mt-4">
            <MediaPlayer tracks={tracks} />
          </div>
        </Card>
      )}

      {/* Services offered — hidden when the creator lists none */}
      {profile.services.length > 0 && (
        <Card className="p-6">
          <SectionLabel>Services</SectionLabel>
          <div className="mt-4 space-y-2.5">
            {profile.services.map((s) => (
              <div
                key={s.title}
                className="glass-card flex items-center gap-3 rounded-xl p-4"
              >
                <span className="h-9 w-9 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-accent shrink-0">
                  <Briefcase size={15} strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink">{s.title}</p>
                  <p className="text-[11.5px] text-muted font-mono">
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
        </Card>
      )}

      {/* Block Score — default shows score + rank + progress (analytics hidden) */}
      <BlockScoreCard
        score={profile.blockScore}
        factors={scoreFactors}
        isNew={isNewCreator}
      />

      {/* History — past credits. Hidden when empty. */}
      {profile.credits.length > 0 && (
        <Card className="p-6">
          <SectionLabel>History</SectionLabel>
          <ul className="mt-4 divide-y divide-line">
            {profile.credits.map((c, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5 first:pt-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-ink font-medium">{c.title}</p>
                  <p className="text-[11px] text-muted">{c.role}</p>
                </div>
                <span className="text-[11px] font-mono text-muted">
                  {c.year}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Links — socials + website. Hidden when there are none. */}
      {(socialEntries.length > 0 || Boolean(profile.website)) && (
        <Card className="p-6">
          <SectionLabel>Links</SectionLabel>
          <div className="mt-3 flex flex-col gap-1.5">
            {profile.website && (
              <a
                href={socialUrl("website", profile.website)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between h-9 px-3 rounded-lg border border-line text-[12.5px] text-ink hover:bg-surface-2 hover:border-line-strong transition-all group"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Globe size={13} className="text-muted" /> {profile.website}
                </span>
                <ExternalLink
                  size={12}
                  className="text-muted group-hover:text-ink"
                />
              </a>
            )}
            {socialEntries.map(([platform, value]) => (
              <a
                key={platform}
                href={socialUrl(platform, value)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between h-9 px-3 rounded-lg border border-line text-[12.5px] text-ink hover:bg-surface-2 hover:border-line-strong transition-all group"
              >
                <span>{SOCIAL_LABEL[platform] ?? platform}</span>
                <ExternalLink
                  size={12}
                  className="text-muted group-hover:text-ink"
                />
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  // ── Blocks tab content (the creator's Blocks as a discovery grid) ──
  const blocksSlot =
    activeBlocks.length === 0 ? (
      <Card className="p-10 text-center">
        <p className="text-[14px] text-ink font-medium">No Blocks yet</p>
        <p className="text-[12.5px] text-muted mt-1">
          {firstName} hasn&apos;t started any public Blocks.
        </p>
        {!isMe && (
          <div className="mt-4 flex justify-center">
            <CreatorActions handle={person.handle} name={person.name} />
          </div>
        )}
      </Card>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
              <span className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
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
                  <span className="tabular-nums">{b.completion.percent}%</span>
                </div>
                <Progress value={b.completion.percent} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    );

  return (
    <>
      <TopBar
        crumbs={[
          { label: "Block Market", href: "/marketplace" },
          { label: person.name },
        ]}
      />
      <div className="flex-1 overflow-y-auto">
        {/* ── Banner + overlapping identity (liquid glass hero) ── */}
        <div className="relative">
          {/* Banner image */}
          <div className="relative h-44 sm:h-60 md:h-72 w-full overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
          </div>

          {/* Identity glass card overlapping the banner */}
          <div className="px-4 md:px-8 max-w-[1100px]">
            <div className="glass-card glass-glow relative -mt-16 md:-mt-20 rounded-3xl px-5 md:px-8 pb-6 md:pb-7">
              {/* Profile photo — overlaps the banner edge */}
              <Avatar
                src={person.avatar}
                name={person.name}
                size={120}
                online={person.online}
                className="-mt-14 md:-mt-16 border-4 border-bg shadow-glow"
              />

              <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  {/* Creator name — primary focus */}
                  <h1 className="font-display text-[34px] md:text-[52px] text-ink leading-[1.02] tracking-tight">
                    {person.name}
                  </h1>
                  <p className="mt-1 text-[13px] text-muted">@{person.handle}</p>

                  {/* Creator types — prominent pills */}
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {profile.roles.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center h-8 px-3.5 rounded-full bg-accent/15 border border-accent/40 text-accent text-[13px] font-semibold"
                      >
                        {r}
                      </span>
                    ))}
                  </div>

                  {/* Location */}
                  <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-muted">
                    <MapPin size={14} /> {profile.location}
                    {profile.openTo.includes("collaboration") && (
                      <span className="ml-1.5 text-[12px] text-success">
                        · Available for collaboration
                      </span>
                    )}
                  </p>

                  {/* Bio */}
                  {(profile.bio || profile.tagline) && (
                    <p className="mt-3.5 text-[14px] text-ink/85 leading-relaxed max-w-2xl">
                      {profile.bio || profile.tagline}
                    </p>
                  )}
                </div>

                {/* CTA — Start Block sends a Block Request (no pre-collab DMs) */}
                <div className="shrink-0 flex items-center gap-2">
                  {isMe ? (
                    <Link href="/profile/edit">
                      <Button variant="primary" size="lg">
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
                </div>
              </div>

              {/* Social proof — placeholders where not yet tracked */}
              <div className="mt-6 grid grid-cols-3 max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md divide-x divide-white/[0.06] overflow-hidden">
                {[
                  { value: completedBlocks, label: "Completed Blocks" },
                  { value: collaborators, label: "Collaborators" },
                  { value: ratingDisplay, label: "Rating" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col items-center justify-center py-3.5 px-2 text-center"
                  >
                    <span className="text-[18px] font-bold text-ink tabular-nums leading-none">
                      {s.value}
                    </span>
                    <span className="mt-1 text-[10.5px] text-muted">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Body — Profile / Blocks tabs (Featured Work lives in the Profile tab) */}
        <div className="px-5 md:px-8 pt-7 pb-10 max-w-[1100px] animate-fade-up">
          <ProfileTabs
            blocksCount={activeBlocks.length}
            profileSlot={profileSlot}
            blocksSlot={blocksSlot}
          />
        </div>
      </div>
    </>
  );
}
