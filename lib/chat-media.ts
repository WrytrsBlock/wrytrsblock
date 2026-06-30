// Shared encoding for chat media (voice notes + file attachments). The
// `messages.body` column is plain text, so rather than a schema change we encode
// media as a marker + JSON metadata in the body. Plain text messages never
// contain the marker, so decoding is unambiguous and the payload fans out to
// every member over the same realtime channel as normal messages.
export const MEDIA_MARK = "wbmedia";

export type ChatMedia = {
  k: "audio" | "file"; // voice note vs. generic file attachment
  p: string; // storage path in the block-media bucket
  n: string; // original file name
  img?: boolean; // render inline as an image
  c?: string; // optional caption / accompanying text
};

export function encodeMedia(m: ChatMedia): string {
  return MEDIA_MARK + JSON.stringify(m);
}

export function decodeMedia(body: string | null | undefined): ChatMedia | null {
  if (!body || !body.startsWith(MEDIA_MARK)) return null;
  try {
    return JSON.parse(body.slice(MEDIA_MARK.length)) as ChatMedia;
  } catch {
    return null;
  }
}
