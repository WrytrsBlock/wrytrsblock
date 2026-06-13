"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Headphones,
  Play,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { blockMatchForCreator, matchTier } from "@/lib/block-match";
import { cn } from "@/lib/cn";
import { type CreatorProfile, type Person } from "@/lib/mock";
import { FeaturedCreator } from "@/components/marketplace/featured-creator";
import {
  isVideoType,
  pickFeatured,
  youtubeId,
  youtubeThumb,
} from "@/lib/featured-content";
import { cardCoverFor } from "@/lib/creator-image";
import { openNewBlock } from "@/lib/ui-events";
import { CREATOR_TYPES, INTERESTS } from "@/lib/onboarding";

type Creator = { person: Person; profile: CreatorProfile };

// Unique, sorted, non-empty values for a filter group.
const uniqSorted = (arr: string[]) =>
  [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b));

// ── Location, Collaboration Type, and Distance are three separate axes now
// (geography vs how you work together vs radius). Geography + collab are matched
// against the creator's location/availability; precise radius needs
// geocoordinates (a future enhancement), so Distance acts as a "physically
// reachable" proxy until then. ─────────────────────────────────────────────
const LOCATION_OPTIONS = [
  "Toronto",
  "Ontario",
  "Canada",
  "United States",
  "Worldwide",
];
const COLLAB_TYPES = ["Remote", "In Person", "Hybrid"];
const DISTANCE_OPTIONS = ["25 km", "50 km", "100 km", "250 km"];

const ON_CITIES = ["toronto", "ottawa", "mississauga", "hamilton", "brampton", "kitchener", "windsor", "london"];
const CA_CITIES = [...ON_CITIES, "vancouver", "montreal", "calgary", "edmonton", "winnipeg", "halifax", "quebec", "canada"];
const US_HINTS = ["united states", "usa", " ny", " ca", " tx", " ga", " or", " il", " fl", " wa", " ma", " tn", " co", "new york", "los angeles", "brooklyn", "austin", "atlanta", "portland", "chicago", "nashville", "miami", "seattle", "san francisco", "boston", "houston", "dallas", "denver"];

function matchLocation(loc: string, sel: string): boolean {
  if (sel === "All" || sel === "Worldwide") return true;
  const l = loc.toLowerCase();
  switch (sel) {
    case "Toronto":
      return l.includes("toronto");
    case "Ontario":
      return l.includes("ontario") || ON_CITIES.some((c) => l.includes(c));
    case "Canada":
      return CA_CITIES.some((c) => l.includes(c));
    case "United States":
      return US_HINTS.some((h) => l.includes(h));
    default:
      return true;
  }
}

function matchCollab(
  loc: string,
  availability: string[] | undefined,
  sel: string
): boolean {
  if (sel === "All") return true;
  const l = loc.toLowerCase();
  const remote =
    l.includes("remote") ||
    (availability ?? []).some((a) => a.toLowerCase().includes("remote"));
  const inPerson = l.trim().length > 0 && !l.includes("remote");
  switch (sel) {
    case "Remote":
      return remote;
    case "In Person":
      return inPerson;
    case "Hybrid":
      return remote && inPerson;
    default:
      return true;
  }
}

// No geocoordinates yet — any selected radius implies a physically reachable
// creator (not remote-only). Precise distance is a future enhancement.
function matchDistance(loc: string, sel: string): boolean {
  if (sel === "All") return true;
  return !loc.toLowerCase().includes("remote");
}

// The card's identity media — driven by the creator's pinned Featured Content,
// falling back to a portfolio/banner image. Returns the background image and,
// for video/audio, a small monochrome media indicator (no big play button).
function cardMedia(
  profile: CreatorProfile,
  person: Person
): { image: string | undefined; mediaIcon: "play" | "audio" | null } {
  const featured = pickFeatured(profile.featuredContent ?? []);
  let image: string | undefined;
  let mediaIcon: "play" | "audio" | null = null;

  if (featured) {
    if (featured.type === "image") {
      image = featured.url;
    } else if (isVideoType(featured.type)) {
      // YouTube / Shorts — use the real thumbnail.
      const id = youtubeId(featured.url);
      image = id ? youtubeThumb(id) : undefined;
      mediaIcon = "play";
    } else if (featured.type === "instagram" || featured.type === "tiktok") {
      mediaIcon = "play"; // video, no derivable thumbnail
    } else if (featured.type === "audio") {
      mediaIcon = "audio";
    }
    // portfolio → no inline media; falls back to an image below.
  }

  // Fall back to the creator's real work/photo (then a branded cover) so the
  // card is always full-bleed — never an empty box or a transparent avatar.
  if (!image) image = cardCoverFor(person, profile);

  return { image, mediaIcon };
}

