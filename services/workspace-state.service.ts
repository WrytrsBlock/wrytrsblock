// Persists per-user, per-workspace UI state (pinned blocks, theme, etc).

import type { UUID, WorkspaceState } from "@/types";
import type { DB } from "./types";

export async function getWorkspaceState(
  supabase: DB,
  userId: UUID,
  workspaceId: UUID
): Promise<WorkspaceState | null> {
  const { data, error } = await supabase
    .from("workspace_state")
    .select("*")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  return (data as WorkspaceState | null) ?? null;
}

export async function upsertWorkspaceState(
  supabase: DB,
  userId: UUID,
  workspaceId: UUID,
  patch: Partial<
    Pick<
      WorkspaceState,
      "pinned_block_ids" | "last_block_id" | "sidebar_collapsed" | "theme"
    >
  >
) {
  const { error } = await supabase
    .from("workspace_state")
    .upsert(
      {
        user_id: userId,
        workspace_id: workspaceId,
        ...patch,
      },
      { onConflict: "user_id,workspace_id" }
    );
  if (error) throw error;
}
