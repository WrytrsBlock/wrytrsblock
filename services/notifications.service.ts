import type { Notification, UUID } from "@/types";
import type { DB } from "./types";

export async function listNotifications(
  supabase: DB,
  userId: UUID,
  opts: { unreadOnly?: boolean; limit?: number } = {}
): Promise<Notification[]> {
  let q = supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.unreadOnly) q = q.is("read_at", null);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Notification[]) ?? [];
}

export async function markAllRead(supabase: DB, userId: UUID) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .is("read_at", null);
  if (error) throw error;
}

export async function markRead(supabase: DB, notificationId: UUID) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) throw error;
}
