import type { Channel, ChannelKind, Message, UUID } from "@/types";
import type { DB } from "./types";

export async function listChannelsForBlock(
  supabase: DB,
  blockId: UUID
): Promise<Channel[]> {
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("block_id", blockId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Channel[]) ?? [];
}

export async function listChannelsForWorkspace(
  supabase: DB,
  workspaceId: UUID
): Promise<Channel[]> {
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Channel[]) ?? [];
}

export async function createChannel(
  supabase: DB,
  input: {
    workspace_id: UUID;
    block_id?: UUID;
    name: string;
    kind?: ChannelKind;
  }
): Promise<Channel> {
  const { data, error } = await supabase
    .from("channels")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as Channel;
}

export async function listMessages(
  supabase: DB,
  channelId: UUID,
  opts: { limit?: number; before?: string } = {}
): Promise<Message[]> {
  let q = supabase
    .from("messages")
    .select("*")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.before) q = q.lt("created_at", opts.before);
  const { data, error } = await q;
  if (error) throw error;
  return ((data as Message[]) ?? []).reverse();
}

export async function sendMessage(
  supabase: DB,
  input: { channel_id: UUID; body: string; reply_to?: UUID }
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as Message;
}

export async function editMessage(
  supabase: DB,
  messageId: UUID,
  body: string
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .update({ body, edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Message;
}

export async function deleteMessage(supabase: DB, messageId: UUID) {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);
  if (error) throw error;
}
