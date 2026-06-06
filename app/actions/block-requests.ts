"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { slugify } from "@/lib/cn";
import { addBlockMember, createBlock } from "@/services/blocks.service";
import { createChannel, sendMessage } from "@/services/messages.service";
import {
  getCreatorIdByHandle,
  getCreatorProfileById,
} from "@/services/creator-profiles.service";
import {
  createWorkspace,
  listWorkspacesForUser,
} from "@/services/workspaces.service";
import {
  createBlockRequest,
  getBlockRequest,
  setBlockRequestResponse,
} from "@/services/block-requests.service";

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

// Send a Block Request. Nothing is created yet — this only records the request
// and surfaces it to the recipient, who Accepts (creates the Block) or Declines.
export async function sendBlockRequestAction(
  input: SendInput
): Promise<SendResult> {
  const blockTitle = input.blockTitle?.trim();
  const introMessage = input.introMessage?.trim();
  if (!blockTitle) return { ok: false, error: "Give your Block a title." };
  if (!introMessage)
    return { ok: false, error: "Add an intro message for the creator." };

  // Demo mode (no Supabase): no persistence, but the flow succeeds locally.
  if (!supabaseConfigured) return { ok: true };

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You need to be signed in." };

    const handle = input.recipientHandle.trim().replace(/^@/, "");
    const recipientId = await getCreatorIdByHandle(supabase, handle).catch(
      () => null
    );
    if (!recipientId)
      return { ok: false, error: "Couldn't find that creator." };
    if (recipientId === user.id)
      return { ok: false, error: "You can't start a Block with yourself." };

    // Snapshot the requester for the recipient's inbox.
    const me = await getCreatorProfileById(supabase, user.id).catch(() => null);
    const requesterName =
      me?.display_name ??
      (user.user_metadata?.display_name as string) ??
      user.email?.split("@")[0] ??
      "A creator";
    const requesterHandle = me?.handle ?? null;

    await createBlockRequest(supabase, {
      requester_id: user.id,
      recipient_id: recipientId,
      requester_name: requesterName,
      requester_handle: requesterHandle,
      block_title: blockTitle,
      block_type: input.blockType,
      intro_message: introMessage,
      expected_outcome: input.expectedOutcome?.trim() || null,
    });

    revalidatePath("/notifications");
    return { ok: true };
  } catch (e) {
    console.error("sendBlockRequestAction failed:", e);
    return {
      ok: false,
      error: errMessage(e, "Couldn't send the Block Request."),
    };
  }
}

// Accept a request: create the Block, add BOTH creators as members (so chat is
// unlocked), link the request, and return the slug to route into the workspace.
export async function acceptBlockRequestAction(
  requestId: string
): Promise<AcceptResult> {
  if (!supabaseConfigured) return { ok: false, error: "Supabase not configured." };

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You need to be signed in." };

    const req = await getBlockRequest(supabase, requestId);
    if (!req) return { ok: false, error: "Request not found." };
    if (req.recipient_id !== user.id)
      return { ok: false, error: "This request isn't addressed to you." };
    if (req.status !== "pending")
      return { ok: false, error: `Request already ${req.status}.` };

    // Resolve the recipient's workspace (RLS: created_by must = auth.uid()).
    const workspaceId = await ensureWorkspace();
    if (!workspaceId)
      return { ok: false, error: "Couldn't resolve a workspace." };

    const slug = slugify(req.block_title);
    // Block Party requests get a minimal default event payload (MVP: no
    // scheduling/ticketing yet) so the Party card renders cleanly.
    const party =
      req.block_type === "block_party"
        ? {
            category: "Networking" as const,
            startsAt: "",
            status: "upcoming" as const,
            access: "invite" as const,
            chatEnabled: true,
            interested: 0,
          }
        : null;
    const base = {
      workspace_id: workspaceId,
      title: req.block_title,
      tagline: req.intro_message,
      block_type: req.block_type,
      party,
      created_by: user.id, // recipient creates → satisfies blocks-insert RLS
      lead_id: req.requester_id, // the requester initiated the collaboration
    };
    const block = await createBlock(supabase, { ...base, slug }).catch(() =>
      createBlock(supabase, {
        ...base,
        slug: `${slug}-${Date.now().toString(36).slice(-4)}`,
      })
    );

    // Add the recipient first (passes RLS via user_id = auth.uid()), which makes
    // them a member so the second insert passes via is_block_member().
    await addBlockMember(supabase, block.id, user.id, "collaborator", {
      status: "accepted",
    });
    await addBlockMember(supabase, block.id, req.requester_id, "lead", {
      status: "accepted",
    });

    // Seed the Block chat with the request context (best-effort: chat seeding
    // must never block the acceptance itself). Messages are authored by the
    // accepter — the messages-insert RLS requires author_id = auth.uid() — so
    // the intro is attributed to the requester in-text.
    try {
      const channel = await createChannel(supabase, {
        workspace_id: workspaceId,
        block_id: block.id,
        name: "General",
        kind: "public",
      });
      await sendMessage(supabase, {
        channel_id: channel.id,
        body: "Block Request accepted. Collaboration started.",
      });
      const requesterLabel =
        req.requester_name ?? req.requester_handle ?? "The requester";
      await sendMessage(supabase, {
        channel_id: channel.id,
        body: `${requesterLabel} wrote:\n${req.intro_message}`,
      });
      if (req.expected_outcome) {
        await sendMessage(supabase, {
          channel_id: channel.id,
          body: `Goal: ${req.expected_outcome}`,
        });
      }
    } catch (chatErr) {
      console.error("Block chat seeding failed (non-fatal):", chatErr);
    }

    await setBlockRequestResponse(supabase, req.id, "accepted", block.id);

    revalidatePath("/blocks");
    revalidatePath("/notifications");
    return { ok: true, slug: block.slug };
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
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You need to be signed in." };

    const req = await getBlockRequest(supabase, requestId);
    if (!req) return { ok: false, error: "Request not found." };
    if (req.recipient_id !== user.id)
      return { ok: false, error: "This request isn't addressed to you." };

    await setBlockRequestResponse(supabase, req.id, "declined", null);
    revalidatePath("/notifications");
    return { ok: true };
  } catch (e) {
    console.error("declineBlockRequestAction failed:", e);
    return { ok: false, error: errMessage(e, "Couldn't decline the request.") };
  }
}

// ── helpers ────────────────────────────────────────────────────────────────

async function ensureWorkspace(): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const existing = await listWorkspacesForUser(supabase, user.id);
  if (existing.length > 0) return existing[0].id;
  const base =
    (user.user_metadata?.display_name as string) ??
    user.email?.split("@")[0] ??
    "studio";
  const ws = await createWorkspace(supabase, {
    name: `${base}'s Studio`,
    slug: `${slugify(base)}-${user.id.slice(0, 6)}`,
    description: "Personal workspace",
    created_by: user.id,
  });
  return ws.id;
}

function errMessage(e: unknown, fallback: string): string {
  return e instanceof Error
    ? e.message
    : e && typeof e === "object" && "message" in e
      ? String((e as { message: unknown }).message)
      : fallback;
}
