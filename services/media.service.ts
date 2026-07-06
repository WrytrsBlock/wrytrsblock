import type { MediaAsset, MediaKind, UUID } from "@/types";
import type { DB } from "./types";

export const MEDIA_BUCKET = "block-media";

export async function listMediaForBlock(
  supabase: DB,
  blockId: UUID
): Promise<MediaAsset[]> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("block_id", blockId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as MediaAsset[]) ?? [];
}

export async function uploadMedia(
  supabase: DB,
  input: {
    workspace_id: UUID;
    block_id?: UUID;
    file: File;
    kind: MediaKind;
  }
): Promise<MediaAsset> {
  const ext = input.file.name.includes(".")
    ? input.file.name.split(".").pop()
    : "";
  const stamped = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}${ext ? "." + ext : ""}`;
  const path = `${input.workspace_id}/${input.block_id ?? "shared"}/${stamped}`;

  const { error: uploadErr } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, input.file, {
      cacheControl: "3600",
      upsert: false,
      contentType: input.file.type,
    });
  if (uploadErr) throw uploadErr;

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      workspace_id: input.workspace_id,
      block_id: input.block_id ?? null,
      name: input.file.name,
      kind: input.kind,
      size_bytes: input.file.size,
      storage_path: path,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as MediaAsset;
}

export async function getMediaAssetById(
  supabase: DB,
  id: UUID
): Promise<MediaAsset | null> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as MediaAsset | null) ?? null;
}

export function getPublicMediaUrl(supabase: DB, storagePath: string): string {
  const { data } = supabase.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function getSignedMediaUrl(
  supabase: DB,
  storagePath: string,
  expiresIn = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function deleteMedia(
  supabase: DB,
  asset: Pick<MediaAsset, "id" | "storage_path">
) {
  await supabase.storage.from(MEDIA_BUCKET).remove([asset.storage_path]);
  const { error } = await supabase
    .from("media_assets")
    .delete()
    .eq("id", asset.id);
  if (error) throw error;
}
