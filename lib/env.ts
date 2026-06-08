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
