"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { sendMessage } from "@/services/messages.service";

export type SendResult =
  | { ok: true; id: string }
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
