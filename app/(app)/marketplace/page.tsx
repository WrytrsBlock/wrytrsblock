import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Check,
  MapPin,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  Input,
  SectionLabel,
} from "@/components/ui/primitives";
import { InviteToBlockButton } from "@/components/block/invite-to-block-button";
import { getBlocksByType } from "@/lib/data";
import { blocks, featuredCreators, getPerson } from "@/lib/mock";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  // Creators is the default — Marketplace is talent discovery first.
  const view =
    searchParams.view === "opportunities" || searchParams.view === "services"
      ? searchParams.view
      : "creators";

  const [collabs, services] = await Promise.all([
    getBlocksByType("collaboration"),
    getBlocksByType("service"),
  ]);
  const creators = featuredCreators();
  // Default invite target: the viewer's first collaboration Block (demo).
  const targetBlockSlug = blocks.find(
    (b) => b.blockType === "collaboration"
  )?.slug;

  const tabs = [
    { id: "creators", label: "Creators", count: creators.length },
    { id: "opportunities", label: "Opportunities", count: collabs.length },
    { id: "services", label: "Services", count: services.length },
  ];

  return (
    <>
      <TopBar crumbs={[{ label: "Inkwell Studio" }, { label: "Marketplace" }]} />
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-8 max-w-[1280px] w-full animate-fade-up">
          {/* Header */}
          <div className="mb-6">
            <SectionLabel>Talent discovery</SectionLabel>
            <h1 className="mt-2 font-display text-4xl text-ink tracking-tighter">
              Who can help you make it?
            </h1>
            <p className="text-[13px] text-muted mt-1.5 max-w-xl">
              Discover creators, then bring them into a Block. Browse open
              opportunities and bookable services too.
            </p>
          </div>

          {/* AI brief */}
          <Card className="p-5 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-grad-mesh opacity-50" />
            <div className="relative flex items-center gap-4">
              <span className="h-10 w-10 rounded-lg bg-grad-accent flex items-center justify-center text-bg shadow-glow shrink-0">
                <Sparkles size={16} strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-ink">
                  Describe who you need
                </p>
                <p className="text-[11.5px] text-muted mt-0.5">
                  &ldquo;A producer and a vocalist for an indie pop single&rdquo;
                  — Blocky matches creators to your brief.
                </p>
              </div>
              <Button variant="primary" size="md">
                Find creators
              </Button>
            </div>
          </Card>

          {/* Search + tabs */}
          <div className="flex items-center gap-2 mb-5">
            <div className="relative min-w-[300px]">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <Input
                placeholder="Search creators, skills, services…"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-0.5 ml-2 p-0.5 rounded-lg bg-surface-2 border border-line">
              {tabs.map((t) => {
                const active = t.id === view;
                return (
                  <Link
                    key={t.id}
                    href={
                      t.id === "creators"
                        ? "/marketplace"
                        : `/marketplace?view=${t.id}`
                    }
                    className={
                      active
                        ? "inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-surface text-ink text-[11.5px] font-medium shadow-soft"
                        : "inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-muted hover:text-ink text-[11.5px] transition-colors"
                    }
                  >
                    {t.label}
                    <span className="text-[10px] font-mono text-muted">
                      {t.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Results — Creators first */}
          {view === "creators" && (
            <CreatorGrid creators={creators} targetBlockSlug={targetBlockSlug} />
          )}
          {view === "opportunities" && <CollabGrid blocks={collabs} />}
          {view === "services" && <ServiceGrid blocks={services} />}
        </div>
      </div>
    </>
  );
}

// ---- Creators (primary) --------------------------------------------------

function CreatorGrid({
  creators,
  targetBlockSlug,
}: {
  creators: ReturnType<typeof featuredCreators>;
  targetBlockSlug?: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {creators.map(({ person, profile }) => (
        <Card key={person.id} className="p-5 flex flex-col">
          {/* Identity */}
          <div className="flex items-start gap-3">
            <Avatar
              src={person.avatar}
              name={person.name}
              size={52}
              online={person.online}
            />
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${person.handle}`}
                className="text-[15px] font-semibold text-ink tracking-tight hover:text-accent transition-colors"
              >
                {person.name}
              </Link>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <Star size={10} className="text-warning fill-warning" />
                  <span className="text-ink font-medium">
                    {profile.rating.toFixed(1)}
                  </span>
                  ({profile.reviews})
                </span>
                <span className="text-muted/50">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={10} /> {profile.location}
                </span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.skills.slice(0, 4).map((s) => (
              <Badge key={s} tone="soft">
                {s}
              </Badge>
            ))}
          </div>

          {/* Availability */}
          <div className="mt-3 space-y-1.5">
            {profile.openTo.includes("collaboration") && (
              <p className="inline-flex items-center gap-1.5 text-[11.5px] text-success mr-3">
                <Check size={12} strokeWidth={2.5} /> Available for collaboration
              </p>
            )}
            {profile.openTo.includes("service") && (
              <p className="inline-flex items-center gap-1.5 text-[11.5px] text-accent-2">
                <Check size={12} strokeWidth={2.5} /> Available for hire
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-line flex items-center gap-2">
            <Link href={`/profile/${person.handle}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                View Profile <ArrowUpRight size={12} />
              </Button>
            </Link>
            <InviteToBlockButton
              handle={person.handle}
              targetBlockSlug={targetBlockSlug}
              className="flex-1"
            />
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---- Opportunities (Collaboration Blocks seeking talent) -----------------

function CollabGrid({ blocks }: { blocks: import("@/lib/mock").Block[] }) {
  if (blocks.length === 0) {
    return (
      <p className="text-[13px] text-muted py-10 text-center">
        No open opportunities right now.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {blocks.map((b) => {
        const lead = getPerson(b.leadId);
        return (
          <Link key={b.id} href={`/blocks/${b.slug}`} className="group block">
            <Card hover className="overflow-hidden p-0">
              <div className="relative h-36 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.cover}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 ease group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-grad-cinema" />
                <div className="absolute left-4 top-3">
                  <Badge tone="accent" dot>
                    Seeking collaborators
                  </Badge>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-2xl text-ink leading-tight tracking-tight">
                  {b.title}
                </h3>
                <p className="mt-1.5 text-[12.5px] text-muted line-clamp-2 leading-relaxed">
                  {b.tagline}
                </p>
                {b.seeking && b.seeking.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {b.seeking.map((s) => (
                      <Badge key={s} tone="soft">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between pt-4 border-t border-line">
                  <AvatarStack
                    ids={b.team}
                    size={22}
                    max={4}
                    resolve={(id) => getPerson(id)}
                  />
                  <span className="text-[11px] text-muted">
                    Lead · {lead?.name.split(" ")[0]}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// ---- Services ------------------------------------------------------------

function ServiceGrid({ blocks }: { blocks: import("@/lib/mock").Block[] }) {
  if (blocks.length === 0) {
    return (
      <p className="text-[13px] text-muted py-10 text-center">
        No services listed yet.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {blocks.map((b) => {
        const provider = getPerson(b.service?.providerId ?? b.leadId);
        return (
          <Link key={b.id} href={`/blocks/${b.slug}`} className="group block">
            <Card hover className="overflow-hidden p-0">
              <div className="relative h-36 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.cover}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 ease group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-grad-cinema" />
                <div className="absolute left-4 top-3">
                  <Badge tone="accent-2">
                    <Briefcase size={9} /> Service
                  </Badge>
                </div>
                {provider && (
                  <div className="absolute left-4 bottom-3 flex items-center gap-2">
                    <Avatar
                      src={provider.avatar}
                      name={provider.name}
                      size={26}
                      ring
                    />
                    <span className="text-[12px] text-ink font-medium">
                      {provider.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl text-ink leading-tight tracking-tight">
                  {b.title}
                </h3>
                <p className="mt-1.5 text-[12.5px] text-muted line-clamp-2 leading-relaxed">
                  {b.tagline}
                </p>
                <div className="mt-4 flex items-center justify-between pt-4 border-t border-line">
                  <span className="text-[12.5px] font-mono text-ink">
                    {b.service?.price ?? "—"}
                  </span>
                  <span className="text-[11px] text-muted">
                    {b.service?.turnaround}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
