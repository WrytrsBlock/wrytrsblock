import type {
  BlockCategory,
  BlockKind,
  BlockMember,
  BlockPartyData,
  BlockRow,
  BlockStatus,
  BlockType,
  BlockVisibility,
  ISODate,
  UUID,
} from "@/types";
import type { DB } from "./types";

export async function listBlocksForWorkspace(
  supabase: DB,
  workspaceId: UUID
): Promise<BlockRow[]> {
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as BlockRow[]) ?? [];
}

export async function getBlockBySlug(
  supabase: DB,
  slug: string
): Promise<BlockRow | null> {
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as BlockRow | null) ?? null;
}

export async function createBlock(
  supabase: DB,
  input: {
    workspace_id: UUID;
    slug: string;
    title: string;
    tagline?: string;
    block_type?: BlockType;
    status?: BlockStatus;
    kind?: BlockKind;
    category?: BlockCategory;
    price?: number | null;
    visibility?: BlockVisibility;
    party?: BlockPartyData | null;
    cover_url?: string;
    tags?: string[];
    seeking?: string[];
    created_by?: UUID;
    lead_id?: UUID;
  }
): Promise<BlockRow> {
  const { data, error } = await supabase
    .from("blocks")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as BlockRow;
}

export async function updateBlock(
  supabase: DB,
  blockId: UUID,
  patch: Partial<
    Pick<
      BlockRow,
      | "title"
      | "tagline"
      | "status"
      | "kind"
      | "progress"
      | "deadline"
      | "cover_url"
      | "tags"
      | "budget"
      | "lead_id"
    >
  >
): Promise<BlockRow> {
  const { data, error } = await supabase
    .from("blocks")
    .update(patch)
    .eq("id", blockId)
    .select("*")
    .single();
  if (error) throw error;
  return data as BlockRow;
}

export type BlockMemberStatus = "invited" | "accepted" | "declined";

export type BlockMemberWithProfile = BlockMember & {
  status: BlockMemberStatus;
  invited_by: UUID | null;
  invited_at: ISODate | null;
  profile?: {
    id: UUID;
    display_name: string | null;
    handle: string | null;
    role: string | null;
    avatar_url: string | null;
  } | null;
};

export async function listBlockMembers(
  supabase: DB,
  blockId: UUID
): Promise<BlockMemberWithProfile[]> {
  const { data, error } = await supabase
    .from("block_members")
    .select(
      "*, profile:profiles(id, display_name, handle, role, avatar_url)"
    )
    .eq("block_id", blockId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data as BlockMemberWithProfile[]) ?? [];
}

// The signed-in user's membership on a Block (for the invite banner / gating).
export async function getMembership(
  supabase: DB,
  blockId: UUID,
  userId: UUID
): Promise<BlockMemberWithProfile | null> {
  const { data, error } = await supabase
    .from("block_members")
    .select("*")
    .eq("block_id", blockId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as BlockMemberWithProfile | null) ?? null;
}

// Blocks the user has been invited to but hasn't answered yet.
export async function listMyInvitations(
  supabase: DB,
  userId: UUID
): Promise<(BlockMemberWithProfile & { block?: unknown })[]> {
  const { data, error } = await supabase
    .from("block_members")
    .select("*, block:blocks(id, slug, title, tagline, block_type, cover_url)")
    .eq("user_id", userId)
    .eq("status", "invited")
    .order("invited_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Add (or invite) a member. Idempotent on (block_id, user_id) — never downgrades
// an existing accepted member back to invited.
export async function addBlockMember(
  supabase: DB,
  blockId: UUID,
  userId: UUID,
  role: BlockMember["role"] = "collaborator",
  opts?: { status?: BlockMemberStatus; invitedBy?: UUID }
) {
  const status = opts?.status ?? "accepted";
  const row: Record<string, unknown> = {
    block_id: blockId,
    user_id: userId,
    role,
    status,
  };
  if (status === "invited") {
    row.invited_by = opts?.invitedBy ?? null;
    row.invited_at = new Date().toISOString();
  }
  const { error } = await supabase
    .from("block_members")
    .upsert(row, { onConflict: "block_id,user_id", ignoreDuplicates: true });
  if (error) throw error;
}

// Invitee responds to an invitation.
export async function setMembershipStatus(
  supabase: DB,
  blockId: UUID,
  userId: UUID,
  status: BlockMemberStatus
) {
  const { error } = await supabase
    .from("block_members")
    .update({ status, joined_at: new Date().toISOString() })
    .eq("block_id", blockId)
    .eq("user_id", userId);
  if (error) throw error;
}
