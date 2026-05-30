import type { MediaKind } from "@/types";

// Maps a file's MIME type / extension to our MediaKind union.
export function detectKind(file: { type: string; name: string }): MediaKind {
  const t = file.type.toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  if (t === "application/pdf") return "pdf";

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "avif", "heic"].includes(ext))
    return "image";
  if (["mp4", "mov", "webm", "m4v", "avi"].includes(ext)) return "video";
  if (["wav", "mp3", "aif", "aiff", "flac", "m4a", "ogg"].includes(ext))
    return "audio";
  if (ext === "pdf") return "pdf";
  return "doc";
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}
