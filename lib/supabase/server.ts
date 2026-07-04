import { createServerClient } from "@supabase/ssr";
import { createClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  supabaseServiceConfigured,
} from "@/lib/env";

// Server-side Supabase client for Server Components, Server Actions, and Route
// Handlers. Uses the getAll/setAll cookie API (required by @supabase/ssr ≥ 0.5):
// the deprecated get/set/remove API mishandles Supabase's *chunked* auth-token
// cookies, which left writes running unauthenticated (auth.uid() = null) and
// tripped RLS on inserts like creating a workspace/Block.
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component (cookies are read-only there) — the
          // middleware refreshes/persists the session instead.
        }
      },
    },
  });
}

// A request-scoped client that performs RLS-protected writes AS the signed-in
// user. supabase-js sets the Authorization header on every request from its
// internal _getAccessToken() — which OVERRIDES a plain global.headers.
// Authorization and otherwise falls back to the anon key. So we must supply the
// user's JWT via the `accessToken` option; that is what actually makes the
// database see the user (auth.uid() = the real user id). Use only for data
// writes — `.auth.*` is intentionally disabled on this client.
export function createSupabaseAuthedClient(accessToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    accessToken: async () => accessToken,
  });
}

// Convenience wrapper around the createSupabaseAuthedClient dance above, for
// any Server Action that needs to call an RPC and have auth.uid() reliably
// resolve to the signed-in user (see the comment on createSupabaseAuthedClient
// for why the plain cookie client isn't enough for that). Returns a null
// client when there's no session, so callers can bail out cleanly.
export async function getAuthedServerClient(): Promise<{
  user: User | null;
  supabase: ReturnType<typeof createSupabaseAuthedClient> | null;
}> {
  const cookieClient = createSupabaseServerClient();
  const {
    data: { user },
  } = await cookieClient.auth.getUser();
  if (!user) return { user: null, supabase: null };
  const {
    data: { session },
  } = await cookieClient.auth.getSession();
  const token = session?.access_token;
  if (!token) return { user, supabase: null };
  return { user, supabase: createSupabaseAuthedClient(token) };
}

// Service-role client — bypasses RLS. ONLY for trusted server actions that have
// already validated the user. Returns null when the service key isn't set, so
// callers can fall back. NEVER import this into a client component.
export function createSupabaseServiceClient() {
  if (!supabaseServiceConfigured) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
