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
import { Badge, Button } from "@/components/ui/primitives";
import { StartBlockFlow } from "@/components/block/start-block-flow";
import { BlockShowcase } from "@/components/creator/block-showcase";
import { BlockCover } from "@/components/block/block-cover";
import { ShareProfileButton } from "@/components/creator/share-profile-button";
import { ShowcaseAddButton } from "@/components/creator/showcase-add-button";
import { MediaPlayer } from "@/components/creator/media-player";
import { NetworkStats } from "@/components/creator/network-stats";
import { MutualCreators } from "@/components/creator/mutual-creators";
import { WorkedWith } from "@/components/creator/worked-with";
import { tracksForCreator } from "@/lib/mock";
import { mutualCreators } from "@/lib/network";
import { lgAvColor } from "@/lib/lg";
import { heroImageFor, realAvatar } from "@/lib/creator-image";
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

const STATUS_LABEL: Record<string, string> = {
  open: "Recruiting",
  active: "Active",
  in_review: "In review",
  completed: "Completed",
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

  // Collaboration-first reputation, derived from the creator's REAL Blocks and
  // co-collaborators (Supabase; mock graph in demo mode) — not a gamified score.
  const collab = await getCreatorCollab(person.id);
  const network = {
    creatorsConnected: collab.collaborators,
    completedBlocks: collab.completedBlocks,
    totalBlocks: collab.totalBlocks,
    completionRate: collab.completionRate,
  };
  // What they're working on now (everything not yet completed).
  const activeBlocks = collab.blocks.filter(
    (b) => b.completionStatus !== "completed"
  );
  // Mutual creators between the viewer and this profile (identities only).
  const mutual = me && !isMe ? mutualCreators(me.id, person.id) : [];

  const socialEntries = Object.entries(profile.socials).filter(
    ([, v]) => v
  ) as [string, string][];

  const availability: string[] = [];
  if (profile.openTo.includes("collaboration"))
    availability.push("Open to Collaboration");
  if (profile.openTo.includes("service")) availability.push("Open to Services");

  // Conditional sections — a section renders only when it has content, so the
  // layout reflows cleanly with no empty cards or placeholders. The owner always
  // sees the Showcase (to curate it); visitors see it only when it has tiles.
  const hasFeatured = (profile.featuredContent?.length ?? 0) > 0;
  const showShowcase = hasFeatured || isMe;
  const showTrust = network.totalBlocks > 0 || mutual.length > 0;

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
        {/* Page title — matches My Blocks / Block Market */}
        <div className="page-fluid pt-8 md:pt-10">
          <h1 className="font-display text-4xl md:text-5xl text-white tracking-tight">
            Profile
          </h1>
        </div>
        {/* ── Identity banner — the cover with a floating glass identity panel.
            The Block Showcase sits beside it only when there's content (or you
            own the profile); otherwise the cover spans full width. ── */}
        <section className="w-full pt-4">
          <div
            className={
              showShowcase
                ? "page-fluid grid grid-cols-1 gap-[13px] lg:grid-cols-[1fr_minmax(320px,480px)]"
                : "page-fluid"
            }
          >
            {/* LEFT — cover + floating glass identity panel */}
            <div className="relative min-h-[280px] overflow-hidden rounded-[18px] border border-white/[0.14]">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  alt={person.name}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(160deg,#26345C_0%,#1A2440_45%,#101524_100%)]" />
              )}
              {/* Scrim — keeps the identity panel legible over bright covers */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
              />
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

              {/* Identity — dark liquid-glass panel pinned to the bottom, so the
                  name + roles stay high-contrast over any cover image */}
              <div className="absolute inset-x-[11px] bottom-[11px] z-10 rounded-[18px] border border-white/20 border-t-white/30 bg-[rgba(9,11,16,0.62)] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                <div className="flex items-center gap-3 px-[15px] py-[13px]">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt={person.name}
                      className="h-12 w-12 shrink-0 rounded-[14px] border border-white/35 object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-white/35 text-[18px] font-semibold text-white"
                      style={{ background: lgAvColor(person.name) }}
                    >
                      {person.name.slice(0, 1)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="truncate text-[22px] md:text-[25px] font-semibold leading-[1.05] text-white drop-shadow-[0_1px_4px_rgb(0_0_0/0.5)]">
                      {person.name}
                    </h1>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {profile.roles.map((r) => (
                        <span key={r} className="lg-pill lg-pill-w">
                          {r}
                        </span>
                      ))}
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-white/75">
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
                </div>
              </div>
            </div>

            {/* RIGHT — the 3×3 Block Showcase grid (only when shown) */}
            {showShowcase && (
              <div className="mx-auto w-full max-w-[440px] lg:max-w-none">
                <BlockShowcase
                  initialItems={profile.featuredContent ?? []}
                  isOwner={isMe}
                />
              </div>
            )}
          </div>
        </section>

        {/* ── Bio + primary actions ── */}
        <div className="page-fluid pt-4">
          {(profile.bio || profile.tagline) && (
            <p className="mb-[11px] max-w-[500px] text-[13px] leading-relaxed text-white/[0.62]">
              {profile.bio || profile.tagline}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-[9px]">
            {isMe ? (
              <>
                <Link href="/profile/edit" className="lg-btn lg-btn-p">
                  <Pencil size={14} /> Edit Profile
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

          {/* ── Trust & network — collaboration-first reputation. Hidden until
              there's real history, so new profiles stay clean. ── */}
          {showTrust && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {network.totalBlocks > 0 && <NetworkStats network={network} />}
              {!isMe && <MutualCreators mutual={mutual} />}
            </div>
          )}
        </div>

        {/* ── Body — every section renders only when it has content ── */}
        <div className="page-fluid pt-8 md:pt-9 pb-14 space-y-9 animate-fade-up">
          {/* Skills & Genres */}
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

          {/* Active Blocks — what this creator is working on now (real data) */}
          {activeBlocks.length > 0 && (
            <section>
              <h2 className="font-display text-xl text-ink tracking-tight">
                Active Blocks
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeBlocks.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/blocks/${b.slug}`}
                    className="group glass-card glass-hover flex flex-col rounded-2xl overflow-hidden"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <BlockCover src={b.cover} type={b.blockType} />
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
                              : "Collaboration"}
                        </Badge>
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <p className="text-[13.5px] font-semibold text-ink tracking-tight truncate">
                        {b.title}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-[11.5px] text-white/55">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#7BEDC4]" />
                        {STATUS_LABEL[b.completionStatus] ?? b.completionStatus}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Worked With — the creators behind the collaboration count */}
          <WorkedWith collaborators={collab.collaborators} />

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
