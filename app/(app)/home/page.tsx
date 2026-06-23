import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import { PendingRequests } from "@/components/block/pending-requests";
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
  getCreators,
  getCurrentProfile,
  getPendingRequests,
} from "@/lib/data";

export const dynamic = "force-dynamic";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// Home answers one question: "what does the user do next?" → finish a Block,
// answer a request, or discover a creator to start one. Three sections, nothing
// else.
export default async function HomePage() {
  const [profile, blocks, pending, creators] = await Promise.all([
    getCurrentProfile(),
    getBlocks(),
    getPendingRequests(),
    getCreators(),
  ]);

  const firstName = profile?.name.split(" ")[0] ?? "Creator";
  if (profile) console.log(`[dashboard] rendered for @${profile.handle}`);

  const active = blocks
    .filter((b) => b.completion.status !== "completed" && !b.archived)
    .slice(0, 10);

  // Suggested creators — everyone but me, available-first then best Block Score.
  const suggested = creators
    .filter((c) => c.person.handle !== profile?.handle)
    .sort(
      (a, b) =>
        Number(!!b.person.online) - Number(!!a.person.online) ||
        b.profile.blockScore - a.profile.blockScore
    )
    .slice(0, 5);

  return (
    <>
      <TopBar />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="page-fluid pb-16 animate-fade-up">
          <div className="pt-5 md:pt-6">
            <h1 className="text-[22px] md:text-[26px] font-semibold text-white">
              {greeting()}, {firstName}
            </h1>
          </div>

          {/* 1 — Continue Collaborating */}
          {active.length > 0 && (
            <Section
              title="Continue Collaborating"
              cta="All Blocks"
              href="/blocks"
            >
              <Rail>
                {active.map((b, i) => (
                  <div
                    key={b.id}
                    className="w-[160px] shrink-0 snap-start sm:w-[180px]"
                  >
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

          {/* 2 — New Requests (require a decision) */}
          {pending.incoming.length > 0 && (
            <Section title="New Requests">
              <PendingRequests incoming={pending.incoming} outgoing={[]} />
            </Section>
          )}

          {/* 3 — Suggested Creators */}
          {suggested.length > 0 && (
            <Section
              title="Suggested Creators"
              cta="Browse Market"
              href="/marketplace"
            >
              <Rail>
                {suggested.map((c) => (
                  <CreatorMini
                    key={c.person.id}
                    person={c.person}
                    profile={c.profile}
                  />
                ))}
              </Rail>
            </Section>
          )}
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

// ── Suggested creator card (photo-forward, taps to the profile to start) ─────
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
