"use server";

import { revalidatePath } from "next/cache";
import {
  createSupabaseServerClient,
  createSupabaseAuthedClient,
} from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { slugify } from "@/lib/cn";
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

// Create a Block. The whole workspace + block + membership creation runs inside a
// SECURITY DEFINER database function (create_user_block), which:
//   • rejects anonymous callers (auth.uid() must be present),
//   • forces created_by = auth.uid() server-side,
//   • is not subject to table RLS (so it can't be blocked by policy drift).
// We call it with the user's JWT attached explicitly, so auth.uid() inside the
// function is the real signed-in user. Normal RLS stays enabled for reads/updates.
export async function createBlockAction(
  input: CreateBlockInput
): Promise<ActionResult> {
  const title = input.title?.trim();
  if (!title) return { ok: false, error: "Give your Block a title." };

  const blockType: BlockType = input.blockType ?? "collaboration";
  const slug = slugify(title);

  // Demo mode (no Supabase): synthesize the create → land flow.
  if (!supabaseConfigured) return { ok: true, slug, blockType };

  try {
    // Validate the session and capture the access token (1, 2, 3).
    const cookieClient = createSupabaseServerClient();
    const {
      data: { user },
    } = await cookieClient.auth.getUser();
    if (!user) return { ok: false, error: "You need to be signed in." };

    const {
      data: { session },
    } = await cookieClient.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken)
      return { ok: false, error: "Your session expired — please sign in again." };

    // Client carries the user's JWT → auth.uid() inside the RPC is the user.
    const supabase = createSupabaseAuthedClient(accessToken);

    const category =
      blockType === "collaboration" ? input.category ?? "Project" : null;
    const price = input.price && input.price > 0 ? input.price : null;
    const visibility = input.visibility ?? "Public";
    const party = blockType === "block_party" ? input.party ?? null : null;
    const inviteHandle = input.inviteHandle?.trim().replace(/^@/, "") || null;

    // (4) SECURITY DEFINER RPC creates workspace + block + memberships atomically.
    const { data, error } = await supabase.rpc("create_user_block", {
      p_title: title,
      p_tagline: input.tagline ?? null,
      p_block_type: blockType,
      p_kind: input.kind ?? "Other",
      p_category: category,
      p_price: price,
      p_visibility: visibility,
      p_party: party,
      p_invite_handle: inviteHandle,
    });
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    const newSlug =
      row && typeof row === "object" && "block_slug" in row
        ? ((row as { block_slug?: string }).block_slug ?? slug)
        : slug;

    revalidatePath("/blocks");
    revalidatePath("/marketplace");
    return { ok: true, slug: newSlug, blockType };
  } catch (e) {
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

export type DeleteBlockResult = { ok: true } | { ok: false; error: string };

// Permanently delete a Block (owner-only). Runs through the SECURITY DEFINER
// delete_user_block RPC, which validates the caller is the owner/lead and
// cascade-deletes everything connected to the Block. The user's JWT is attached
// so auth.uid() inside the function is the real signed-in user.
export async function deleteBlockAction(
  blockId: string
): Promise<DeleteBlockResult> {
  // Demo mode (no Supabase): treat as a successful no-op so the UI can redirect.
  if (!supabaseConfigured) return { ok: true };
  if (!blockId) return { ok: false, error: "Missing Block id." };

  try {
    const cookieClient = createSupabaseServerClient();
    const {
      data: { user },
    } = await cookieClient.auth.getUser();
    if (!user) return { ok: false, error: "You need to be signed in." };

    const {
      data: { session },
    } = await cookieClient.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken)
      return { ok: false, error: "Your session expired — please sign in again." };

    const supabase = createSupabaseAuthedClient(accessToken);
    const { error } = await supabase.rpc("delete_user_block", {
      p_block_id: blockId,
    });

    if (error) {
      const msg = error.message ?? "";
      if (error.code === "42501" || /owner/i.test(msg))
        return { ok: false, error: "Only the Block owner can delete this Block." };
      if (error.code === "P0002" || /not found/i.test(msg))
        return { ok: false, error: "This Block no longer exists." };
      throw error;
    }

    revalidatePath("/blocks");
    revalidatePath("/marketplace");
    revalidatePath("/", "layout"); // refresh the sidebar block list
    return { ok: true };
  } catch (e) {
    console.error("deleteBlockAction failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't delete this Block.",
    };
  }
}
