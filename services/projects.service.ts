// Projects = sub-units inside a Block (episodes, tracks, scenes, tasks).
// Used as the Kanban data source on the Block Workspace board.

import type { ProjectRow, ProjectStatus, UUID } from "@/types";
import type { DB } from "./types";

export async function listProjectsForBlock(
  supabase: DB,
  blockId: UUID
): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("block_id", blockId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data as ProjectRow[]) ?? [];
}

export async function createProject(
  supabase: DB,
  input: {
    block_id: UUID;
    title: string;
    description?: string;
    status?: ProjectStatus;
    assignee_id?: UUID;
    tag?: string;
    due_at?: string;
  }
): Promise<ProjectRow> {
  const { data, error } = await supabase
    .from("projects")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as ProjectRow;
}

export async function updateProjectStatus(
  supabase: DB,
  projectId: UUID,
  status: ProjectStatus,
  position?: number
) {
  const { error } = await supabase
    .from("projects")
    .update({ status, ...(position !== undefined ? { position } : {}) })
    .eq("id", projectId);
  if (error) throw error;
}

export async function deleteProject(supabase: DB, projectId: UUID) {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}
