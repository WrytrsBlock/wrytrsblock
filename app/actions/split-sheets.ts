"use server";

import { createSupabaseServerClient, getAuthedServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { getBlockBySlug, listBlockMembers } from "@/services/blocks.service";
import { getProfile } from "@/services/profiles.service";
import {
  addSplitEntry,
  ensureSplitSheet,
  getSplitSheetWithEntries,
  removeSplitEntry,
  setSplitSheetStatus,
  signSplitEntry,
  updateSplitEntryPct,
} from "@/services/split-sheets.service";
import { notifyBlockActivity } from "@/lib/notify";
import { splitSheetEmail } from "@/lib/email-templates";
import type { SplitSheetStatus } from "@/types";

export type SplitEntryView = {
  id: string;
  userId: string | null;
  role: string;
  writing: number;
  publishing: number;
  signed: boolean;
  name: string;
  avatar: string | null;
};

export type SplitMemberView = { id: string; name: string; avatar: string | null; role: string };

export type SplitSheetView = {
  sheetId: string;
  status: SplitSheetStatus;
  entries: SplitEntryView[];
  // Every accepted Block member (not just candidates) — the client derives
  // "who's not on the sheet yet" itself, same as it does for the demo/local
  // data, so add/remove stay in sync without a refetch.
  members: SplitMemberView[];
};

export type SplitResult = { ok: true } | { ok: false; error: string };

function avatarFor(id: string) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${id}&backgroundColor=transparent`;
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

// Notify every other accepted member (in-app + email) that the split sheet on
// this Block changed. Best-effort: never surfaces an error to the caller —
// the split sheet write already succeeded by the time this runs.
async function notifySplitSheetChanged(blockSlug: string) {
  try {
    const { user, supabase } = await getAuthedServerClient();
    if (!user || !supabase) return;

    const block = await getBlockBySlug(supabase, blockSlug);
    if (!block) return;
    const actor = await getProfile(supabase, user.id).catch(() => null);
    const actorName = actor?.display_name || actor?.handle || "A collaborator";

    await notifyBlockActivity(supabase, {
      blockId: block.id,
      kind: "split_sheet_updated",
      title: "Split Sheet Updated",
      body: `${actorName} updated the split sheet for "${block.title}".`,
      link: `/blocks/${blockSlug}?tab=splits`,
      buildEmail: () =>
        splitSheetEmail({
          blockTitle: block.title,
          changedByName: actorName,
          blockSlug,
        }),
    });
  } catch (e) {
    console.error("notifySplitSheetChanged failed:", e);
  }
}

export async function getSplitSheetAction(
  blockSlug: string
): Promise<SplitSheetView | null> {
  if (!supabaseConfigured) return null;
  try {
    const supabase = createSupabaseServerClient();
    const block = await getBlockBySlug(supabase, blockSlug);
    if (!block) return null;

    const sheet = await ensureSplitSheet(supabase, block.id);
    const withEntries = await getSplitSheetWithEntries(supabase, block.id);
    const entries = withEntries?.entries ?? [];

    const members = await listBlockMembers(supabase, block.id);
    const profileById = new Map(
      members.map((m) => [
        m.user_id,
        {
          name: m.profile?.display_name || m.profile?.handle || "Member",
          avatar: m.profile?.avatar_url ?? avatarFor(m.user_id),
        },
      ])
    );

    const memberViews: SplitMemberView[] = members.map((m) => ({
      id: m.user_id,
      name: profileById.get(m.user_id)?.name ?? "Member",
      avatar: profileById.get(m.user_id)?.avatar ?? null,
      role: m.profile?.role || "Contributor",
    }));

    return {
      sheetId: sheet.id,
      status: sheet.status,
      entries: entries.map((e) => ({
        id: e.id,
        userId: e.user_id,
        role: e.role,
        writing: Number(e.writing_pct),
        publishing: Number(e.publishing_pct),
        signed: !!e.signed_at,
        name: (e.user_id && profileById.get(e.user_id)?.name) || "Member",
        avatar: (e.user_id && profileById.get(e.user_id)?.avatar) ?? null,
      })),
      members: memberViews,
    };
  } catch (e) {
    console.error("getSplitSheetAction failed:", e);
    return null;
  }
}

export async function addSplitEntryAction(
  blockSlug: string,
  memberId: string
): Promise<SplitResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    const block = await getBlockBySlug(supabase, blockSlug);
    if (!block) return { ok: false, error: "Block not found." };
    const sheet = await ensureSplitSheet(supabase, block.id);
    const members = await listBlockMembers(supabase, block.id);
    const member = members.find((m) => m.user_id === memberId);

    await addSplitEntry(supabase, {
      splitSheetId: sheet.id,
      userId: memberId,
      role: member?.profile?.role || "Contributor",
    });
    await notifySplitSheetChanged(blockSlug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function updateSplitEntryPctAction(
  blockSlug: string,
  entryId: string,
  patch: { writing?: number; publishing?: number }
): Promise<SplitResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await updateSplitEntryPct(supabase, entryId, {
      ...(patch.writing !== undefined ? { writing_pct: patch.writing } : {}),
      ...(patch.publishing !== undefined ? { publishing_pct: patch.publishing } : {}),
    });
    await notifySplitSheetChanged(blockSlug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function removeSplitEntryAction(
  blockSlug: string,
  entryId: string
): Promise<SplitResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await removeSplitEntry(supabase, entryId);
    await notifySplitSheetChanged(blockSlug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function signSplitEntryAction(
  blockSlug: string,
  entryId: string
): Promise<SplitResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await signSplitEntry(supabase, entryId);
    await notifySplitSheetChanged(blockSlug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function setSplitSheetStatusAction(
  blockSlug: string,
  sheetId: string,
  status: SplitSheetStatus
): Promise<SplitResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await setSplitSheetStatus(supabase, sheetId, status);
    await notifySplitSheetChanged(blockSlug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
