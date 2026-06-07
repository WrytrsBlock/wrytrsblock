// Onboarding data model + Block Match Score.
//
// WrytrsBlock is a creator marketplace first: onboarding exists to build a
// complete creator profile so people can discover the right collaborators.
// Every field collected here is typed once and reused by the flow UI
// (components/onboarding/*), the Block Match Score, Creator Discovery, and the
// Block Market filters. One source of truth.

import type { LucideIcon } from "lucide-react";
import {
  AudioWaveform,
  BadgeDollarSign,
  Briefcase,
  Building2,
  Camera,
  CircleEllipsis,
  Clapperboard,
  Crown,
  Disc3,
  Drama,
  Film,
  Globe,
  Handshake,
  MapPin,
  Mic,
  MicVocal,
  Music,
  Palette,
  PenLine,
  Podcast,
  Rocket,
  ScrollText,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Tag,
  TrendingUp,
  Video,
} from "lucide-react";

// ---------- Option primitives ----------

export type CardOption<T extends string> = {
  id: T;
  label: string;
  desc?: string;
  icon: LucideIcon;
};

// ---------- Step 2 · Creator Type (multi-select cards) ----------
// Influencer is a first-class creator category across the whole platform.

export type CreatorType =
  | "producer"
  | "rapper"
  | "singer"
  | "songwriter"
  | "engineer"
  | "musician"
  | "dj"
  | "videographer"
  | "photographer"
  | "graphic_designer"
  | "influencer"
  | "manager"
  | "record_label"
  | "filmmaker"
  | "screenwriter"
  | "actor"
  | "podcaster"
  | "content_creator"
  | "animator"
  | "brand"
  | "other";

export const CREATOR_TYPES: CardOption<CreatorType>[] = [
  { id: "producer", label: "Producer", icon: SlidersHorizontal },
  { id: "rapper", label: "Rapper", icon: MicVocal },
  { id: "singer", label: "Singer", icon: Mic },
  { id: "songwriter", label: "Songwriter", icon: PenLine },
  { id: "engineer", label: "Audio Engineer", icon: AudioWaveform },
  { id: "musician", label: "Musician", icon: Music },
  { id: "dj", label: "DJ", icon: Disc3 },
  { id: "videographer", label: "Videographer", icon: Video },
  { id: "photographer", label: "Photographer", icon: Camera },
  { id: "graphic_designer", label: "Graphic Designer", icon: Palette },
  { id: "animator", label: "Animator", icon: Shapes },
  { id: "influencer", label: "Influencer", icon: Sparkles },
  { id: "content_creator", label: "Content Creator", icon: Clapperboard },
  { id: "manager", label: "Manager", icon: Briefcase },
  { id: "record_label", label: "Record Label", icon: Building2 },
  { id: "brand", label: "Brand", icon: Tag },
  { id: "filmmaker", label: "Filmmaker", icon: Film },
  { id: "screenwriter", label: "Screenwriter", icon: ScrollText },
  { id: "actor", label: "Actor", icon: Drama },
  { id: "podcaster", label: "Podcast Host", icon: Podcast },
  { id: "other", label: "Other", icon: CircleEllipsis },
];

// ---------- Step 3 · Basic information ----------

export type Gender = "male" | "female" | "non_binary" | "undisclosed";
export const GENDERS: { id: Gender; label: string }[] = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "non_binary", label: "Non-Binary" },
  { id: "undisclosed", label: "Prefer Not To Say" },
];

// Age is stored as a *group* and never shown as an exact age publicly.
export type AgeGroup =
  | "under_18"
  | "18_24"
  | "25_34"
  | "35_44"
  | "45_54"
  | "55_plus";
export const AGE_GROUPS: { id: AgeGroup; label: string }[] = [
  { id: "under_18", label: "Under 18" },
  { id: "18_24", label: "18-24" },
  { id: "25_34", label: "25-34" },
  { id: "35_44", label: "35-44" },
  { id: "45_54", label: "45-54" },
  { id: "55_plus", label: "55+" },
];

// ---------- Step 4 · Experience (cards) ----------

export type ExperienceLevel =
  | "beginner"
  | "intermediate"
  | "professional"
  | "veteran";

