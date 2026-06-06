import type { UUID } from "@/types";
import type { DB } from "./types";

export type DMProfile = {
  id: UUID;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
};

export type DirectMessageRow = {
  id: UUID;
  conversation_id: UUID;
  sender_id: UUID;
  body: string;
  created_at: string;
};

// Find or create the 1:1 conversation with another user (atomic RPC).
export async function getOrCreateDm(
  supabase: DB,
  otherId: UUID
): Promise<UUID> {
  const { data, error } = await supabase.rpc("get_or_create_dm", {
    other_id: otherId,
  });
  if (error) throw error;
  return data as UUID;
}

export async function listMyConversationIds(
  supabase: DB,
  userId: UUID
): Promise<UUID[]> {
  const { data, error } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r: { conversation_id: UUID }) => r.conversation_id);
}

// The other participant's user_id per conversation. (Profiles are fetched
// separately — conversation_members has no direct FK to profiles, both point at
// auth.users, so a PostgREST embed isn't reliable.)
export async function listConversationOthers(
  supabase: DB,
  convIds: UUID[],
  userId: UUID
): Promise<{ conversation_id: UUID; user_id: UUID }[]> {
  if (!convIds.length) return [];
  const { data, error } = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id")
    .in("conversation_id", convIds)
    .neq("user_id", userId);
  if (error) throw error;
  return (data as { conversation_id: UUID; user_id: UUID }[]) ?? [];
}

export async function listProfilesByIds(
  supabase: DB,
  ids: UUID[]
): Promise<DMProfile[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, handle, avatar_url")
    .in("id", ids);
  if (error) throw error;
  return (data as DMProfile[]) ?? [];
}

export async function listLatestMessages(
  supabase: DB,
  convIds: UUID[]
): Promise<DirectMessageRow[]> {
  if (!convIds.length) return [];
  const { data, error } = await supabase
    .from("direct_messages")
    .select("*")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DirectMessageRow[]) ?? [];
}

export async function listDirectMessages(
  supabase: DB,
  convId: UUID
): Promise<DirectMessageRow[]> {
  const { data, error } = await supabase
    .from("direct_messages")
    .select("*")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as DirectMessageRow[]) ?? [];
}

export async function sendDirectMessage(
  supabase: DB,
  convId: UUID,
  senderId: UUID,
  body: string
): Promise<DirectMessageRow> {
  const { data, error } = await supabase
    .from("direct_messages")
    .insert({ conversation_id: convId, sender_id: senderId, body })
    .select("*")
    .single();
  if (error) throw error;
  return data as DirectMessageRow;
}
