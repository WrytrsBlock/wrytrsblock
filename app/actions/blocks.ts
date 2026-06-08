"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseServerClient,
  createSupabaseAuthedClient,
} from "@/lib/supabase/server";
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

// Ensures the user has at least one workspace, creating a personal one on first
// use. Uses the passed (explicitly-authenticated) client so the workspace insert
// runs with the user's JWT — created_by = auth.uid() = userId passes RLS.
async function ensureWorkspace(
  supabase: SupabaseClient,
  userId: string,
  displayName: string
): Promise<string | null> {
  const existing = await listWorkspacesForUser(supabase, userId);
  if (existing.length > 0) return existing[0].id;

  const ws = await createWorkspace(supabase, {
    name: `${displayName}'s Studio`,
    slug: `${slugify(displayName)}-${userId.slice(0, 6)}`,
    description: "Personal workspace",
    created_by: userId,
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

  // Temporary runtime diagnostic surfaced in any error, so we can verify (1)
  // this code version is live and (2) what the DB actually sees.
  let diag = "[blk-at1]";

  try {
    // 1) Validate the session (getUser hits the auth server) and capture the
    //    access token so every write below carries the user's JWT explicitly.
    const cookieClient = createSupabaseServerClient();
    const {
      data: { user },
    } = await cookieClient.auth.getUser();
    if (!user) return { ok: false, error: "You need to be signed in." };

    // 2) Perform all writes AS the user, through RLS. We pass the user's access
    //    token via the `accessToken` option so supabase-js sends it as the
    //    bearer token — making auth.uid() = user.id so the standard policy
    //    (created_by = auth.uid()) passes. No service-role bypass.
    const {
      data: { session },
    } = await cookieClient.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken)
      return {
        ok: false,
        error: "Your session expired — please sign in again.",
      };
    const supabase = createSupabaseAuthedClient(accessToken);

    // Diagnostic: does the DB see this user via the authed client? Updating the
    // user's own creator_profiles row only touches a row when auth.uid() = id,
    // so this proves whether the JWT actually reached PostgREST.
    const tokenKind = accessToken.startsWith("eyJ")
      ? "jwt"
      : `other:${accessToken.slice(0, 6)}`;
    let authUidOk = "?";
    try {
      const probe = await supabase
        .from("creator_profiles")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select("id");
      authUidOk = (probe.data?.length ?? 0) > 0 ? "yes" : "no";
    } catch {
      authUidOk = "err";
    }
    diag = `[blk-at1 token=${tokenKind} authUid=${authUidOk}]`;

    const displayName =
      (user.user_metadata?.display_name as string) ??
      user.email?.split("@")[0] ??
      "studio";

    const workspaceId = await ensureWorkspace(supabase, user.id, displayName);
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
    return { ok: false, error: `${message} ${diag}` };
  }
}
