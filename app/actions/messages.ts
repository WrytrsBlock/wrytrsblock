"use server";

import { createSupabaseServerClient, getAuthedServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { getBlockByChannelId, sendMessage } from "@/services/messages.service";
import { getBlockBySlug } from "@/services/blocks.service";
import { getProfile } from "@/services/profiles.service";
import { getSignedMediaUrl, uploadMedia } from "@/services/media.service";
import { encodeMedia } from "@/lib/chat-media";
import { notifyBlockActivity } from "@/lib/notify";
import { chatMessageEmail, fileUploadEmail, voiceNoteEmail } from "@/lib/email-templates";
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

// Fans out the "new message" notification for a Block. Best-effort and never
// thrown to the caller — the message itself already sent successfully.
async function notifyNewMessage(block: { id: string; slug: string; title: string }, text: string) {
  try {
    const { user, supabase } = await getAuthedServerClient();
    if (!user || !supabase) return;
    const actor = await getProfile(supabase, user.id).catch(() => null);
    const senderName = actor?.display_name || actor?.handle || "A collaborator";

    await notifyBlockActivity(supabase, {
      blockId: block.id,
      kind: "message",
      title: `New message in "${block.title}"`,
      body: `${senderName}: ${text.slice(0, 150)}`,
      link: `/blocks/${block.slug}`,
      buildEmail: () =>
        chatMessageEmail({
          senderName,
          blockTitle: block.title,
          messageBody: text,
          blockSlug: block.slug,
        }),
    });
  } catch (e) {
    console.error("notifyNewMessage failed:", e);
  }
}

async function notifyMediaMessage(
  block: { id: string; slug: string; title: string },
  input:
    | { kind: "voice_note"; durationSeconds: number }
    | { kind: "upload"; fileName: string; fileType?: string }
) {
  try {
    const { user, supabase } = await getAuthedServerClient();
    if (!user || !supabase) return;
    const actor = await getProfile(supabase, user.id).catch(() => null);
    const senderName = actor?.display_name || actor?.handle || "A collaborator";

    if (input.kind === "voice_note") {
      await notifyBlockActivity(supabase, {
        blockId: block.id,
        kind: "voice_note",
        title: `New voice note in "${block.title}"`,
        body: `${senderName} sent a voice note.`,
        link: `/blocks/${block.slug}`,
        buildEmail: () =>
          voiceNoteEmail({
            senderName,
            blockTitle: block.title,
            durationSeconds: input.durationSeconds,
            blockSlug: block.slug,
          }),
      });
    } else {
      await notifyBlockActivity(supabase, {
        blockId: block.id,
        kind: "upload",
        title: `New file uploaded in "${block.title}"`,
        body: `${senderName} uploaded ${input.fileName}.`,
        link: `/blocks/${block.slug}?tab=files`,
        buildEmail: () =>
          fileUploadEmail({
            uploaderName: senderName,
            blockTitle: block.title,
            fileName: input.fileName,
            fileType: input.fileType,
            blockSlug: block.slug,
          }),
      });
    }
  } catch (e) {
    console.error("notifyMediaMessage failed:", e);
  }
}

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

    const block = await getBlockByChannelId(supabase, channelId).catch(() => null);
    if (block) await notifyNewMessage(block, text);

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
  const durationSeconds = Number(formData.get("durationSeconds") ?? 0) || 0;

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

    if (kind === "audio") {
      await notifyMediaMessage(block, { kind: "voice_note", durationSeconds });
    } else {
      await notifyMediaMessage(block, {
        kind: "upload",
        fileName: asset.name,
        fileType: file.type || undefined,
      });
    }

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
