import type { UUID } from "@/types";
import type { DB } from "./types";

export type BlockRequestStatus = "pending" | "accepted" | "declined";

export type BlockRequestRow = {
  id: UUID;
  requester_id: UUID;
  recipient_id: UUID;
  requester_name: string | null;
  requester_handle: string | null;
  block_title: string;
  block_type: "collaboration" | "service" | "block_party";
  intro_message: string;
  expected_outcome: string | null;
  status: BlockRequestStatus;
  block_id: UUID | null;
  created_at: string;
  responded_at: string | null;
};

export async function createBlockRequest(
  supabase: DB,
  input: {
    requester_id: UUID;
    recipient_id: UUID;
    requester_name?: string | null;
    requester_handle?: string | null;
    block_title: string;
    block_type: "collaboration" | "service" | "block_party";
    intro_message: string;
    expected_outcome?: string | null;
  }
): Promise<BlockRequestRow> {
  const { data, error } = await supabase
    .from("block_requests")
    .insert({
      requester_id: input.requester_id,
      recipient_id: input.recipient_id,
      requester_name: input.requester_name ?? null,
      requester_handle: input.requester_handle ?? null,
      block_title: input.block_title,
      block_type: input.block_type,
      intro_message: input.intro_message,
      expected_outcome: input.expected_outcome ?? null,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as BlockRequestRow;
}

// Pending requests waiting on the signed-in user to accept or decline.
export async function listIncomingRequests(
  supabase: DB,
  userId: UUID
): Promise<BlockRequestRow[]> {
  const { data, error } = await supabase
    .from("block_requests")
    .select("*")
    .eq("recipient_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BlockRequestRow[];
}

// Pending requests the signed-in user has SENT and is waiting to hear back on.
export async function listOutgoingRequests(
  supabase: DB,
  userId: UUID
): Promise<BlockRequestRow[]> {
  const { data, error } = await supabase
    .from("block_requests")
    .select("*")
    .eq("requester_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BlockRequestRow[];
}

export async function getBlockRequest(
  supabase: DB,
  id: UUID
): Promise<BlockRequestRow | null> {
  const { data } = await supabase
    .from("block_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as BlockRequestRow) ?? null;
}

export async function setBlockRequestResponse(
  supabase: DB,
  id: UUID,
  status: "accepted" | "declined",
  blockId?: UUID | null
): Promise<void> {
  const { error } = await supabase
    .from("block_requests")
    .update({
      status,
      block_id: blockId ?? null,
      responded_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}
