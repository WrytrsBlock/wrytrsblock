// Single source of truth for resolving a creator's imagery. The profile hero and
// the marketplace cards both pull from here so the rules stay consistent — and
// so a creator's *real* uploaded picture is always preferred over any fallback.

import type { CreatorProfile, Person } from "@/lib/mock";

// A neutral, branded cover used ONLY as a last resort on marketplace cards (so a
// card is never an empty box or a transparent generated avatar). The profile
// hero never uses this — it shows a branded gradient + guidance instead.
export const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80";

// Generated (dicebear) avatars are transparent SVGs — fine as a small circle but
// wrong full-bleed. Treat them as "no real photo".
export function realAvatar(person: Person): string | undefined {
  return person.avatar && !person.avatar.includes("dicebear")
    ? person.avatar
    : undefined;
}

// The creator's curated Featured Content can include uploaded images. Prefer the
// one flagged ⭐ featured, else the first image item.
export function featuredImageUrl(profile: CreatorProfile): string | undefined {
  const items = profile.featuredContent ?? [];
  const images = items.filter((i) => i.type === "image" && i.url);
  const pick = images.find((i) => i.featured) ?? images[0];
  return pick?.url;
}

/**
 * Profile hero image, in the exact required priority:
 *   1. uploaded cover / banner
 *   2. a Featured Content image
 *   3. the uploaded profile photo (never the generated avatar)
 *   4. a portfolio image (still the creator's real work)
 * Returns `undefined` when the creator has no image at all — the hero then shows
 * a branded gradient + "add a cover" guidance rather than a random photo.
 */
export function heroImageFor(
  person: Person,
  profile: CreatorProfile
): string | undefined {
  return (
    profile.banner ||
    featuredImageUrl(profile) ||
    realAvatar(person) ||
    profile.portfolio[0] ||
    undefined
  );
}

/**
 * Marketplace/wall card cover — always returns a usable image so a card is never
 * empty. Prefers the creator's real work, then their photo, then a branded
 * fallback (never a transparent generated avatar).
 */
export function cardCoverFor(person: Person, profile: CreatorProfile): string {
  return (
    profile.portfolio[0] ||
    profile.banner ||
    featuredImageUrl(profile) ||
    realAvatar(person) ||
    FALLBACK_COVER
  );
}
