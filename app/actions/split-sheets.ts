"use server";

import { createSupabaseServerClient, getAuthedServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { getBlockBySlug } from "@/services/blocks.service";
import { getProfile } from "@/services/profiles.service";
import {
  addSplitEntry,
  ensureSplitSheet,
  getSplitSheetWithEntries,
  removeSplitEntry,
  updateSplitEntry,
  updateSplitSheetProjectTitle,
  type SplitEntryPatch,
} from "@/services/split-sheets.service";
import { notifyBlockActivity } from "@/lib/notify";
import { splitSheetEmail } from "@/lib/email-templates";

export type SplitEntryView = {
  id: string;
  userId: string | null;
  legalName: string;
  artistName: string;
  email: string;
  phone: string;
  role: string;
  publishingCompany: string;
  pro: string;
  ipiCae: string;
  ownershipPct: number;
  notes: string;
};

export type SplitSheetView = {
  sheetId: string;
  blockTitle: string;
  projectTitle: string;
  updatedAt: string;
  entries: SplitEntryView[];
};

export type SplitResult = { ok: true } | { ok: false; error: string };

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

    return {
      sheetId: sheet.id,
      blockTitle: block.title,
      projectTitle: sheet.project_title ?? "",
      updatedAt: sheet.updated_at,
      entries: entries.map((e) => ({
        id: e.id,
        userId: e.user_id,
        legalName: e.legal_name ?? "",
        artistName: e.artist_name ?? "",
        email: e.email ?? "",
        phone: e.phone ?? "",
        role: e.role,
        publishingCompany: e.publishing_company ?? "",
        pro: e.pro ?? "",
        ipiCae: e.ipi_cae ?? "",
        ownershipPct: Number(e.ownership_pct),
        notes: e.notes ?? "",
      })),
    };
  } catch (e) {
    console.error("getSplitSheetAction failed:", e);
    return null;
  }
}

export async function addSplitEntryAction(blockSlug: string): Promise<SplitResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    const block = await getBlockBySlug(supabase, blockSlug);
    if (!block) return { ok: false, error: "Block not found." };
    const sheet = await ensureSplitSheet(supabase, block.id);

    await addSplitEntry(supabase, sheet.id);
    await notifySplitSheetChanged(blockSlug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export type SplitEntryFieldPatch = Partial<{
  legalName: string;
  artistName: string;
  email: string;
  phone: string;
  role: string;
  publishingCompany: string;
  pro: string;
  ipiCae: string;
  ownershipPct: number;
  notes: string;
}>;

export async function updateSplitEntryAction(
  blockSlug: string,
  entryId: string,
  patch: SplitEntryFieldPatch
): Promise<SplitResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    const dbPatch: SplitEntryPatch = {
      ...(patch.legalName !== undefined ? { legal_name: patch.legalName } : {}),
      ...(patch.artistName !== undefined ? { artist_name: patch.artistName } : {}),
      ...(patch.email !== undefined ? { email: patch.email } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      ...(patch.role !== undefined ? { role: patch.role } : {}),
      ...(patch.publishingCompany !== undefined
        ? { publishing_company: patch.publishingCompany }
        : {}),
      ...(patch.pro !== undefined ? { pro: patch.pro } : {}),
      ...(patch.ipiCae !== undefined ? { ipi_cae: patch.ipiCae } : {}),
      ...(patch.ownershipPct !== undefined ? { ownership_pct: patch.ownershipPct } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    };
    await updateSplitEntry(supabase, entryId, dbPatch);
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

export async function updateSplitSheetProjectTitleAction(
  blockSlug: string,
  sheetId: string,
  projectTitle: string
): Promise<SplitResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await updateSplitSheetProjectTitle(supabase, sheetId, projectTitle);
    await notifySplitSheetChanged(blockSlug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
