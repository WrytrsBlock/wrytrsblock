// Block Match Score — a creator's compatibility / match strength, 0–100.
//
// Distinct from Block Score (the 0–1000 reputation/trust signal). Block Match is
// generated from the discovery signals a creator provides — Creator Type,
// Creative Interests, Experience, Location, and Collaboration Preferences — and
// is displayed throughout the marketplace and on creator profiles so people can
// quickly see who's a strong fit.

import type { CreatorProfile } from "@/lib/mock";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export type MatchTier = {
  id: "elite" | "strong" | "good" | "fair";
  label: string;
  tone: "success" | "accent" | "accent-2" | "soft";
};

export function matchTier(score: number): MatchTier {
  if (score >= 90) return { id: "elite", label: "Elite Match", tone: "success" };
  if (score >= 75)
    return { id: "strong", label: "Strong Match", tone: "accent" };
  if (score >= 55) return { id: "good", label: "Good Match", tone: "accent-2" };
  return { id: "fair", label: "Fair Match", tone: "soft" };
}

// Derives a stable Block Match Score for an existing creator profile from the
// same five signals onboarding collects (mapped onto the demo profile shape):
//   Creator Type ← roles · Interests ← skills · Experience ← reputation ·
//   Collaboration ← openTo · Location ← location.
export function blockMatchForCreator(p: CreatorProfile): number {
  if (typeof p.blockMatch === "number") return p.blockMatch;

  const creatorType = p.roles.length
    ? clamp01(0.8 + 0.1 * (p.roles.length - 1))
    : 0;
  const interests = clamp01((p.skills?.length ?? 0) / 4);
  const experience = clamp01(p.blockScore / 1000);
  const collaboration = p.openTo?.length ? clamp01(p.openTo.length / 2) : 0.5;
  const location = p.location ? 1 : 0;

  const score =
    creatorType * 0.25 +
    interests * 0.2 +
    experience * 0.2 +
    collaboration * 0.2 +
    location * 0.15;

  return Math.max(0, Math.min(100, Math.round(score * 100)));
}