export const EXPERIENCE_LEVELS: CardOption<ExperienceLevel>[] = [
  {
    id: "beginner",
    label: "Beginner",
    desc: "Just getting started.",
    icon: Sprout,
  },
  {
    id: "intermediate",
    label: "Intermediate",
    desc: "Building real skills.",
    icon: TrendingUp,
  },
  {
    id: "professional",
    label: "Professional",
    desc: "This is what I do.",
    icon: Rocket,
  },
  {
    id: "veteran",
    label: "Industry Veteran",
    desc: "Years in the game.",
    icon: Crown,
  },
];

// Higher levels nudge the Block Match Score up slightly.
const EXPERIENCE_WEIGHT: Record<ExperienceLevel, number> = {
  beginner: 0.8,
  intermediate: 0.88,
  professional: 0.95,
  veteran: 1,
};

// ---------- Step 5 · Collaboration preferences — "Who are you looking for?" ----

export type LookingFor =
  | "producers"
  | "singers"
  | "rappers"
  | "songwriters"
  | "engineers"
  | "influencers"
  | "videographers"
  | "photographers"
  | "graphic_designers"
  | "djs"
  | "managers"
  | "labels"
  | "filmmakers"
  | "screenwriters"
  | "podcasters";

export const LOOKING_FOR: { id: LookingFor; label: string }[] = [
  { id: "producers", label: "Producers" },
  { id: "singers", label: "Singers" },
  { id: "rappers", label: "Rappers" },
  { id: "songwriters", label: "Songwriters" },
  { id: "engineers", label: "Engineers" },
  { id: "influencers", label: "Influencers" },
  { id: "videographers", label: "Videographers" },
  { id: "photographers", label: "Photographers" },
  { id: "graphic_designers", label: "Graphic Designers" },
  { id: "djs", label: "DJs" },
  { id: "managers", label: "Managers" },
  { id: "labels", label: "Labels" },
  { id: "filmmakers", label: "Filmmakers" },
  { id: "screenwriters", label: "Screenwriters" },
  { id: "podcasters", label: "Podcasters" },
];

// ---------- Step 6 · Creative interests (chips) ----------

export type Interest =
  | "hip_hop"
  | "rnb"
  | "pop"
  | "dancehall"
  | "reggae"
  | "afrobeat"
  | "amapiano"
  | "soca"
  | "gospel"
  | "edm"
  | "house"
  | "techno"
  | "dnb"
  | "trap"
  | "country"
  | "rock"
  | "alternative"
  | "punk"
  | "metal"
  | "jazz"
  | "blues"
  | "classical"
  | "folk"
  | "indie"
  | "lofi"
  | "instrumental"
  | "film_score"
  | "sound_design"
  | "podcast"
  | "spoken_word"
  | "world";

export const INTERESTS: { id: Interest; label: string }[] = [
  { id: "hip_hop", label: "Hip Hop" },
  { id: "rnb", label: "R&B" },
  { id: "pop", label: "Pop" },
  { id: "dancehall", label: "Dancehall" },
  { id: "reggae", label: "Reggae" },
  { id: "afrobeat", label: "Afrobeat" },
  { id: "amapiano", label: "Amapiano" },
  { id: "soca", label: "Soca" },
  { id: "gospel", label: "Gospel" },
  { id: "edm", label: "EDM" },
  { id: "house", label: "House" },
  { id: "techno", label: "Techno" },
  { id: "dnb", label: "Drum & Bass" },
  { id: "trap", label: "Trap" },
  { id: "country", label: "Country" },
  { id: "rock", label: "Rock" },
  { id: "alternative", label: "Alternative" },
  { id: "punk", label: "Punk" },
  { id: "metal", label: "Metal" },
  { id: "jazz", label: "Jazz" },
  { id: "blues", label: "Blues" },
  { id: "classical", label: "Classical" },
  { id: "folk", label: "Folk" },
  { id: "indie", label: "Indie" },
  { id: "lofi", label: "Lo-Fi" },
  { id: "instrumental", label: "Instrumental" },
  { id: "film_score", label: "Film Score" },
  { id: "sound_design", label: "Sound Design" },
  { id: "podcast", label: "Podcast" },
  { id: "spoken_word", label: "Spoken Word" },
  { id: "world", label: "World Music" },
];

