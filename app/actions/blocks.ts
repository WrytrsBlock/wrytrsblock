"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { slugify } from "@/lib/cn";
import { createBlock, addBlockMember } from "@/services/blocks.service";
import { getCreatorIdByHandle } from "@/services/creator-profiles.service";
import {
  createWorkspace,
  listWorkspacesForUser,
} from "@/services/workspaces.service";
import type {
  BlockCategory,
  BlockKind,
  BlockPartyData,
  BlockType,
  BlockVisibility,
} from "@/types";

export type CreateBlockInput = {
  title: string;
  tagline?: string;
  kind?: BlockKind;
  blockType: BlockType;
  category?: BlockCategory;
  price?: number | null;
  visibility?: BlockVisibility;
  party?: BlockPartyData | null;
  // When started from a creator (marketplace/profile), invite them in.
  inviteHandle?: string;
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
    // Required so the workspace insert passes RLS and the owner-membership
    // trigger adds the creator (otherwise block inserts fail).
    created_by: user.id,
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
    const category =
      blockType === "collaboration" ? input.category ?? "Project" : undefined;
    const price = input.price && input.price > 0 ? input.price : null;
    const visibility = input.visibility ?? "Public";
    const party = blockType === "block_party" ? input.party ?? null : null;
    // created_by + lead_id are required for the blocks-insert RLS check
    // (created_by = auth.uid()).
    const base = {
      workspace_id: workspaceId,
      title,
      tagline: input.tagline,
      block_type: blockType,
      kind: input.kind ?? "Other",
      category,
      price,
      visibility,
      party,
      created_by: user.id,
      lead_id: user.id,
    };
    const block = await createBlock(supabase, { ...base, slug }).catch(
      async (firstErr) => {
        // Likely a unique-violation on (workspace_id, slug); retry with suffix.
        console.error("createBlock failed (retrying with suffixed slug):", firstErr);
        return createBlock(supabase, {
          ...base,
          slug: `${slug}-${Date.now().toString(36).slice(-4)}`,
        });
      }
    );

    // The creator who started the Block is its lead member.
    await addBlockMember(supabase, block.id, user.id, "lead", {
      status: "accepted",
    }).catch(() => {});

    // Started from a creator? Invite them in (pending until they accept).
    const inviteHandle = input.inviteHandle?.trim().replace(/^@/, "");
    if (inviteHandle) {
      const inviteeId = await getCreatorIdByHandle(supabase, inviteHandle).catch(
        () => null
      );
      if (inviteeId && inviteeId !== user.id) {
        await addBlockMember(supabase, block.id, inviteeId, "collaborator", {
          status: "invited",
          invitedBy: user.id,
        }).catch(() => {});
      }
    }

    revalidatePath("/blocks");
    revalidatePath("/marketplace");
    return { ok: true, slug: block.slug, blockType };
  } catch (e) {
    // Surface the real error (Supabase errors are plain objects, not Errors).
    console.error("createBlockAction failed:", e);
    const message =
      e instanceof Error
        ? e.message
        : e && typeof e === "object" && "message" in e
        ? String((e as { message: unknown }).message)
        : "Failed to create Block.";
    return { ok: false, error: message };
  }
}
