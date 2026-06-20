import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Bolt, Layers, Mail, MapPin, Sparkles } from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import { LgNewBlockButton } from "@/components/ui/lg-button";
import { NeedsReply } from "@/components/home/needs-reply";
import { MyBlockCard } from "@/components/block/my-block-card";
import { cardCoverFor } from "@/lib/creator-image";
import { blockMatchForCreator } from "@/lib/block-match";
import {
  creatorProfiles,
  getPerson,
  type CreatorProfile,
  type Person,
} from "@/lib/mock";
import {
  getBlocks,
  getCreator,
  getCreators,
  getCurrentProfile,
  getIncomingBlockRequests,
} from "@/lib/data";

export const dynamic = "force-dynamic";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// A curated set of discovery categories → the Block Market.
const VIBES = [
  "Producers",
  "Vocalists",
  "Hip Hop",
  "R&B",
  "Afrobeat",
  "Engineers",
  "Pop",
  "Videographers",
  "Photographers",
  "Designers",
];

export default async function HomePage() {
  const [profile, blocks, requests, creators] = await Promise.all([
    getCurrentProfile(),
    getBlocks(),
    getIncomingBlockRequests(),
    getCreators(),
  ]);

  const myCreator = profile ? await getCreator(profile.handle) : null;
  const firstName = profile?.name.split(" ")[0] ?? "Creator";

  // Audit log: the dashboard rendered for this user (post-onboarding landing).
  if (profile) console.log(`[dashboard] rendered for @${profile.handle}`);

  // Discovery pool — everyone but me, available-first then best Block Score.
  const discover = creators
    .filter((c) => c.person.handle !== profile?.handle)
    .sort(
      (a, b) =>
        Number(!!b.person.online) - Number(!!a.person.online) ||
        b.profile.blockScore - a.profile.blockScore
    );
  const spotlight = discover[0];
  const rail = discover.slice(1, 13);

  const inMotion = blocks
    .filter((b) => b.completion.status !== "completed")
    .slice(0, 10);
  const open = blocks.filter((b) => b.completion.status !== "completed");
  const inReview = open.filter((b) => b.completion.status === "in_review").length;

  return (
    <>
      <TopBar />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="page-fluid pb-16 animate-fade-up">
          {/* Greeting — light, an invitation not a dashboard */}
          <div className="flex items-center gap-3 pt-5 md:pt-6">
            <div className="min-w-0">
              <h1 className="text-[22px] md:text-[26px] font-semibold text-white">
                {greeting()}, {firstName}
              </h1>
              <p className="mt-1 text-[12.5px] text-white/60">
                Discover creators and start something today.
              </p>
            </div>
            <span className="flex-1" />
            <LgNewBlockButton label="Start Block" />
          </div>

          {/* ── Featured creator spotlight — the inspiring first visual ── */}
          {spotlight && (
            <Link
              href={`/profile/${spotlight.person.handle}`}
              className="group relative mt-5 block aspect-[16/10] sm:aspect-[21/9] overflow-hidden rounded-3xl glass-tile glass-hover"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cardCoverFor(spotlight.person, spotlight.profile)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
              <span className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                <span className="lg-pill lg-pill-w mb-3 inline-flex">
                  <Sparkles size={12} /> Featured creator
                </span>
                <h2 className="font-display text-[30px] md:text-[44px] font-bold leading-[1.0] tracking-tight text-white drop-shadow-[0_2px_10px_rgb(0_0_0/0.5)]">
                  {spotlight.person.name}
                </h2>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/80">
                  <span className="font-medium text-white/90">
                    {spotlight.profile.roles.slice(0, 2).join(" · ")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} /> {spotlight.profile.location}
                  </span>
                </p>
                <span className="lg-btn lg-btn-p mt-4 inline-flex" style={{ color: "#FFFFFF" }}>
                  Explore profile <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          )}

          {/* ── Browse by vibe ── */}
          <Section title="Browse by vibe">
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <Link
                  key={v}
                  href="/marketplace"
                  className="lg-glass2 inline-flex h-9 items-center rounded-full px-4 text-[12.5px] font-medium text-white/85 transition-colors hover:bg-white/[0.12] hover:text-white"
                >
                  {v}
                </Link>
              ))}
            </div>
          </Section>

          {/* ── Discover creators ── */}
          {rail.length > 0 && (
            <Section title="Discover creators" cta="Block Market" href="/marketplace">
              <Rail>
                {rail.map((c) => (
                  <CreatorMini
                    key={c.person.id}
                    person={c.person}
                    profile={c.profile}
                  />
                ))}
              </Rail>
            </Section>
          )}

          {/* ── Your Blocks in motion ── */}
          {inMotion.length > 0 && (
            <Section title="Pick up where you left off" cta="My Blocks" href="/blocks">
              <Rail>
                {inMotion.map((b, i) => (
                  <div key={b.id} className="w-[160px] shrink-0 snap-start sm:w-[180px]">
                    <MyBlockCard
                      block={b}
                      lead={getPerson(b.leadId) ?? null}
                      score={creatorProfiles[b.leadId]?.blockScore}
                      index={i}
                    />
                  </div>
                ))}
              </Rail>
            </Section>
          )}

          {/* ── Wants to collaborate with you ── */}
          {requests.length > 0 && (
            <Section title="Wants to collaborate with you">
              <NeedsReply requests={requests} />
            </Section>
          )}

          {/* ── Secondary: your numbers, quietly at the bottom ── */}
          <div className="mt-10 flex flex-wrap gap-2.5">
            <StatPill
              icon={<Bolt size={13} />}
              label="Block Score"
              value={myCreator ? `${myCreator.profile.blockScore}` : "—"}
            />
            <StatPill
              icon={<Layers size={13} />}
              label="Active Blocks"
              value={`${open.length}`}
              sub={inReview > 0 ? `${inReview} in review` : undefined}
            />
            <StatPill
              icon={<Mail size={13} />}
              label="Requests"
              value={`${requests.length}`}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Section header + horizontal rail ────────────────────────────────────────
