import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

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
