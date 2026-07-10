"use server";

import { revalidatePath } from "next/cache";
import {
  createSupabaseServerClient,
  createSupabaseAuthedClient,
} from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { getCreatorIdByHandle } from "@/services/creator-profiles.service";
import { getBlockBySlug, listBlockMembers } from "@/services/blocks.service";
import { getProfile } from "@/services/profiles.service";
import { emailQualifiedRecipients, emailDirectRecipient } from "@/lib/notify";
import { blockJoinEmail, blockRequestEmail } from "@/lib/email-templates";
import { checkRateLimit } from "@/lib/rate-limit";

type SendInput = {
  recipientHandle: string;
  blockTitle: string;
  blockType: "collaboration" | "service" | "block_party";
  introMessage: string;
  expectedOutcome?: string;
};

export type SendResult = { ok: true } | { ok: false; error: string };
export type AcceptResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };
export type SimpleResult = { ok: true } | { ok: false; error: string };

// Authenticated client (carries the user's JWT) so auth.uid() inside the RPCs is
// the real signed-in user. Returns null if there's no session.
async function authedClient() {
  const cookieClient = createSupabaseServerClient();
  const {
    data: { user },
  } = await cookieClient.auth.getUser();
  if (!user) return { user: null, supabase: null, cookieClient };
  const {
    data: { session },
  } = await cookieClient.auth.getSession();
  const token = session?.access_token;
  if (!token) return { user, supabase: null, cookieClient };
  return { user, supabase: createSupabaseAuthedClient(token), cookieClient };
}

// Emails every OTHER existing accepted member of the Block that `joinerId`
// just joined (in-app rows already exist — see accept_block_request). Never
// throws: this runs after the join itself already succeeded.
async function notifyBlockJoin(
  supabase: ReturnType<typeof createSupabaseAuthedClient>,
  blockSlug: string,
  joinerId: string
) {
  try {
    const block = await getBlockBySlug(supabase, blockSlug);
    if (!block) return;
    const joiner = await getProfile(supabase, joinerId).catch(() => null);
    const creatorName = joiner?.display_name || joiner?.handle || "A collaborator";

    const members = await listBlockMembers(supabase, block.id);
    const recipientIds = members
      .filter((m) => m.status === "accepted" && m.user_id !== joinerId)
      .map((m) => m.user_id);

    await emailQualifiedRecipients(recipientIds, {
      blockId: block.id,
      kind: "block_member_joined",
      buildEmail: () =>
        blockJoinEmail({ creatorName, blockTitle: block.title, blockSlug: block.slug }),
    });
  } catch (e) {
    console.error("notifyBlockJoin failed:", e);
  }
}

// Send a Block Request. The SECURITY DEFINER RPC records the pending request and
// notifies the recipient. Nothing else is created until they accept.
export async function sendBlockRequestAction(
  input: SendInput
): Promise<SendResult> {
  const blockTitle = input.blockTitle?.trim();
  const introMessage = input.introMessage?.trim();
  if (!blockTitle) return { ok: false, error: "Give your Block a title." };
  if (!introMessage)
    return { ok: false, error: "Add an intro message for the creator." };
  if (!supabaseConfigured) return { ok: true };

  try {
    const { user, supabase, cookieClient } = await authedClient();
    if (!user) return { ok: false, error: "You need to be signed in." };
    if (!supabase)
      return { ok: false, error: "Your session expired — please sign in again." };

    // Block Requests double as an unsolicited-contact/email vector — cap how
    // many a single account can send per hour so it can't be used to spam
    // every creator in the marketplace.
    const rl = await checkRateLimit("send-block-request", user.id, 10, "1 h");
    if (!rl.ok) return { ok: false, error: rl.error };

    const handle = input.recipientHandle.trim().replace(/^@/, "");
    const recipientId = await getCreatorIdByHandle(cookieClient, handle).catch(
      () => null
    );
    if (!recipientId) return { ok: false, error: "Couldn't find that creator." };
    if (recipientId === user.id)
      return { ok: false, error: "You can't start a Block with yourself." };

    const { error } = await supabase.rpc("send_block_request", {
      p_recipient: recipientId,
      p_title: blockTitle,
      p_type: input.blockType,
      p_intro: introMessage,
      p_outcome: input.expectedOutcome?.trim() || null,
    });
    if (error) {
      if (error.code === "23505")
        return {
          ok: false,
          error: "You already have a pending request with this creator.",
        };
      if (error.code === "22023" || /yourself/i.test(error.message ?? ""))
        return { ok: false, error: "You can't start a Block with yourself." };
      throw error;
    }

    // Email side of the "Block Request" notification — the in-app bell row
    // for the recipient is already inserted inside send_block_request itself
    // (0022_pending_block_on_send.sql). This is best-effort: the request
    // itself has already succeeded above regardless of email delivery.
    try {
      const requester = await getProfile(supabase, user.id).catch(() => null);
      const requesterName = requester?.display_name || requester?.handle || "A creator";
      await emailDirectRecipient(recipientId, {
        kind: "block_request",
        buildEmail: () =>
          blockRequestEmail({ requesterName, blockTitle, introMessage }),
      });
    } catch (e) {
      console.error("emailDirectRecipient (block_request) failed:", e);
    }

    revalidatePath("/notifications");
    return { ok: true };
  } catch (e) {
    console.error("sendBlockRequestAction failed:", e);
    return { ok: false, error: errMessage(e, "Couldn't send the Block Request.") };
  }
}

