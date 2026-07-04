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
// folder and return its public URL. `prefix` distinguishes avatar vs banner vs
// a Block cover. Throws on failure (validation or storage) so callers can
// surface the error.
export async function uploadToAvatars(
  file: File,
  prefix: "avatar" | "banner" | "portfolio" | "block-cover"
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

// ── Audio (demos) ───────────────────────────────────────────────────────────
// Common hosted audio formats we accept for demo uploads.
export const ACCEPTED_AUDIO_EXTS = ["mp3", "wav", "m4a", "aac", "ogg", "flac"];

// `accept` attribute for the demo file picker — extensions + the broad
// `audio/*` MIME so the native picker pre-filters to audio files.
export const AUDIO_ACCEPT = ".mp3,.wav,.m4a,.aac,.ogg,.flac,audio/*";

export const AUDIO_FORMATS_HINT = "MP3, WAV, M4A, AAC, OGG, or FLAC · up to 30MB";

// Demos can be larger than images.
export const MAX_AUDIO_BYTES = 30 * 1024 * 1024; // 30MB

// Validate a selected audio file. Lenient detection (MIME *or* extension) so we
// don't reject valid files whose MIME the browser left blank.
export function validateAudioFile(file: File): string | null {
  const extOk = /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name);
  const typeOk = file.type.toLowerCase().startsWith("audio/");
  if (!typeOk && !extOk) {
    return "Please upload an MP3, WAV, M4A, AAC, OGG, or FLAC file.";
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return "That file is over 30MB. Please upload a smaller demo.";
  }
  return null;
}

// Upload a demo audio file to the public "avatars" bucket under the signed-in
// user's folder and return its public URL. The URL keeps the audio extension so
// `isDirectAudio()` recognizes it and renders a native <audio> player. Throws on
// failure so callers can surface the error.
export async function uploadAudioToAvatars(file: File): Promise<string | null> {
  const invalid = validateAudioFile(file);
  if (invalid) throw new Error(invalid);

  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in to upload a demo.");

  const ext = (file.name.split(".").pop() || "mp3").toLowerCase();
  const path = `${user.id}/demo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
      contentType: file.type || "audio/mpeg",
    });
  if (error) throw error;

  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

// ── Video (demos) ───────────────────────────────────────────────────────────
export const VIDEO_ACCEPT = ".mp4,.webm,.mov,.m4v,video/*";

export const VIDEO_FORMATS_HINT = "MP4, WebM, MOV, or M4V · up to 100MB";

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

export function validateVideoFile(file: File): string | null {
  const extOk = /\.(mp4|webm|mov|m4v)$/i.test(file.name);
  const typeOk = file.type.toLowerCase().startsWith("video/");
  if (!typeOk && !extOk) {
    return "Please upload an MP4, WebM, MOV, or M4V file.";
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return "That file is over 100MB. Please upload a smaller video.";
  }
  return null;
}

export async function uploadVideoToAvatars(file: File): Promise<string | null> {
  const invalid = validateVideoFile(file);
  if (invalid) throw new Error(invalid);

  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in to upload a video.");

  const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
  const path = `${user.id}/demo-video-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
      contentType: file.type || "video/mp4",
    });
  if (error) throw error;

  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}
