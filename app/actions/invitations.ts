"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import {
  getBlockBySlug,
  setMembershipStatus,
} from "@/services/blocks.service";

export type InvitationResult = { ok: true } | { ok: false; error: string };

// Invitee accepts or declines a Block invitation (updates their own
// block_members row). No-op success in demo mode.
export async function respondToInvitationAction(
  blockSlug: string,
  accept: boolean
): Promise<InvitationResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sign in to respond." };

    const block = await getBlockBySlug(supabase, blockSlug);
    if (!block) return { ok: false, error: "Block not found." };

    await setMembershipStatus(
      supabase,
      block.id,
      user.id,
      accept ? "accepted" : "declined"
    );
    revalidatePath(`/blocks/${blockSlug}`);
    revalidatePath("/blocks");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't respond to invite.",
    };
  }
}
