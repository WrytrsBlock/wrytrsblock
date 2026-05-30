import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Briefcase,
  ExternalLink,
  Globe,
  MapPin,
  Pencil,
} from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import {
  Avatar,
  Badge,
  Button,
  Card,
  SectionLabel,
} from "@/components/ui/primitives";
import { CreatorActions } from "@/components/block/creator-actions";
import { BlockScore, BlockScoreCard } from "@/components/creator/block-score";
import { blocksForPerson, getCreatorByHandle } from "@/lib/mock";
import {
  profileCompleteness,
  scoreFactorBreakdown,
} from "@/lib/block-score";
import { getCurrentProfile } from "@/lib/data";

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
  const data = getCreatorByHandle(params.handle);
  if (!data) notFound();
  const { person, profile } = data;
  const activeBlocks = blocksForPerson(person.id);

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

  const actions = isMe ? (
    <Link href="/settings">
      <Button variant="primary" size="md">
        <Pencil size={13} /> Edit Profile
      </Button>
    </Link>
  ) : (
    <CreatorActions handle={person.handle} />
  );

  const socialEntries = Object.entries(profile.socials).filter(
    ([, v]) => v
  ) as [string, string][];

  return (
    <>
      <TopBar
        crumbs={[
          { label: "Marketplace", href: "/marketplace" },
          { label: person.name },
        ]}
      />
      <div className="flex-1 overflow-y-auto">
        {/* Banner */}
        <div className="relative h-40 md:h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.banner}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
        </div>

        {/* Identity */}
        <div className="px-6 md:px-8 max-w-[1100px]">
          <div className="-mt-12 md:-mt-16 relative flex flex-col md:flex-row md:items-end gap-4">
            <Avatar
              src={person.avatar}
              name={person.name}
              size={104}
              className="!ring-4 !ring-bg shadow-pop"
            />
            <div className="flex-1 min-w-0 md:pb-2">
              <h1 className="font-display text-4xl text-ink tracking-tighter">
                {person.name}
              </h1>
              <p className="mt-1 text-[12.5px] text-muted">@{person.handle}</p>
            </div>
            <div className="md:pb-2 shrink-0">{actions}</div>
          </div>

          {/* Roles */}
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            {profile.roles.map((r) => (
              <Badge key={r} tone="accent">
                {r}
              </Badge>
            ))}
          </div>

          {/* Block Score — the headline trust signal */}
          <div className="mt-3 flex items-center gap-4 flex-wrap">
            <BlockScore score={profile.blockScore} size="md" showLabel />
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
              <MapPin size={13} /> {profile.location}
            </span>
            {profile.openTo.includes("collaboration") && (
              <span className="text-[11.5px] text-success">
                Available for collaboration
              </span>
            )}
            {profile.openTo.includes("service") && (
              <span className="text-[11.5px] text-accent-2">· for hire</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 md:px-8 py-8 max-w-[1100px] grid grid-cols-1 lg:grid-cols-3 gap-3 animate-fade-up">
          {/* Left */}
          <div className="lg:col-span-2 space-y-3">
            {/* Bio */}
            <Card className="p-6">
              <SectionLabel>About</SectionLabel>
              <p className="mt-3 text-[14px] text-ink/90 leading-[1.7]">
                {profile.bio || profile.tagline}
              </p>
              {profile.website && (
                <a
                  href={socialUrl("website", profile.website)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-accent hover:text-accent-2 transition-colors"
                >
                  <Globe size={13} /> {profile.website}
                </a>
              )}
            </Card>

            {/* Portfolio */}
            {(profile.portfolio.length > 0 ||
              profile.portfolioLinks.length > 0) && (
              <Card className="p-6">
                <SectionLabel>Portfolio</SectionLabel>
                {profile.portfolio.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {profile.portfolio.map((src, i) => (
                      <div
                        key={i}
                        className="aspect-[4/3] rounded-xl overflow-hidden border border-line"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {profile.portfolioLinks.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.portfolioLinks.map((l) => (
                      <a
                        key={l.url}
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-line text-[12px] text-ink hover:bg-surface-2 hover:border-line-strong transition-all"
                      >
                        {l.label} <ExternalLink size={11} className="text-muted" />
                      </a>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Services offered */}
            {profile.services.length > 0 && (
              <Card className="p-6">
                <SectionLabel>Services offered</SectionLabel>
                <div className="mt-4 space-y-2.5">
                  {profile.services.map((s) => (
                    <div
                      key={s.title}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4"
                    >
                      <span className="h-9 w-9 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-accent shrink-0">
                        <Briefcase size={15} strokeWidth={1.75} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-ink">
                          {s.title}
                        </p>
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

            {/* Credits */}
            {profile.credits.length > 0 && (
              <Card className="p-6">
                <SectionLabel>Credits</SectionLabel>
                <ul className="mt-4 divide-y divide-line">
                  {profile.credits.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 py-2.5 first:pt-0"
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
              </Card>
            )}
          </div>

          {/* Right */}
          <div className="space-y-3">
            <BlockScoreCard score={profile.blockScore} factors={scoreFactors} />

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

            {socialEntries.length > 0 && (
              <Card className="p-6">
                <SectionLabel>Links</SectionLabel>
                <div className="mt-3 flex flex-col gap-1.5">
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

            <Card className="p-6">
              <SectionLabel>Active Blocks</SectionLabel>
              {activeBlocks.length === 0 ? (
                <p className="mt-3 text-[12.5px] text-muted">No active Blocks.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {activeBlocks.map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/blocks/${b.slug}`}
                        className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 hover:border-line-strong transition-colors group"
                      >
                        <span className="h-9 w-9 rounded-lg overflow-hidden border border-line shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={b.cover}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-medium text-ink truncate">
                            {b.title}
                          </p>
                          <p className="text-[10.5px] text-muted">
                            {b.blockType === "service"
                              ? "Service"
                              : "Collaboration"}
                          </p>
                        </div>
                        <ArrowUpRight
                          size={13}
                          className="text-muted group-hover:text-ink transition-colors"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
