import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Inbox,
  Store,
  User,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import {
  Avatar,
  AvatarStack,
  Badge,
  Card,
  Progress,
  SectionLabel,
} from "@/components/ui/primitives";
import { NewBlockButton } from "@/components/block/new-block-button";
import { getBlocks, getCurrentProfile } from "@/lib/data";
import { getPerson } from "@/lib/mock";

const pendingInvites = [
  { id: "i1", block: "Neon Rain — Single", role: "Producer", fromId: "p4", at: "2h" },
  { id: "i2", block: "Halftone", role: "Composer", fromId: "p1", at: "1d" },
];

export default async function HomePage() {
  const [me, blocks] = await Promise.all([getCurrentProfile(), getBlocks()]);
  const firstName = (me?.name ?? "Friend").split(" ")[0];

  const recentMessages = blocks
    .flatMap((b) => b.threads.map((t) => ({ ...t, block: b.title, slug: b.slug })))
    .slice(0, 4);

  return (
    <>
      <TopBar crumbs={[{ label: "Inkwell Studio" }, { label: "Home" }]} />
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-8 max-w-[1280px] w-full space-y-6 animate-fade-up">
          {/* Greeting + create actions */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionLabel>Welcome back</SectionLabel>
              <h1 className="mt-2 font-display text-4xl text-ink tracking-tighter">
                Good to see you, {firstName}.
              </h1>
              <p className="text-[13px] text-muted mt-1.5">
                Pick up where you left off, or start something new.
              </p>
              <Link
                href={`/profile/${me?.handle ?? ""}`}
                className="mt-3 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-line text-[12px] text-ink hover:bg-surface-2 hover:border-line-strong transition-all"
              >
                <User size={12} /> View / Edit My Profile
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <NewBlockButton
                type="collaboration"
                label="New Collaboration"
                variant="primary"
                size="md"
              />
              <NewBlockButton
                type="service"
                label="New Service"
                variant="outline"
                size="md"
              />
            </div>
          </div>

          {/* Create + Marketplace strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CreateCard
              icon={Users}
              title="Collaboration Block"
              body="I need talent for a project."
              type="collaboration"
            />
            <CreateCard
              icon={Briefcase}
              title="Service Block"
              body="I'm offering a service."
              type="service"
            />
            <Link href="/marketplace" className="group block">
              <Card hover className="p-5 h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-grad-mesh opacity-50" />
                <div className="relative">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 border border-line text-accent">
                    <Store size={18} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 text-[14px] font-semibold text-ink tracking-tight">
                    Browse the Marketplace
                  </h3>
                  <p className="mt-1 text-[12px] text-muted leading-relaxed">
                    Find collaborators, services, and opportunities.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-accent group-hover:gap-1.5 transition-all">
                    Open Marketplace <ArrowUpRight size={11} />
                  </span>
                </div>
              </Card>
            </Link>
          </div>

          {/* My Active Blocks */}
          <section>
            <div className="flex items-end justify-between mb-3">
              <h2 className="font-display text-2xl text-ink tracking-tight">
                My active Blocks
              </h2>
              <Link
                href="/blocks"
                className="text-[11.5px] text-muted hover:text-ink inline-flex items-center gap-1 transition-colors"
              >
                All Blocks <ArrowUpRight size={11} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {blocks.map((b) => {
                const lead = getPerson(b.leadId);
                return (
                  <Link key={b.id} href={`/blocks/${b.slug}`} className="group block">
                    <Card hover className="overflow-hidden p-0">
                      <div className="relative h-28 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={b.cover}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-700 ease group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-grad-cinema" />
                        <div className="absolute left-4 top-3">
                          <Badge
                            tone={b.blockType === "service" ? "accent-2" : "accent"}
                          >
                            {b.blockType === "service" ? "Service" : "Collaboration"}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-display text-xl text-ink leading-tight tracking-tight">
                          {b.title}
                        </h3>
                        <p className="mt-1.5 text-[12px] text-muted line-clamp-1">
                          {b.tagline}
                        </p>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[10.5px] text-muted mb-1.5">
                            <span className="capitalize">{b.completion.status.replace("_", " ")}</span>
                            <span className="font-mono text-ink">{b.completion.percent}%</span>
                          </div>
                          <Progress value={b.completion.percent} size="thin" />
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <AvatarStack
                            ids={b.team}
                            size={20}
                            max={4}
                            resolve={(id) => getPerson(id)}
                          />
                          <span className="text-[10.5px] text-muted">
                            Lead · {lead?.name.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent messages + Pending invitations */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel className="flex items-center gap-2">
                  <Inbox size={11} /> Recent messages
                </SectionLabel>
                <Badge tone="accent">
                  {recentMessages.reduce((n, m) => n + m.unread, 0)} unread
                </Badge>
              </div>
              <ul className="space-y-3.5">
                {recentMessages.map((t) => {
                  const actor = getPerson(t.lastActorId);
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/blocks/${t.slug}?tab=messages`}
                        className="flex gap-2.5 group"
                      >
                        {actor && (
                          <Avatar src={actor.avatar} name={actor.name} size={28} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-[12px] font-medium text-ink truncate group-hover:text-accent transition-colors">
                              {t.title}
                            </p>
                            <span className="text-[10px] text-muted font-mono shrink-0">
                              {t.at}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-muted truncate mt-0.5">
                            {t.lastMessage}
                          </p>
                          <p className="text-[10px] text-muted/70 mt-0.5">{t.block}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel className="flex items-center gap-2">
                  <UserPlus size={11} /> Pending invitations
                </SectionLabel>
                <Badge tone="warning">{pendingInvites.length}</Badge>
              </div>
              <ul className="space-y-2.5">
                {pendingInvites.map((inv) => {
                  const from = getPerson(inv.fromId);
                  return (
                    <li
                      key={inv.id}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
                    >
                      {from && <Avatar src={from.avatar} name={from.name} size={30} />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] text-ink">
                          <span className="font-medium">{from?.name.split(" ")[0]}</span>{" "}
                          invited you to <span className="font-medium">{inv.block}</span>
                        </p>
                        <p className="text-[10.5px] text-muted mt-0.5">
                          as {inv.role} · {inv.at} ago
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button className="h-7 px-2.5 rounded-md border border-line text-[11px] text-muted hover:text-ink hover:bg-surface-2 transition-colors">
                          Decline
                        </button>
                        <button className="h-7 px-2.5 rounded-md bg-ink text-bg text-[11px] font-medium hover:opacity-90 transition-opacity">
                          Accept
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}

function CreateCard({
  icon: Icon,
  title,
  body,
  type,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  type: "collaboration" | "service";
}) {
  return (
    <Card className="p-5 h-full flex flex-col">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 border border-line text-accent">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 text-[14px] font-semibold text-ink tracking-tight">
        {title}
      </h3>
      <p className="mt-1 text-[12px] text-muted leading-relaxed flex-1">{body}</p>
      <div className="mt-3">
        <NewBlockButton
          type={type}
          label="Create"
          variant="outline"
          size="sm"
        />
      </div>
    </Card>
  );
}
