"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useSupabase } from "./use-supabase";

export function useUser() {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let alive = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading };
}
