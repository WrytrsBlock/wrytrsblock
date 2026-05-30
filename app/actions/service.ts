"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { getBlockBySlug } from "@/services/blocks.service";
import { upsertServiceDetails } from "@/services/service-blocks.service";

export type ServiceDetailsInput = {
  title: string;
  category: string;
  summary: string; // description
  scope: string[]; // what's included
  price: string;
  turnaround: string;
  revisions: string;
  requirements: string;
};

export type ServiceDetailsResult =
  | { ok: true }
  | { ok: false; error: string };

// Saves Service Block details. Demo mode is a no-op success (the panel keeps
// the data in local state); with Supabase it upserts into `service_details`.
export async function saveServiceDetailsAction(
  blockSlug: string,
  input: ServiceDetailsInput
): Promise<ServiceDetailsResult> {
  if (!input.summary?.trim() && !input.title?.trim()) {
    return { ok: false, error: "Add at least a title and description." };
  }

  if (!supabaseConfigured) return { ok: true };

  try {
    const supabase = createSupabaseServerClient();
    const block = await getBlockBySlug(supabase, blockSlug);
    if (!block) return { ok: false, error: "Block not found." };

    await upsertServiceDetails(supabase, block.id, {
      title: input.title,
      category: input.category,
      summary: input.summary,
      scope: input.scope,
      price: input.price,
      turnaround: input.turnaround,
      revisions: input.revisions,
      requirements: input.requirements,
    });

    revalidatePath(`/blocks/${blockSlug}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't save service details.",
    };
  }
}
