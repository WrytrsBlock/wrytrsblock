import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Briefcase,
  MapPin,
  Pencil,
  Star,
  Users,
} from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import {
  Avatar,
  Badge,
  Button,
  Card,
  SectionLabel,
} from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileActions } from "@/components/block/profile-actions";
import { blocks, blocksForPerson, getCreatorByHandle } from "@/lib/mock";
import { getCurrentProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: { handle: string };
}) {
  const data = getCreatorByHandle(params.handle);
  if (!data) notFound();
  const { person, profile } = data;
  const activeBlocks = blocksForPerson(person.id);
  // Default invite target: the viewer's first collaboration Block (demo).
  const targetBlockSlug = blocks.find(
    (b) => b.blockType === "collaboration"
  )?.slug;

  // Is this the signed-in user's own profile? If so, show Edit Profile.
  const me = await getCurrentProfile();
  const isMe = me?.handle === person.handle;

  const actions = isMe ? (
    <Link href="/settings" className="block">
      <Button variant="primary" size="lg" className="w-full">
        <Pencil size={14} /> Edit Profile
      </Button>
    </Link>
  ) : (
    <ProfileActions
      handle={person.handle}
      targetBlockSlug={targetBlockSlug}
      layout="stack"
    />
  );

  return (
    <>
      <TopBar
        crumbs={[
          { label: "Marketplace", href: "/marketplace" },
          { label: person.name },
        ]}
      />
      <div className="flex-1 overflow-y-auto">
        {/* Profile header */}
        <div className="relative border-b border-line overflow-hidden">
          <div className="absolute inset-0 bg-grad-mesh opacity-50" />
          <div className="relative px-8 pt-10 pb-7 max-w-[1100px]">
            <div className="flex items-start gap-5">
              <Avatar src={person.avatar} name={person.name} size={88} online={person.online} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-4xl text-ink tracking-tighter">
                    {person.name}
                  </h1>
                  <Badge tone="ghost">{person.role}</Badge>
                </div>
                <p className="mt-1 text-[13px] text-muted">@{person.handle}</p>
                <p className="mt-3 text-[14px] text-ink/90 max-w-xl leading-relaxed">
                  {profile.tagline}
                </p>
                <div className="mt-4 flex items-center gap-4 text-[12px] text-muted flex-wrap">
                  <span className="inline-flex items-center gap-1.5">
                    <Star size={12} className="text-warning fill-warning" />
                    <span className="text-ink font-medium">
                      {profile.rating.toFixed(1)}
                    </span>
                    ({profile.reviews} reviews)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={12} /> {profile.location}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {profile.openTo.includes("collaboration") && (
                      <Badge tone="accent">
                        <Users size={9} /> Open to collab
                      </Badge>
                    )}
                    {profile.openTo.includes("service") && (
                      <Badge tone="accent-2">
                        <Briefcase size={9} /> Offering services
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="hidden md:block shrink-0 w-[200px]">{actions}</div>
            </div>
          </div>
        </div>

        <div className="px-8 py-8 max-w-[1100px] grid grid-cols-1 lg:grid-cols-3 gap-3 animate-fade-up">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-3">
            {/* Services offered */}
            <Card className="p-6">
              <SectionLabel>Services offered</SectionLabel>
              {profile.services.length === 0 ? (
                <p className="mt-3 text-[12.5px] text-muted">
                  Not offering services right now.
                </p>
              ) : (
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
              )}
            </Card>

            {/* Portfolio */}
            <Card className="p-6">
              <SectionLabel>Portfolio</SectionLabel>
              {profile.portfolio.length === 0 ? (
                <div className="mt-3">
                  <EmptyState
                    compact
                    icon={Briefcase}
                    title="No portfolio yet"
                    className="border-0 bg-transparent"
                  />
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {profile.portfolio.map((src, i) => (
                    <div
                      key={i}
                      className="aspect-[4/3] rounded-xl overflow-hidden border border-line"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Credits */}
            <Card className="p-6">
              <SectionLabel>Credits</SectionLabel>
              <ul className="mt-4 divide-y divide-line">
                {profile.credits.map((c, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5 first:pt-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-ink font-medium">{c.title}</p>
                      <p className="text-[11px] text-muted">{c.role}</p>
                    </div>
                    <span className="text-[11px] font-mono text-muted">{c.year}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-3">
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
                          <img src={b.cover} alt="" className="h-full w-full object-cover" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-medium text-ink truncate">
                            {b.title}
                          </p>
                          <p className="text-[10.5px] text-muted">
                            {b.blockType === "service" ? "Service" : "Collaboration"}
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

            <div className="md:hidden">{actions}</div>
          </div>
        </div>
      </div>
    </>
  );
}
