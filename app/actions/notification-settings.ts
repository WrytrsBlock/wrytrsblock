"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import {
  getNotificationSettings,
  updateNotificationSetting,
} from "@/services/notification-settings.service";
import type { NotificationSettings } from "@/types";

const DEMO_SETTINGS: Omit<NotificationSettings, "user_id" | "updated_at"> = {
  email_notifications_enabled: true,
  email_chat_messages: true,
  email_file_uploads: true,
  email_voice_notes: true,
  email_block_members: true,
  email_split_updates: true,
};

export type NotificationSettingKey = keyof typeof DEMO_SETTINGS;

export async function getMyNotificationSettingsAction(): Promise<
  Pick<NotificationSettings, NotificationSettingKey>
> {
  if (!supabaseConfigured) return DEMO_SETTINGS;
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return DEMO_SETTINGS;
    return await getNotificationSettings(supabase, user.id);
  } catch {
    return DEMO_SETTINGS;
  }
}

export async function updateNotificationSettingAction(
  key: NotificationSettingKey,
  value: boolean
): Promise<{ ok: boolean }> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false };
    await updateNotificationSetting(supabase, user.id, { [key]: value });
    return { ok: true };
  } catch (e) {
    console.error("updateNotificationSettingAction failed:", e);
    return { ok: false };
  }
}
