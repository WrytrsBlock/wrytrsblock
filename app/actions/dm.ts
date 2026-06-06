"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { sendDirectMessage } from "@/services/dm.service";

export type SendDmResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

// Send a direct message into a conversation. No-op success in demo mode (the
// inbox keeps an optimistic local copy there).
export async function sendDmAction(
  conversationId: string,
  body: string
): Promise<SendDmResult> {
  const text = body.trim();
  if (!text) return { ok: false, error: "Message is empty." };
  if (!supabaseConfigured) return { ok: true, id: `local-${Date.now()}` };
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sign in to send messages." };

    const msg = await sendDirectMessage(supabase, conversationId, user.id, text);
    revalidatePath("/messages");
    return { ok: true, id: msg.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't send message.",
    };
  }
}
