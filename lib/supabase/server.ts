import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component — the middleware will refresh.
        }
      },
      remove(name: string, options) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Called from a Server Component — the middleware will refresh.
        }
      },
    },
  });
}
