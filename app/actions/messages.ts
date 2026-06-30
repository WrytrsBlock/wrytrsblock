"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { sendMessage } from "@/services/messages.service";
import { getBlockBySlug } from "@/services/blocks.service";
import { getSignedMediaUrl, uploadMedia } from "@/services/media.service";
import { encodeMedia } from "@/lib/chat-media";
import type { MediaKind } from "@/types";

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type SendMediaResult =
  | {
      ok: true;
      id: string;
      path: string;
      url: string | null;
      name: string;
      isImage: boolean;
    }
  | { ok: false; error: string };

// Sends a message to a channel. In demo mode this is a no-op success so the
// optimistic UI stands on its own; with Supabase it persists and realtime
// fans it out to other clients.
export async function sendMessageAction(
  channelId: string,
  body: string
): Promise<SendResult> {
  const text = body?.trim();
  if (!text) return { ok: false, error: "Message is empty." };

  if (!supabaseConfigured) {
    return { ok: true, id: `local-${Date.now()}` };
  }

  try {
    const supabase = createSupabaseServerClient();
    const msg = await sendMessage(supabase, { channel_id: channelId, body: text });
    return { ok: true, id: msg.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to send.",
    };
  }
}

// Uploads a voice note or file attachment to the Block's storage and posts it as
// a message so realtime delivers it to every other member (previously these
// lived only as local object URLs and never reached the other creator).
export async function sendMediaMessageAction(
  channelId: string,
  blockSlug: string,
  formData: FormData
): Promise<SendMediaResult> {
  const file = formData.get("file");
  const kind = (formData.get("kind") as MediaKind) ?? "doc";
  const caption = ((formData.get("caption") as string) ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file received." };
  }

  // Demo mode: the client keeps its local object-URL preview; nothing to fan out.
  if (!supabaseConfigured) {
    return {
      ok: true,
      id: `local-${Date.now()}`,
      path: "",
      url: null,
      name: file.name,
      isImage: file.type.startsWith("image/"),
    };
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

    const isImage = file.type.startsWith("image/");
    const body = encodeMedia({
      k: kind === "audio" ? "audio" : "file",
      p: asset.storage_path,
      n: asset.name,
      img: isImage,
      c: caption || undefined,
    });
    const msg = await sendMessage(supabase, { channel_id: channelId, body });
    const url = await getSignedMediaUrl(supabase, asset.storage_path);

    return {
      ok: true,
      id: msg.id,
      path: asset.storage_path,
      url,
      name: asset.name,
      isImage,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Upload failed.",
    };
  }
}
