"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { getBlockBySlug } from "@/services/blocks.service";
import {
  createProject,
  updateProjectStatus,
} from "@/services/projects.service";
import type { ProjectStatus } from "@/types";

export type MoveResult = { ok: true } | { ok: false; error: string };
export type CreateProjectResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

// Persists a card moving between board columns. No-op in demo mode so the
// optimistic UI is the source of truth without a backend.
export async function moveProjectAction(
  projectId: string,
  status: ProjectStatus,
  position?: number
): Promise<MoveResult> {
  if (!supabaseConfigured) return { ok: true };

  try {
    const supabase = createSupabaseServerClient();
    await updateProjectStatus(supabase, projectId, status, position);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Move failed.",
    };
  }
}

// Adds a task (project) to a Block's board in the given status column.
export async function createProjectAction(
  blockSlug: string,
  title: string,
  status: ProjectStatus = "todo"
): Promise<CreateProjectResult> {
  const text = title?.trim();
  if (!text) return { ok: false, error: "Task needs a title." };

  if (!supabaseConfigured) {
    return { ok: true, id: `local-${Date.now()}` };
  }

  try {
    const supabase = createSupabaseServerClient();
    const block = await getBlockBySlug(supabase, blockSlug);
    if (!block) return { ok: false, error: "Block not found." };

    const project = await createProject(supabase, {
      block_id: block.id,
      title: text,
      status,
    });
    return { ok: true, id: project.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't add task.",
    };
  }
}
