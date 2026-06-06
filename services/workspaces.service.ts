import type {
  UUID,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from "@/types";
import type { DB } from "./types";

export async function listWorkspacesForUser(
  supabase: DB,
  userId: UUID
): Promise<Workspace[]> {
  // Joined select via workspace_members.
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(*)")
    .eq("user_id", userId);
  if (error) throw error;
  // Supabase types the embedded relation loosely; normalize whether it comes
  // back as a single object or an array.
  const rows = (data ?? []) as unknown as Array<{
    workspaces: Workspace | Workspace[] | null;
  }>;
  return rows.flatMap((r) =>
    Array.isArray(r.workspaces)
      ? r.workspaces
      : r.workspaces
      ? [r.workspaces]
      : []
  );
}

export async function getWorkspaceBySlug(
  supabase: DB,
  slug: string
): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Workspace | null) ?? null;
}

export async function createWorkspace(
  supabase: DB,
  input: { name: string; slug: string; description?: string; created_by?: UUID }
): Promise<Workspace> {
  const { data, error } = await supabase
    .from("workspaces")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as Workspace;
}

export async function listMembers(
  supabase: DB,
  workspaceId: UUID
): Promise<(WorkspaceMember & { profile?: unknown })[]> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("*, profile:profiles(*)")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return data ?? [];
}

export async function addMember(
  supabase: DB,
  workspaceId: UUID,
  userId: UUID,
  role: WorkspaceRole = "member"
) {
  const { error } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspaceId, user_id: userId, role });
  if (error) throw error;
}
