"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { markAllRead } from "@/services/notifications.service";
import { getNotifications, type NotificationView } from "@/lib/data";

// Client surfaces (the bell menu) fetch real notifications through this. `demo`
// lets the client fall back to illustrative seed data when Supabase isn't wired.
export async function getMyNotificationsAction(): Promise<{
  demo: boolean;
  items: NotificationView[];
}> {
  if (!supabaseConfigured) return { demo: true, items: [] };
  return { demo: false, items: await getNotifications() };
}

export async function markAllNotificationsReadAction(): Promise<{ ok: boolean }> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false };
    await markAllRead(supabase, user.id);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
