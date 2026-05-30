// Feature flags. Surfaces that aren't part of the core
// Marketplace → Profile → Block → Collaboration → Completion journey are kept
// in the codebase but hidden from primary navigation. Flip to true (or wire to
// env) to bring them back.
export const FEATURES = {
  community: false,
  globalMessages: false,
  globalMedia: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;
