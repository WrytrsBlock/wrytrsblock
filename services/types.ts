import type { SupabaseClient } from "@supabase/supabase-js";

// Common type used by all services. We intentionally don't tighten this to a
// generated Database<T> generic yet — once you run
// `supabase gen types typescript` you can change this single alias and every
// service will be type-safe end to end.
export type DB = SupabaseClient;
