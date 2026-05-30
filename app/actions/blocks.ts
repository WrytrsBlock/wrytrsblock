"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { slugify } from "@/lib/cn";
import { createBlock } from "@/services/blocks.service";
import {
  createWorkspace,
  listWorkspacesForUser,
} from "@/services/workspaces.service";
import type { BlockKind, BlockType } from "@/types";

export type CreateBlockInput = {
  title: string;
  tagline?: string;
  kind?: BlockKind;
  blockType: BlockType;
};

export type ActionResult =
  | { ok: true; slug: string; blockType: BlockType }
  | { ok: false; error: string };

// Ensures the signed-in user has at least one workspace, creating a personal
// one on first use. Returns the workspace id to attach new Blocks to.
async function ensureWorkspace(): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const existing = await listWorkspacesForUser(supabase, user.id);
  if (existing.length > 0) return existing[0].id;

  const base =
    (user.user_metadata?.display_name as string) ??
    user.email?.split("@")[0] ??
    "studio";
  const ws = await createWorkspace(supabase, {
    name: `${base}'s Studio`,
    slug: `${slugify(base)}-${user.id.slice(0, 6)}`,
    description: "Personal workspace",
  });
  return ws.id;
}

export async function createBlockAction(
  input: CreateBlockInput
): Promise<ActionResult> {
  const title = input.title?.trim();
  if (!title) return { ok: false, error: "Give your Block a title." };

  const slug = slugify(title);
  const blockType: BlockType = input.blockType ?? "collaboration";

  // Demo mode (no Supabase): the slug routes to a synthesized Block workspace
  // so the create → land flow works without a backend.
  if (!supabaseConfigured) {
    return { ok: true, slug, blockType };
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You need to be signed in." };

    const workspaceId = await ensureWorkspace();
    if (!workspaceId)
      return { ok: false, error: "Couldn't resolve a workspace." };

    // Ensure slug uniqueness within the workspace by suffixing if needed.
    const block = await createBlock(supabase, {
      workspace_id: workspaceId,
      slug,
      title,
      tagline: input.tagline,
      block_type: blockType,
      kind: input.kind ?? "Other",
    }).catch(async () => {
      // Likely a unique-violation on (workspace_id, slug); retry with suffix.
      return createBlock(supabase, {
        workspace_id: workspaceId,
        slug: `${slug}-${Date.now().toString(36).slice(-4)}`,
        title,
        tagline: input.tagline,
        block_type: blockType,
        kind: input.kind ?? "Other",
      });
    });

    revalidatePath("/blocks");
    revalidatePath("/home");
    return { ok: true, slug: block.slug, blockType };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to create Block.",
    };
  }
}
