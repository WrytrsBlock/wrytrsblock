"use server";

import { createSupabaseServerClient, getAuthedServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { getBlockBySlug } from "@/services/blocks.service";
import { getProfile } from "@/services/profiles.service";
import { getSignedMediaUrl, uploadMedia } from "@/services/media.service";
import { notifyBlockActivity } from "@/lib/notify";
import { fileUploadEmail } from "@/lib/email-templates";
import type { MediaKind } from "@/types";

export type UploadResult =
  | { ok: true; id: string; url: string | null; name: string }
  | { ok: false; error: string };

// Best-effort "new file uploaded" fan-out — the upload itself already
// succeeded by the time this runs, so a failure here is only ever logged.
async function notifyFileUpload(
  block: { id: string; slug: string; title: string },
  fileName: string,
  fileType?: string
) {
  try {
    const { user, supabase } = await getAuthedServerClient();
    if (!user || !supabase) return;
    const actor = await getProfile(supabase, user.id).catch(() => null);
    const uploaderName = actor?.display_name || actor?.handle || "A collaborator";

    await notifyBlockActivity(supabase, {
      blockId: block.id,
      kind: "upload",
      title: `New file uploaded in "${block.title}"`,
      body: `${uploaderName} uploaded ${fileName}.`,
      link: `/blocks/${block.slug}?tab=files`,
      buildEmail: () =>
        fileUploadEmail({
          uploaderName,
          blockTitle: block.title,
          fileName,
          fileType,
          blockSlug: block.slug,
        }),
    });
  } catch (e) {
    console.error("notifyFileUpload failed:", e);
  }
}

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
    await notifyFileUpload(block, asset.name, file.type || undefined);

    return { ok: true, id: asset.id, url, name: asset.name };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Upload failed.",
    };
  }
}
