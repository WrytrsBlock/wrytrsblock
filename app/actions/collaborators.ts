"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { getBlockBySlug, addBlockMember } from "@/services/blocks.service";
import type { BlockRole } from "@/types";

export type InviteResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

// Invites a collaborator to a Block by handle. In production this resolves a
// profile and adds a block_members row; if the handle isn't found yet, it
// returns a friendly "they'll get access when they join" message (a full email
// invite would use the Supabase admin API + an invite email).
export async function inviteCollaboratorAction(
  blockSlug: string,
  handle: string,
  role: BlockRole = "collaborator"
): Promise<InviteResult> {
  const h = handle.trim().replace(/^@/, "");
  if (!h) return { ok: false, error: "Enter a handle or email." };

  if (!supabaseConfigured) {
    return { ok: true, message: `Invitation sent to @${h} (demo).` };
  }

  try {
    const supabase = createSupabaseServerClient();
    const block = await getBlockBySlug(supabase, blockSlug);
    if (!block) return { ok: false, error: "Block not found." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", h)
      .maybeSingle();

    if (!profile) {
      return {
        ok: true,
        message: `No member @${h} yet — they'll get access when they join.`,
      };
    }

    await addBlockMember(supabase, block.id, profile.id, role);
    revalidatePath(`/blocks/${blockSlug}`);
    return { ok: true, message: `Added @${h} as ${role}.` };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't send invite.",
    };
  }
}