// Country list for the onboarding dropdown (broad coverage; free text still
// allowed for City via a suggestions datalist).
export const COUNTRIES: string[] = [
  "United States", "Canada", "United Kingdom", "Ireland", "Australia",
  "New Zealand", "Nigeria", "Ghana", "South Africa", "Kenya", "Jamaica",
  "Trinidad and Tobago", "Barbados", "France", "Germany", "Netherlands",
  "Belgium", "Spain", "Portugal", "Italy", "Sweden", "Norway", "Denmark",
  "Finland", "Iceland", "Switzerland", "Austria", "Poland", "Czechia",
  "Hungary", "Greece", "Romania", "Ukraine", "Russia", "Turkey", "Brazil",
  "Mexico", "Argentina", "Colombia", "Chile", "Peru", "Venezuela", "Cuba",
  "Dominican Republic", "Puerto Rico", "Haiti", "Panama", "Costa Rica",
  "India", "Pakistan", "Bangladesh", "Sri Lanka", "China", "Japan",
  "South Korea", "Philippines", "Indonesia", "Malaysia", "Singapore",
  "Thailand", "Vietnam", "United Arab Emirates", "Saudi Arabia", "Qatar",
  "Israel", "Egypt", "Morocco", "Senegal", "Ethiopia", "Tanzania", "Uganda",
  "Zimbabwe", "Angola", "Other",
];

// A handful of common creator hubs to power the City autocomplete datalist.
export const CITY_SUGGESTIONS: string[] = [
  "Toronto", "Montreal", "Vancouver", "New York", "Los Angeles", "Atlanta",
  "Miami", "Chicago", "Houston", "Nashville", "Detroit", "Memphis",
  "London", "Manchester", "Birmingham", "Dublin", "Paris", "Berlin",
  "Amsterdam", "Stockholm", "Lagos", "Accra", "Johannesburg", "Cape Town",
  "Nairobi", "Kingston", "Port of Spain", "São Paulo", "Rio de Janeiro",
  "Mexico City", "Sydney", "Melbourne", "Mumbai", "Tokyo", "Seoul", "Dubai",
];

// ---------- Step 7 · Availability (multi-select cards) ----------

export type Availability =
  | "collaborate"
  | "paid_work"
  | "remote_work"
  | "local_projects";

export const AVAILABILITY: CardOption<Availability>[] = [
  {
    id: "collaborate",
    label: "Open To Collaborate",
    desc: "Build with other creators.",
    icon: Handshake,
  },
  {
    id: "paid_work",
    label: "Open To Paid Work",
    desc: "Available for hire.",
    icon: BadgeDollarSign,
  },
  {
    id: "remote_work",
    label: "Open To Remote Work",
    desc: "Work from anywhere.",
    icon: Globe,
  },
  {
    id: "local_projects",
    label: "Open To Local Projects",
    desc: "Link up in person.",
    icon: MapPin,
  },
];

export const BIO_MIN = 80;
export const BIO_MAX = 300;

// ---------- The full onboarding payload ----------

export type OnboardingProfile = {
  // Step 1
  photo: string | null; // object URL or remote URL
  name: string; // display name
  username: string;
  bio: string;
  // Step 2
  creatorTypes: CreatorType[];
  // Step 3
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  country: string;
  city: string;
  // Step 4
  experience: ExperienceLevel | null;
  // Step 5
  lookingFor: LookingFor[];
  // Step 6
  interests: Interest[];
  // Step 7
  availability: Availability[];
};

export function emptyOnboarding(name = ""): OnboardingProfile {
  return {
    photo: null,
    name,
    username: "",
    bio: "",
    creatorTypes: [],
    gender: null,
    ageGroup: null,
    country: "",
    city: "",
    experience: null,
    lookingFor: [],
    interests: [],
    availability: [],
  };
}

// Sanitize a raw string into a valid @username.
export function toUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 24);
}

// ---------- Label lookups (preview + chips) ----------

const labelOf = <T extends string>(
  list: { id: T; label: string }[],
  id: T | null
) => list.find((o) => o.id === id)?.label ?? "";

