import type {
  BlockKind,
  BlockMember,
  BlockRow,
  BlockStatus,
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
    block_type?: "collaboration" | "service";
    status?: BlockStatus;
    kind?: BlockKind;
    cover_url?: string;
    tags?: string[];
    seeking?: string[];
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

export async function listBlockMembers(
  supabase: DB,
  blockId: UUID
): Promise<(BlockMember & { profile?: unknown })[]> {
  const { data, error } = await supabase
    .from("block_members")
    .select("*, profile:profiles(*)")
    .eq("block_id", blockId);
  if (error) throw error;
  return data ?? [];
}

export async function addBlockMember(
  supabase: DB,
  blockId: UUID,
  userId: UUID,
  role: BlockMember["role"] = "collaborator"
) {
  const { error } = await supabase
    .from("block_members")
    .insert({ block_id: blockId, user_id: userId, role });
  if (error) throw error;
}
