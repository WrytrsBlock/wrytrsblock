import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Image formats we accept for avatars + banners: JPG / JPEG / PNG / WEBP.
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg", // covers .jpg and .jpeg
  "image/png",
  "image/webp",
] as const;

// Value for the file input's `accept` attribute — both extensions and MIME
// types so the native picker pre-filters to supported images.
export const IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

// Human-friendly hint shown next to the picker.
export const IMAGE_FORMATS_HINT = "Supported formats: JPG, PNG, WEBP";

// Reasonable upload ceiling.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// Validate a selected file before uploading. Returns a friendly error string,
// or null when the file is an acceptable image within the size limit. Detection
// is lenient (MIME *or* extension) so we don't reject valid files whose MIME
// type the browser left blank.
export function validateImageFile(file: File): string | null {
  const type = file.type.toLowerCase();
  const extOk = /\.(jpe?g|png|webp)$/i.test(file.name);
  const typeOk = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
  if (!typeOk && !extOk) {
    return "Please upload a JPG, PNG, or WEBP image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "That image is over 5MB. Please upload a smaller file.";
  }
  return null;
}

// Upload an image to the public "avatars" bucket under the signed-in user's
// folder and return its public URL. `prefix` distinguishes avatar vs banner.
// Throws on failure (validation or storage) so callers can surface the error.
export async function uploadToAvatars(
  file: File,
  prefix: "avatar" | "banner" | "portfolio"
): Promise<string | null> {
  // Defense-in-depth: validate here too, in case a caller skipped it.
  const invalid = validateImageFile(file);
  if (invalid) throw new Error(invalid);

  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in to upload an image.");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user.id}/${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;

  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}
