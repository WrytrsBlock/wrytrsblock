"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { upsertCreatorProfile } from "@/services/creator-profiles.service";
import type { FeaturedContentItem } from "@/types";

export type ShowcaseResult = { ok: true } | { ok: false; error: string };

// Persist a creator's Block Showcase (creator_profiles.featured_content) for the
// signed-in user. Saves the full ordered array so order + pinning stick. Uses
// the cookie server client — the same path profile saves already use.
export async function updateShowcaseAction(
  items: FeaturedContentItem[]
): Promise<ShowcaseResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You need to be signed in." };

    // Sanitize + cap. Only persist known fields; drop empty optionals.
    const clean: FeaturedContentItem[] = items.slice(0, 9).map((i) => ({
      id: i.id,
      type: i.type,
      url: (i.url ?? "").trim(),
      ...(i.title?.trim() ? { title: i.title.trim() } : {}),
      ...(i.subtitle?.trim() ? { subtitle: i.subtitle.trim() } : {}),
      ...(i.thumbnail?.trim() ? { thumbnail: i.thumbnail.trim() } : {}),
      ...(i.body?.trim() ? { body: i.body.trim() } : {}),
      ...(i.pinned ? { pinned: true } : {}),
      ...(i.featured ? { featured: true } : {}),
    }));

    let handle: string | null = null;
    try {
      const row = await upsertCreatorProfile(supabase, {
        id: user.id,
        featured_content: clean,
      } as Parameters<typeof upsertCreatorProfile>[1]);
      handle = row.handle ?? null;
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
      if (msg.includes("featured_content")) {
        return {
          ok: false,
          error:
            "Your Block Showcase couldn't be saved yet — the database migration 0011_featured_content hasn't been applied.",
        };
      }
      throw e;
    }

    revalidatePath("/profile");
    revalidatePath("/marketplace");
    if (handle) revalidatePath(`/profile/${handle}`);
    return { ok: true };
  } catch (e) {
    console.error("updateShowcaseAction failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't save your showcase.",
    };
  }
}
