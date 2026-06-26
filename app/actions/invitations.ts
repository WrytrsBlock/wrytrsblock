"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { getBlockBySlug } from "@/services/blocks.service";

// Single-block membership actions. Every membership mutation routes through a
// SECURITY DEFINER RPC (0018) so the rules (owner-only invite/remove/archive,
// decline/leave delete the row) are enforced server-side.
export type MembershipResult = { ok: true } | { ok: false; error: string };
// Back-compat alias for existing imports.
export type InvitationResult = MembershipResult;

function msg(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

function revalidateBlock(slug: string) {
  revalidatePath(`/blocks/${slug}`);
  revalidatePath("/blocks");
  revalidatePath("/home");
}

async function blockIdFor(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  slug: string
): Promise<string | null> {
  const block = await getBlockBySlug(supabase, slug);
  return block?.id ?? null;
}

// A member leaves the Block (membership removed; the Block lives on for others).
export async function leaveBlockAction(
  blockSlug: string
): Promise<MembershipResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sign in to leave." };

    const id = await blockIdFor(supabase, blockSlug);
    if (!id) return { ok: false, error: "Block not found." };

    const { error } = await supabase.rpc("leave_block", { p_block_id: id });
    if (error) return { ok: false, error: error.message };

    revalidateBlock(blockSlug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

// Owner removes a member from the Block.
export async function removeMemberAction(
  blockSlug: string,
  userId: string
): Promise<MembershipResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sign in to manage members." };

    const id = await blockIdFor(supabase, blockSlug);
    if (!id) return { ok: false, error: "Block not found." };

    const { error } = await supabase.rpc("remove_block_member", {
      p_block_id: id,
      p_user_id: userId,
    });
    if (error) return { ok: false, error: error.message };

    revalidateBlock(blockSlug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

// Owner archives the Block (kept readable, marked archived for everyone).
export async function archiveBlockAction(
  blockSlug: string
): Promise<MembershipResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sign in to archive." };

    const id = await blockIdFor(supabase, blockSlug);
    if (!id) return { ok: false, error: "Block not found." };

    const { error } = await supabase.rpc("archive_block", { p_block_id: id });
    if (error) return { ok: false, error: error.message };

    revalidateBlock(blockSlug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
