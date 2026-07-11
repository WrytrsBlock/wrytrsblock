import fs from "fs";
import path from "path";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import { PendingRequests } from "@/components/block/pending-requests";
import { HomeHero } from "@/components/home/home-hero";
import { ActivityTicker } from "@/components/home/activity-ticker";
import { cardCoverFor } from "@/lib/creator-image";
import { blockMatchForCreator } from "@/lib/block-match";
import { type CreatorProfile, type Person } from "@/lib/mock";
import {
  getCreators,
  getCurrentProfile,
  getPendingRequests,
  type CreatorView,
} from "@/lib/data";

export const dynamic = "force-dynamic";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// A truthful one-line "action" for the live ticker, derived from a creator's
// real profile data — never a fabricated event.
function activityAction(c: CreatorView): string {
  const p = c.profile;
  const role = p.roles?.[0];
  const roleL = role?.toLowerCase();
  if (c.person.online) return "is online now";
  if (p.featuredContent && p.featuredContent.length > 0)
    return "shared new work";
  if (p.blockScore >= 750) return "is trending now";
  if (p.openTo?.includes("service"))
    return roleL ? `is taking on ${roleL} work` : "is offering services";
  if (p.openTo?.includes("collaboration"))
    return role ? `· ${role} · open to collab` : "is open to collaborate";
  if (p.location) return `joined from ${p.location}`;
  return roleL ? `joined as a ${roleL}` : "joined the Collectv";
}

// A random hero image from /public/home-heroes on each visit (the page is
// force-dynamic, so this re-rolls per request). Falls back to the single
// home-hero.jpg if the folder is missing/empty.
function randomHeroSrc(): string {
  try {
    const dir = path.join(process.cwd(), "public", "home-heroes");
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
    if (files.length) {
      const pick = files[Math.floor(Math.random() * files.length)];
      return `/home-heroes/${pick}`;
    }
  } catch {
    /* folder unavailable — use the fallback */
  }
  return "/home-hero.jpg";
}

// Home answers one question: "what does the user do next?" → finish a Block,
// answer a request, or discover a creator to start one. Three sections, nothing
// else.
export default async function HomePage() {
  const [profile, pending, creators] = await Promise.all([
    getCurrentProfile(),
    getPendingRequests(),
    getCreators(),
  ]);

  const firstName = profile?.name.split(" ")[0] ?? "Creator";

  // Suggested creators — everyone but me, available-first then best Block Score.
  const ranked = creators
    .filter((c) => c.person.handle !== profile?.handle)
    .sort(
      (a, b) =>
        Number(!!b.person.online) - Number(!!a.person.online) ||
        b.profile.blockScore - a.profile.blockScore
    );
  const suggested = ranked.slice(0, 5);

  // Live activity ticker — truthful status derived from each real creator's
  // profile (online, availability, showcase, score). Social proof, not fiction.
  const activityItems = ranked.slice(0, 16).map((c) => ({
    id: c.person.id,
    name: c.person.name,
    handle: c.person.handle,
    avatar: c.person.avatar,
    online: !!c.person.online,
    action: activityAction(c),
  }));


  return (
    <>
      <TopBar />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="page-fluid pb-16 animate-fade-up">
          <p className="pt-5 text-[13px] font-medium text-white/50">
            {greeting()}, {firstName}
          </p>

          {/* 1 — Hero: who are you creating with today? (random per visit) */}
          <HomeHero src={randomHeroSrc()} />

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

          {/* 4 — Live activity ticker (social proof) */}
          <ActivityTicker items={activityItems} />
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
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      {person.online && (
        <span className="lg-pill lg-pill-g absolute left-2 top-2">Available</span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <p className="truncate font-display text-[13.5px] font-semibold leading-tight text-white drop-shadow">
          {person.name}
        </p>
        <p className="mt-0.5 truncate text-[12px] font-semibold leading-tight text-white drop-shadow-[0_1px_3px_rgb(0_0_0/0.65)]">
          {role}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-white/60">
          {match}% match
        </p>
      </div>
    </Link>
  );
}
