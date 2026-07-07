import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_REST_URL,
  rateLimitConfigured,
} from "@/lib/env";

// One Redis client for the whole process; Ratelimit instances are cheap
// wrappers over it, cached per scope so repeated calls in the same lambda
// invocation reuse the same sliding-window limiter.
let redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

function getLimiter(
  scope: string,
  limit: number,
  window: `${number} ${"s" | "m" | "h" | "d"}`
): Ratelimit | null {
  if (!rateLimitConfigured) return null;
  if (!redis) {
    redis = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
  }
  let rl = limiters.get(scope);
  if (!rl) {
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `wrytrsblock:ratelimit:${scope}`,
    });
    limiters.set(scope, rl);
  }
  return rl;
}

export type RateLimitResult = { ok: true } | { ok: false; error: string };

// Per-(scope, identifier) throttle for abuse-prone Server Actions (sending
// Block Requests, calling the paid OpenAI-backed Inspire assistant, …).
// `identifier` should be the signed-in user's id — never an IP alone, since
// this only ever runs after the caller is already authenticated.
// No-ops (always allows) when Upstash isn't configured, so this is safe to
// call unconditionally from any action.
export async function checkRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  window: `${number} ${"s" | "m" | "h" | "d"}`
): Promise<RateLimitResult> {
  const rl = getLimiter(scope, limit, window);
  if (!rl) return { ok: true };
  const { success } = await rl.limit(identifier);
  return success
    ? { ok: true }
    : {
        ok: false,
        error: "You're doing that too often — please slow down and try again shortly.",
      };
}