// One compact dropdown — reads as a pill; highlights when a value is set.
function FilterSelect({
  label,
  value,
  options,
  groups,
  onChange,
}: {
  label: string;
  value: string;
  options?: string[];
  groups?: { label: string; options: string[] }[];
  onChange: (v: string) => void;
}) {
  const active = value !== "All";
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={cn(
          "appearance-none cursor-pointer h-9 pl-3.5 pr-8 rounded-full text-[12px] font-semibold border backdrop-blur-sm transition-colors focus:outline-none focus:border-white/40",
          active
            ? "bg-[rgba(59,102,246,0.25)] border-[rgba(120,150,255,0.5)] text-[#A9BEFF]"
            : "bg-white/[0.14] border-white/25 text-white hover:bg-white/[0.2]"
        )}
      >
        <option value="All">{label}</option>
        {options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        {groups?.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown
        size={13}
        className={cn(
          "absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none",
          active ? "text-[#A9BEFF]" : "text-white/70"
        )}
      />
    </div>
  );
}

export function CreatorMarketplace({
  creators,
  featured,
}: {
  creators: Creator[];
  featured?: Creator;
}) {
  const [query, setQuery] = useState("");
  // Primary filters (always visible).
  const [type, setType] = useState("All");
  const [location, setLocation] = useState("All");
  const [genre, setGenre] = useState("All");
  // Advanced filters (in the drawer).
  const [collab, setCollab] = useState("All");
  const [distance, setDistance] = useState("All");
  const [availability, setAvailability] = useState("All");
  const [experience, setExperience] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Creator Type + Genre use the canonical lists (every option always
  // selectable). Availability + Experience are derived from the real data.
  const opts = useMemo(
    () => ({
      types: CREATOR_TYPES.map((t) => t.label),
      genres: INTERESTS.map((i) => i.label),
      availability: uniqSorted(
        creators.flatMap((c) => c.profile.availability ?? [])
      ),
      experience: uniqSorted(
        creators.map((c) => c.profile.experienceLevel ?? "")
      ),
    }),
    [creators]
  );

  const advancedCount =
    (collab !== "All" ? 1 : 0) +
    (distance !== "All" ? 1 : 0) +
    (availability !== "All" ? 1 : 0) +
    (experience !== "All" ? 1 : 0);
  const primaryActive =
    type !== "All" || location !== "All" || genre !== "All";
  const filtersActive = primaryActive || advancedCount > 0 || query.trim() !== "";

  function clearAll() {
    setType("All");
    setLocation("All");
    setGenre("All");
    setCollab("All");
    setDistance("All");
    setAvailability("All");
    setExperience("All");
    setQuery("");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = creators.filter(({ person, profile }) => {
      if (type !== "All" && !profile.roles.includes(type)) return false;
      if (genre !== "All" && !profile.skills.includes(genre)) return false;
      if (location !== "All" && !matchLocation(profile.location, location))
        return false;
      if (
        collab !== "All" &&
        !matchCollab(profile.location, profile.availability, collab)
      )
        return false;
      if (distance !== "All" && !matchDistance(profile.location, distance))
        return false;
      if (
        availability !== "All" &&
        !(profile.availability ?? []).includes(availability)
      )
        return false;
      if (experience !== "All" && profile.experienceLevel !== experience)
        return false;
      if (!q) return true;
      const hay = [
        person.name,
        person.handle,
        profile.location,
        profile.tagline,
        ...profile.roles,
        ...profile.skills,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    // Available-now first, then Block Score — optimized for "I need a creator
    // right now".
    return [...list].sort(
      (a, b) =>
        Number(!!b.person.online) - Number(!!a.person.online) ||
        b.profile.blockScore - a.profile.blockScore
    );
  }, [
    creators,
    query,
    type,
    genre,
    location,
    collab,
    distance,
    availability,
    experience,
  ]);

  return (
    <div className="space-y-4">
      {/* Search — this page's single search experience: the same centered
          liquid-glass pill as the global bar, but it live-filters the grid. */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-[620px]">
          <Search
            size={15}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators, blocks, services, skills, genres…"
            className="lg-nav w-full h-[42px] pl-11 pr-5 !rounded-full text-white text-[13px] placeholder:text-white/60 focus:outline-none focus:bg-white/[0.13] transition-colors"
            style={{
              boxShadow:
                "0 8px 24px rgba(0,0,0,0.4), 0 0 42px rgba(59,102,246,0.16)",
            }}
          />
        </div>
      </div>

      {/* Page title — underneath the top-center search bar (matches My Blocks) */}
      <div>
        <h1 className="font-display text-4xl md:text-5xl text-white tracking-tight">
          Block Market
        </h1>
        <p className="mt-2 text-[13px] text-white/55">
          Find a creator and start a Block.
        </p>
      </div>

      {/* Primary filter row — Creator Type · Location · Genre · Advanced */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <FilterSelect
          label="Creator Type"
          value={type}
          options={opts.types}
          onChange={setType}
        />
        <FilterSelect
          label="Location"
          value={location}
          options={LOCATION_OPTIONS}
          onChange={setLocation}
        />
        <FilterSelect
          label="Genre"
          value={genre}
          options={opts.genres}
          onChange={setGenre}
        />

        {/* Advanced filters — Availability + Experience live in the drawer */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 h-9 pl-3 pr-3.5 rounded-full text-[12px] font-semibold border backdrop-blur-sm transition-colors",
            advancedCount > 0
              ? "bg-[rgba(59,102,246,0.25)] border-[rgba(120,150,255,0.5)] text-[#A9BEFF]"
              : "bg-white/[0.14] border-white/25 text-white hover:bg-white/[0.2]"
          )}
        >
          <SlidersHorizontal size={13} /> Filters
          {advancedCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-white text-[10px] font-semibold tabular-nums">
              {advancedCount}
            </span>
          )}
        </button>

        {filtersActive && (
          <button
            onClick={clearAll}
            className="shrink-0 h-9 px-3 text-[12px] text-muted hover:text-ink transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Idle-only spotlight — small, never blocks active discovery. Once the
          user searches or filters, the view becomes pure results. */}
      {featured && !filtersActive && (
        <FeaturedCreator person={featured.person} profile={featured.profile} />
      )}

      {/* Count */}
      <p className="text-[12px] text-muted">
        <span className="text-ink font-semibold">{filtered.length}</span> creator
        {filtered.length === 1 ? "" : "s"}
        {filtersActive ? " match your search" : " available"}
      </p>

      {/* Grid — the primary focus. More columns = more creators per screen. */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px] text-ink font-medium">No creators found</p>
          <p className="text-[12.5px] text-muted mt-1">
            {filtersActive
              ? "Try clearing a filter or adjusting your search."
              : "Check back soon — new creators are joining."}
          </p>
          {filtersActive && (
            <button
              onClick={clearAll}
              className="mt-3 inline-flex h-9 px-4 items-center rounded-full bg-white/[0.06] border border-white/12 text-[12.5px] font-medium text-ink hover:bg-white/[0.1] transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-3 md:gap-4">
          {filtered.map(({ person, profile }, i) => (
            <CreatorCard key={person.id} person={person} profile={profile} index={i} />
          ))}
        </div>
      )}

      {/* Advanced Filters drawer */}
      {drawerOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <AdvancedDrawer
            collab={collab}
            distance={distance}
            availability={availability}
            experience={experience}
            availabilityOptions={opts.availability}
            experienceOptions={opts.experience}
            onCollab={setCollab}
            onDistance={setDistance}
            onAvailability={setAvailability}
            onExperience={setExperience}
            onClear={() => {
              setCollab("All");
              setDistance("All");
              setAvailability("All");
              setExperience("All");
            }}
            onClose={() => setDrawerOpen(false)}
          />,
          document.body
        )}
    </div>
  );
}

// ── Advanced Filters drawer — bottom sheet on mobile, centered dialog on
// desktop. Holds the secondary filters (Availability + Experience). ─────────
function AdvancedDrawer({
  collab,
  distance,
  availability,
  experience,
  availabilityOptions,
  experienceOptions,
  onCollab,
  onDistance,
  onAvailability,
  onExperience,
  onClear,
  onClose,
}: {
  collab: string;
  distance: string;
  availability: string;
  experience: string;
  availabilityOptions: string[];
  experienceOptions: string[];
  onCollab: (v: string) => void;
  onDistance: (v: string) => void;
  onAvailability: (v: string) => void;
  onExperience: (v: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-label="Advanced filters"
        className="fixed inset-x-0 bottom-0 z-[61] rounded-t-3xl border-t border-white/10 bg-surface p-5 pb-8 animate-fade-up md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[420px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:border"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-ink tracking-tight">
            Advanced filters
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <DrawerField
            label="Collaboration Type"
            value={collab}
            options={COLLAB_TYPES}
            onChange={onCollab}
          />
          <div>
            <DrawerField
              label="Distance"
              value={distance}
              options={DISTANCE_OPTIONS}
              onChange={onDistance}
            />
            <p className="mt-1.5 text-[10.5px] text-muted/70">
              Pairs with Location. Precise radius uses your location — coming
              soon.
            </p>
          </div>
          {availabilityOptions.length > 0 && (
            <DrawerField
              label="Availability"
              value={availability}
              options={availabilityOptions}
              onChange={onAvailability}
            />
          )}
          {experienceOptions.length > 0 && (
            <DrawerField
              label="Experience"
              value={experience}
              options={experienceOptions}
              onChange={onExperience}
            />
          )}
        </div>

        <div className="mt-7 flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="flex-1 h-11 rounded-xl bg-white/[0.05] border border-white/12 text-[13px] font-medium text-ink hover:bg-white/[0.09] transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-accent text-[13px] font-semibold text-white hover:bg-accent/90 transition-colors"
            style={{ color: "#FFFFFF" }}
          >
            Show results
          </button>
        </div>
      </div>
    </>
  );
}

function DrawerField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </label>
      <div className="relative mt-1.5">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full h-11 pl-3.5 pr-9 rounded-xl bg-surface-2 border border-line text-ink text-[13.5px] font-medium focus:outline-none focus:border-accent/50 transition-colors"
        >
          <option value="All">Any {label.toLowerCase()}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
        />
      </div>
    </div>
  );
}

// ── Liquid-glass creator card ───────────────────────────────────────────────
// Photo-forward: the creator's image fills the whole card. A translucent
// gradient band sits low at the bottom (you can see the picture through it) with
// the name + skill, and a square Start Block button on the right.
function CreatorCard({
  person,
  profile,
  index,
}: {
  person: Person;
  profile: CreatorProfile;
  index: number;
}) {
  const href = `/profile/${person.handle}`;
  const { image, mediaIcon } = cardMedia(profile, person);
  const role = profile.roles[0] ?? "Creator";
  const match = blockMatchForCreator(profile);

  return (
    <article
      className="group relative aspect-[4/5] overflow-hidden rounded-2xl glass-tile glass-hover animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
    >
      {/* Full-bleed creator image */}
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(150deg,#33457E,#1B2647)]" />
      )}

      {/* Whole card taps through to the profile (sits beneath the overlay) */}
      <Link
        href={href}
        aria-label={`View ${person.name}'s profile`}
        className="absolute inset-0 z-0"
      />

      {/* Top corner chips */}
      {person.online && (
        <span className="lg-pill lg-pill-g absolute top-2 left-2 z-10 pointer-events-none">
          Available
        </span>
      )}
      {mediaIcon && (
        <span className="absolute top-2 right-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm border border-white/20 text-white pointer-events-none">
          {mediaIcon === "audio" ? (
            <Headphones size={13} />
          ) : (
            <Play size={13} className="fill-current ml-0.5" />
          )}
        </span>
      )}

      {/* Bottom overlay — translucent gradient low on the card so the photo
          shows through. Name + skill on the left, square Start Block on the
          right. pointer-events-none so taps fall through to the profile link;
          the name and button re-enable their own clicks. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-3 pb-3 pt-12">
        <div className="min-w-0">
          <Link href={href} className="pointer-events-auto block">
            <h3 className="truncate font-display text-[16px] md:text-[17px] leading-tight tracking-tight text-white drop-shadow-[0_1px_4px_rgb(0_0_0/0.5)]">
              {person.name}
            </h3>
          </Link>
          <p
            className="mt-0.5 truncate text-[11.5px] text-white/80 drop-shadow-[0_1px_3px_rgb(0_0_0/0.6)]"
            title={`Block Match estimates how well ${person.name} fits you — based on their creator type, creative interests, experience, location, and collaboration preferences. ${matchTier(match).label}.`}
          >
            {role} · {match}% Block Match
          </p>
        </div>

        <button
          type="button"
          onClick={() => openNewBlock(undefined, person.handle)}
          aria-label={`Start a Block with ${person.name}`}
          title="Start Block"
          className="pointer-events-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgba(140,170,255,0.6)] border-t-[rgba(185,205,255,0.75)] bg-[rgba(59,102,246,0.55)] text-white shadow-[0_4px_18px_rgba(59,102,246,0.4)] backdrop-blur-md transition-colors hover:bg-[rgba(59,102,246,0.78)]"
          style={{ color: "#FFFFFF" }}
        >
          <Plus size={19} strokeWidth={2.4} />
        </button>
      </div>
    </article>
  );
}
