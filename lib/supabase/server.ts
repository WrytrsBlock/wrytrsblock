import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
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

// A request-scoped client that attaches the signed-in user's access token
// DIRECTLY as the Authorization header. Use this for RLS-protected writes in
// Server Actions: it guarantees the database sees the user's JWT (so auth.uid()
// is the real user id) even if cookie-based session propagation is unreliable.
// Stateless — never persists or refreshes the session.
export function createSupabaseAuthedClient(accessToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
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