function Section({
  title,
  cta,
  href,
  children,
}: {
  title: string;
  cta?: string;
  href?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-7 md:mt-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        {href && cta && (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 text-[12px] text-white/55 transition-colors hover:text-white"
          >
            {cta} <ArrowRight size={12} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Rail({ children }: { children: ReactNode }) {
  return (
    <div className="flex snap-x gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

// ── Discovery creator card (photo-forward, taps to the profile) ─────────────
function CreatorMini({
  person,
  profile,
}: {
  person: Person;
  profile: CreatorProfile;
}) {
  const img = cardCoverFor(person, profile);
  const role = profile.roles[0] ?? "Creator";
  const match = blockMatchForCreator(profile);
  return (
    <Link
      href={`/profile/${person.handle}`}
      className="group relative aspect-[4/5] w-[150px] shrink-0 snap-start overflow-hidden rounded-2xl glass-tile glass-hover sm:w-[168px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      {person.online && (
        <span className="lg-pill lg-pill-g absolute left-2 top-2">Available</span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <p className="truncate font-display text-[14.5px] font-semibold leading-tight text-white drop-shadow">
          {person.name}
        </p>
        <p className="mt-0.5 truncate text-[10.5px] text-white/70">
          {role} · {match}% match
        </p>
      </div>
    </Link>
  );
}

function StatPill({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="lg-glass2 inline-flex items-center gap-2.5 rounded-full px-4 py-2">
      <span className="text-[#A9BEFF]">{icon}</span>
      <span className="text-[12px] text-white/60">{label}</span>
      <span className="text-[13px] font-semibold tabular-nums text-white">
        {value}
      </span>
      {sub && <span className="text-[11px] text-white/45">· {sub}</span>}
    </div>
  );
}
