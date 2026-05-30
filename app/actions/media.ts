"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { getBlockBySlug } from "@/services/blocks.service";
import { getSignedMediaUrl, uploadMedia } from "@/services/media.service";
import type { MediaKind } from "@/types";

export type UploadResult =
  | { ok: true; id: string; url: string | null; name: string }
  | { ok: false; error: string };

// Uploads a single file for a Block. The browser sends the File via FormData;
// the action resolves the Block's workspace server-side (so the storage path
// and RLS line up) and returns a signed URL for immediate preview.
export async function uploadMediaAction(
  blockSlug: string,
  formData: FormData
): Promise<UploadResult> {
  const file = formData.get("file");
  const kind = (formData.get("kind") as MediaKind) ?? "doc";

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file received." };
  }

  // Demo mode: the client already holds an object-URL preview, so just ack.
  if (!supabaseConfigured) {
    return { ok: true, id: `local-${Date.now()}`, url: null, name: file.name };
  }

  try {
    const supabase = createSupabaseServerClient();
    const block = await getBlockBySlug(supabase, blockSlug);
    if (!block) return { ok: false, error: "Block not found." };

    const asset = await uploadMedia(supabase, {
      workspace_id: block.workspace_id,
      block_id: block.id,
      file,
      kind,
    });

    const url = await getSignedMediaUrl(supabase, asset.storage_path);
    return { ok: true, id: asset.id, url, name: asset.name };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Upload failed.",
    };
  }
}
