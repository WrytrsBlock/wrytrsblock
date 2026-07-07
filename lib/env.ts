export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Server-only. Used for trusted server actions (e.g. creating a Block) where the
// user is validated first, then the writes run with elevated privileges so they
// can't be blocked by drifted RLS policies. NEVER exposed to the client.
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY
);

export const supabaseServiceConfigured = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
);

// Email (Resend) — used to send activity-notification emails. Optional: when
// unset, email sending no-ops (logs only) so the app runs fully without it.
export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "WrytrsBlock <notifications@wrytrsblock.com>";

export const resendConfigured = Boolean(RESEND_API_KEY);

// Where the "new creator joined" internal notification goes. Optional: when
// unset, that email is skipped (logged only) — signup itself never depends
// on this being set.
export const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.wrytrsblock.com";

// OpenAI — used by the Songwriter "✨ Inspire" assistant (Responses API).
// Optional: when unset, Inspire shows a friendly "not available yet" message
// instead of erroring, so the app runs fully without it (mirrors
// RESEND_API_KEY).
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
export const openaiConfigured = Boolean(OPENAI_API_KEY);

// Vercel sends `Authorization: Bearer $CRON_SECRET` on requests it triggers
// itself via vercel.json's `crons` config. When set, app/api/cron/* routes
// reject any request whose header doesn't match, so the endpoint can't be
// hit by anyone who finds the URL. Optional — unset just means those routes
// run unauthenticated (fine for local dev, not recommended in production).
export const CRON_SECRET = process.env.CRON_SECRET ?? "";

// Upstash Redis — backs rate limiting on abuse-prone server actions (sending
// Block Requests, the paid OpenAI-backed Inspire assistant). Optional: when
// unset, lib/rate-limit.ts's checkRateLimit() always allows the call through
// (mirrors the RESEND_API_KEY/OPENAI_API_KEY "no-op until configured"
// pattern) — so local dev and a deploy that hasn't provisioned Upstash yet
// both keep working, just without the throttle.
export const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL ?? "";
export const UPSTASH_REDIS_REST_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
export const rateLimitConfigured = Boolean(
  UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
);