// Accept a request → creates the Block + adds BOTH creators (accepted), seeds a
// channel, links the request, notifies the requester. Returns the Block slug.
export async function acceptBlockRequestAction(
  requestId: string
): Promise<AcceptResult> {
  if (!supabaseConfigured)
    return { ok: false, error: "Supabase not configured." };
  try {
    const { user, supabase } = await authedClient();
    if (!user) return { ok: false, error: "You need to be signed in." };
    if (!supabase)
      return { ok: false, error: "Your session expired — please sign in again." };

    const { data, error } = await supabase.rpc("accept_block_request", {
      p_request_id: requestId,
    });
    if (error) {
      if (error.code === "42501")
        return { ok: false, error: "This request isn't addressed to you." };
      if (error.code === "P0002")
        return { ok: false, error: "Request not found." };
      throw error;
    }
    const slug = typeof data === "string" ? data : String(data ?? "");

    // Email side of the "Block Join" notification — the in-app bell row for
    // every existing member was already inserted inside accept_block_request
    // itself (0029_notify_members_on_join.sql; regular users have no INSERT
    // policy on notifications, so that had to happen in the RPC). This just
    // decides who among them also gets the "<name> joined your Block" email.
    await notifyBlockJoin(supabase, slug, user.id);

    revalidatePath("/blocks");
    revalidatePath("/notifications");
    revalidatePath("/", "layout"); // surface the new Block in the sidebar
    return { ok: true, slug };
  } catch (e) {
    console.error("acceptBlockRequestAction failed:", e);
    return { ok: false, error: errMessage(e, "Couldn't accept the request.") };
  }
}

export async function declineBlockRequestAction(
  requestId: string
): Promise<SimpleResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const { user, supabase } = await authedClient();
    if (!user) return { ok: false, error: "You need to be signed in." };
    if (!supabase)
      return { ok: false, error: "Your session expired — please sign in again." };

    const { error } = await supabase.rpc("decline_block_request", {
      p_request_id: requestId,
    });
    if (error) {
      if (error.code === "42501")
        return { ok: false, error: "This request isn't addressed to you." };
      // Idempotent / forgiving: a request that's already responded to or no
      // longer exists is, for the user's purposes, already declined — never
      // surface that as an error (it was the source of spurious decline errors,
      // e.g. a double-commit from the Undo window).
      if (
        error.code === "P0002" ||
        error.code === "22023" ||
        /already|not found|does not exist|no rows/i.test(error.message ?? "")
      ) {
        revalidatePath("/notifications");
        revalidatePath("/blocks");
        return { ok: true };
      }
      throw error;
    }
    revalidatePath("/notifications");
    revalidatePath("/blocks");
    return { ok: true };
  } catch (e) {
    console.error("declineBlockRequestAction failed:", e);
    return { ok: false, error: errMessage(e, "Couldn't decline the request.") };
  }
}

function errMessage(e: unknown, fallback: string): string {
  return e instanceof Error
    ? e.message
    : e && typeof e === "object" && "message" in e
      ? String((e as { message: unknown }).message)
      : fallback;
}