export const creatorTypeLabel = (id: CreatorType) => labelOf(CREATOR_TYPES, id);
export const interestLabel = (id: Interest | string): string => {
  const found = INTERESTS.find((o) => o.id === id)?.label;
  if (found) return found;
  // Humanize any legacy/unknown id so older saved data still displays.
  return String(id).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};
export const lookingForLabel = (id: LookingFor) => labelOf(LOOKING_FOR, id);
export const experienceLabel = (id: ExperienceLevel | null) =>
  labelOf(EXPERIENCE_LEVELS, id);
export const availabilityLabel = (id: Availability) =>
  labelOf(AVAILABILITY, id);

export function locationLabel(d: Pick<OnboardingProfile, "city" | "country">) {
  return [d.city, d.country].filter(Boolean).join(", ");
}

// ---------- Step completion gating ----------

// 4-step flow: 0 = Profile, 1 = Creator Identity, 2 = Creative Profile,
// 3 = Review & Launch. TOTAL_STEPS is the index of the review screen.
export const TOTAL_STEPS = 3;

export function isStepComplete(step: number, d: OnboardingProfile): boolean {
  switch (step) {
    case 0: // Profile
      return d.name.trim().length > 0 && d.username.trim().length >= 2;
    case 1: // Creator Identity (country/city optional)
      return d.creatorTypes.length > 0;
    case 2: // Creative Profile
      return d.interests.length > 0 && d.experience !== null;
    default: // Review
      return true;
  }
}

// ---------- Block Match Score ----------
//
// The headline "your profile is ready" reward, generated from the five signals
// the spec calls out: Creator Type, Interests, Experience, Location, and
// Collaboration Preferences. Returned 0–100 with a per-factor breakdown so the
// completion screen can show what's driving it. The same score is displayed
// throughout the marketplace and creator profiles (see lib/block-match.ts for
// the creator-card derivation).

export type MatchFactorKey =
  | "creatorType"
  | "interests"
  | "experience"
  | "location"
  | "collaboration";

export type BlockMatchResult = {
  score: number; // 0–100
  factors: { key: MatchFactorKey; label: string; pct: number }[];
};

const MATCH_WEIGHTS: { key: MatchFactorKey; label: string; weight: number }[] = [
  { key: "creatorType", label: "Creator Type", weight: 0.25 },
  { key: "interests", label: "Creative Interests", weight: 0.2 },
  { key: "experience", label: "Experience", weight: 0.2 },
  { key: "collaboration", label: "Collaboration Preferences", weight: 0.2 },
  { key: "location", label: "Location", weight: 0.15 },
];

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function blockMatchScore(d: OnboardingProfile): BlockMatchResult {
  const pcts: Record<MatchFactorKey, number> = {
    creatorType: d.creatorTypes.length
      ? clamp01(0.8 + 0.1 * (d.creatorTypes.length - 1))
      : 0,
    interests: clamp01(d.interests.length / 3),
    experience: d.experience ? EXPERIENCE_WEIGHT[d.experience] : 0,
    collaboration: clamp01(d.lookingFor.length / 3),
    location: d.country && d.city ? 1 : d.country || d.city ? 0.5 : 0,
  };

  const score = Math.round(
    100 * MATCH_WEIGHTS.reduce((sum, f) => sum + pcts[f.key] * f.weight, 0)
  );

  return {
    score,
    factors: MATCH_WEIGHTS.map((f) => ({
      key: f.key,
      label: f.label,
      pct: pcts[f.key],
    })),
  };
}

// Profile completeness, 0–100 — drives the "% complete" progress indicator.
export function completeness(d: OnboardingProfile): number {
  const checks: [boolean, number][] = [
    [d.name.trim().length > 0, 8],
    [d.username.trim().length >= 2, 6],
    [!!d.photo, 8],
    [d.bio.trim().length >= BIO_MIN, 8],
    [d.creatorTypes.length > 0, 16],
    [!!d.country || !!d.city, 8],
    [d.gender !== null || d.ageGroup !== null, 4],
    [d.experience !== null, 10],
    [d.lookingFor.length > 0, 12],
    [d.interests.length > 0, 12],
    [d.availability.length > 0, 8],
  ];
  const total = checks.reduce((sum, [ok, w]) => sum + (ok ? w : 0), 0);
  return Math.min(100, Math.round(total));
}
