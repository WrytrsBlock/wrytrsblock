-- ───────────────────────────────────────────────────────────────────────────
-- 0035_storage_bucket_limits.sql
-- Lock down the "avatars" (public) and "block-media" (private) buckets at the
-- Storage layer: neither had a file_size_limit or allowed_mime_types set
-- (0009_avatars_bucket.sql / 0001_init.sql), so Storage accepted any content
-- type and any size, relying entirely on client-side checks in
-- lib/upload-image.ts. Those are trivially bypassed (a caller can hit the
-- Storage API directly with any File object/contentType), so a malicious
-- upload — e.g. an `image/svg+xml` or `text/html` file renamed to `x.png` —
-- would previously be accepted and, for the PUBLIC "avatars" bucket, served
-- back with that same attacker-chosen Content-Type: a stored XSS payload
-- hosted on a trusted-looking URL. This migration makes Storage itself the
-- authoritative allow-list, which no client can bypass.
--
-- "avatars" carries images, demo audio, and demo video (see
-- lib/upload-image.ts's uploadToAvatars / uploadAudioToAvatars /
-- uploadVideoToAvatars), so its allow-list spans all three. "block-media"
-- carries Files-tab attachments of any practical document type plus chat
-- media, so its allow-list is broader but still explicitly excludes
-- HTML/SVG/script content types that a browser would execute or render as a
-- page if opened directly.
-- ───────────────────────────────────────────────────────────────────────────

update storage.buckets
set
  file_size_limit = 104857600, -- 100MB — matches MAX_VIDEO_BYTES (lib/upload-image.ts)
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp',
    'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac',
    'audio/ogg', 'audio/flac', 'audio/x-flac',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'
  ]
where id = 'avatars';

update storage.buckets
set
  file_size_limit = 104857600, -- 100MB
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac',
    'audio/ogg', 'audio/flac', 'audio/x-flac',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v',
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip'
  ]
where id = 'block-media';

notify pgrst, 'reload schema';
