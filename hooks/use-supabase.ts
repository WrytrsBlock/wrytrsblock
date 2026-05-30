"use client";

import { useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/env";

// Memoized browser Supabase client. Returns null in demo mode (no env keys) so
// consumers can no-op instead of constructing a client with an empty URL —
// which the SDK rejects. Always guard: `const sb = useSupabase(); if (!sb) …`.
export function useSupabase(): SupabaseClient | null {
  return useMemo(
    () => (supabaseConfigured ? createSupabaseBrowserClient() : null),
    []
  );
}
