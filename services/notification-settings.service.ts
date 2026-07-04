import type { NotificationSettings, UUID } from "@/types";
import type { DB } from "./types";

const DEFAULTS: Omit<NotificationSettings, "user_id" | "updated_at"> = {
  email_notifications_enabled: true,
  email_chat_messages: true,
  email_file_uploads: true,
  email_voice_notes: true,
  email_block_members: true,
  email_split_updates: true,
};

// The row is seeded on signup (0026_notification_settings.sql), but fall back
// to all-on defaults if it's ever missing rather than failing the caller.
export async function getNotificationSettings(
  supabase: DB,
  userId: UUID
): Promise<NotificationSettings> {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as NotificationSettings;
  return { user_id: userId, updated_at: new Date().toISOString(), ...DEFAULTS };
}

export async function updateNotificationSetting(
  supabase: DB,
  userId: UUID,
  patch: Partial<Omit<NotificationSettings, "user_id" | "updated_at">>
): Promise<NotificationSettings> {
  const { data, error } = await supabase
    .from("notification_settings")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as NotificationSettings;
}
