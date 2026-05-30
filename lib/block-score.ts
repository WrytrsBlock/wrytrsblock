// Block Score — WrytrsBlock's creator reputation system.
//
// A 0–1000 trust signal shown throughout the platform. It maps to a Creator
// Level and is (eventually) computed from the weighted inputs below. For now
// each creator carries a stored `blockScore`; `computeBlockScore` is wired and
// ready to become the source of truth once these signals are tracked.

export type LevelTone = "soft" | "accent-2" | "accent" | "warning" | "success";

export type CreatorLevel = {
  id: string;
  label: string;
  min: number; // inclusive lower bound on a 0–1000 scale
  tone: LevelTone;
};

export const CREATOR_LEVELS: CreatorLevel[] = [
  { id: "rising", label: "Rising Creator", min: 0, tone: "soft" },
  { id: "active", label: "Active Collaborator", min: 400, tone: "accent-2" },
  { id: "builder", label: "Block Builder", min: 600, tone: "accent" },
  { id: "elite", label: "Elite Creator", min: 800, tone: "warning" },
  { id: "legend", label: "Block Legend", min: 925, tone: "success" },
];

export function levelForScore(score: number): CreatorLevel {
  return (
    [...CREATOR_LEVELS].reverse().find((l) => score >= l.min) ??
    CREATOR_LEVELS[0]
  );
}

export const MAX_BLOCK_SCORE = 1000;

// ---------- Future scoring inputs ----------

export type BlockScoreInputs = {
  completedBlocks: number; // count
  avgRating: number; // 0–5
  collaborationSuccess: number; // 0–1 (on-time / signed-off ratio)
  splitSheetParticipation: number; // count
  profileCompleteness: number; // 0–1
  responseRate: number; // 0–1
  endorsements: number; // count
  platformActivity: number; // 0–1 (recency / engagement)
};

// Weights sum to 1. These are the levers Block Score will respond to.
export const SCORE_FACTORS: {
  key: keyof BlockScoreInputs;
  label: string;
  weight: number;
}[] = [
  { key: "completedBlocks", label: "Completed Blocks", weight: 0.22 },
  { key: "avgRating", label: "Creator Ratings", weight: 0.18 },
  { key: "collaborationSuccess", label: "Collaboration Success", weight: 0.16 },
  { key: "responseRate", label: "Response Rate", weight: 0.12 },
  { key: "splitSheetParticipation", label: "Split Sheet Participation", weight: 0.1 },
  { key: "profileCompleteness", label: "Profile Completeness", weight: 0.08 },
  { key: "endorsements", label: "Endorsements", weight: 0.08 },
  { key: "platformActivity", label: "Platform Activity", weight: 0.06 },
];

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// Normalize each raw input to 0–1 (caps chosen so the scale feels earned).
function normalize(i: BlockScoreInputs): Record<keyof BlockScoreInputs, number> {
  return {
    completedBlocks: clamp01(i.completedBlocks / 20),
    avgRating: clamp01(i.avgRating / 5),
    collaborationSuccess: clamp01(i.collaborationSuccess),
    splitSheetParticipation: clamp01(i.splitSheetParticipation / 15),
    profileCompleteness: clamp01(i.profileCompleteness),
    responseRate: clamp01(i.responseRate),
    endorsements: clamp01(i.endorsements / 50),
    platformActivity: clamp01(i.platformActivity),
  };
}

// Weighted, normalized to 0–1000.
export function computeBlockScore(i: BlockScoreInputs): number {
  const n = normalize(i);
  const total = SCORE_FACTORS.reduce((s, f) => s + n[f.key] * f.weight, 0);
  return Math.round(total * MAX_BLOCK_SCORE);
}

// ---------- Display helpers ----------

export function profileCompleteness(p: {
  bio?: string;
  skills?: unknown[];
  portfolio?: unknown[];
  socials?: Record<string, unknown>;
  website?: string;
}): number {
  const checks = [
    Boolean(p.bio && p.bio.length > 20),
    (p.skills?.length ?? 0) > 0,
    (p.portfolio?.length ?? 0) > 0,
    Object.values(p.socials ?? {}).filter(Boolean).length > 0,
    Boolean(p.website),
  ];
  return checks.filter(Boolean).length / checks.length;
}

// A plausible, deterministic factor breakdown for the score UI. Real signals
// replace this once tracked; the shape stays the same.
export function scoreFactorBreakdown(args: {
  blockScore: number;
  completedBlocks: number;
  rating: number;
  profileCompleteness: number;
}): { label: string; pct: number }[] {
  const base = args.blockScore / MAX_BLOCK_SCORE;
  const offset: Record<keyof BlockScoreInputs, number> = {
    completedBlocks: 0,
    avgRating: 0,
    collaborationSuccess: 0.05,
    responseRate: 0.08,
    splitSheetParticipation: -0.05,
    profileCompleteness: 0,
    endorsements: -0.12,
    platformActivity: 0.03,
  };
  return SCORE_FACTORS.map((f) => {
    let pct: number;
    if (f.key === "completedBlocks") pct = clamp01(args.completedBlocks / 8);
    else if (f.key === "avgRating") pct = clamp01(args.rating / 5);
    else if (f.key === "profileCompleteness") pct = args.profileCompleteness;
    else pct = clamp01(base + offset[f.key]);
    return { label: f.label, pct };
  });
}
