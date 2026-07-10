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
import { getProfiles } from "./profiles.service";

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

// Membership-based "My Blocks": every Block the signed-in user belongs to —
// owner, active member, or still invited — joined with their own role + status.
// This is the single source of truth for the My Blocks list, so all members see
// the SAME Block (no per-user duplication, no workspace scoping).
export type MyBlockRow = BlockRow & {
  my_role: BlockMember["role"];
  my_status: BlockMemberStatus;
  // Total members on the Block (so surfaces can show "+N" without an N+1 fetch).
  member_count: number;
};

export async function listMyBlocks(
  supabase: DB,
  userId: UUID
): Promise<MyBlockRow[]> {
  const { data, error } = await supabase
    .from("block_members")
    .select("role, status, block:blocks(*, members:block_members(count))")
    .eq("user_id", userId);
  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    role: BlockMember["role"];
    status: BlockMemberStatus;
    block: (BlockRow & { members?: { count: number }[] }) | null;
  }[];

  return rows
    .filter((r) => r.block) // membership with a live Block
    .map((r) => ({
      ...(r.block as BlockRow),
      my_role: r.role,
      my_status: r.status,
      member_count: (r.block as { members?: { count: number }[] }).members?.[0]?.count ?? 1,
    }))
    .sort(
      (a, b) =>
        new Date(b.updated_at ?? 0).getTime() -
        new Date(a.updated_at ?? 0).getTime()
    );
}

export async function getBlockBySlug(
  supabase: DB,
  slug: string
): Promise<BlockRow | null> {
  // Slugs are unique per workspace, not globally — and RLS already limits rows
  // to Blocks the caller can see. Use limit(1) instead of maybeSingle() so a
  // member never 404s just because two workspaces share a slug.
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("slug", slug)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return ((data as BlockRow[] | null)?.[0]) ?? null;
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

// Two separate queries rather than a PostgREST embed (`profile:profiles(...)`)
// — block_members.user_id references auth.users, not public.profiles, so
// PostgREST has no FK path to embed profiles directly and errors with
// PGRST200 ("no matches were found") on every call.
export async function listBlockMembers(
  supabase: DB,
  blockId: UUID
): Promise<BlockMemberWithProfile[]> {
  const { data, error } = await supabase
    .from("block_members")
    .select("*")
    .eq("block_id", blockId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  const members = (data as BlockMemberWithProfile[]) ?? [];
  if (members.length === 0) return members;

  const profiles = await getProfiles(
    supabase,
    members.map((m) => m.user_id)
  );
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  return members.map((m) => ({
    ...m,
    profile: profileById.get(m.user_id) ?? null,
  }));
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

// NOTE: collaboration membership is created exclusively by the canonical Block
// Request flow (accept_block_request adds both creators as accepted members).
// There is no client-side "invite as pending" path, so the former
// listMyInvitations / addBlockMember / setMembershipStatus helpers were removed.
