import type { SplitSheet, SplitSheetEntry, SplitSheetStatus, UUID } from "@/types";
import type { DB } from "./types";

export async function ensureSplitSheet(
  supabase: DB,
  blockId: UUID
): Promise<SplitSheet> {
  const { data: existing, error: selErr } = await supabase
    .from("split_sheets")
    .select("*")
    .eq("block_id", blockId)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing as SplitSheet;

  const { data, error } = await supabase
    .from("split_sheets")
    .insert({ block_id: blockId })
    .select("*")
    .single();
  if (error) throw error;
  return data as SplitSheet;
}

export async function getSplitSheetWithEntries(
  supabase: DB,
  blockId: UUID
): Promise<{ sheet: SplitSheet; entries: SplitSheetEntry[] } | null> {
  const { data: sheet, error } = await supabase
    .from("split_sheets")
    .select("*")
    .eq("block_id", blockId)
    .maybeSingle();
  if (error) throw error;
  if (!sheet) return null;

  const { data: entries, error: entriesErr } = await supabase
    .from("split_sheet_entries")
    .select("*")
    .eq("split_sheet_id", (sheet as SplitSheet).id)
    .order("id", { ascending: true });
  if (entriesErr) throw entriesErr;

  return { sheet: sheet as SplitSheet, entries: (entries as SplitSheetEntry[]) ?? [] };
}

export async function addSplitEntry(
  supabase: DB,
  input: { splitSheetId: UUID; userId: UUID; role: string }
): Promise<SplitSheetEntry> {
  const { data, error } = await supabase
    .from("split_sheet_entries")
    .insert({
      split_sheet_id: input.splitSheetId,
      user_id: input.userId,
      role: input.role,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SplitSheetEntry;
}

export async function updateSplitEntryPct(
  supabase: DB,
  entryId: UUID,
  patch: Partial<Pick<SplitSheetEntry, "writing_pct" | "publishing_pct">>
): Promise<SplitSheetEntry> {
  const { data, error } = await supabase
    .from("split_sheet_entries")
    .update(patch)
    .eq("id", entryId)
    .select("*")
    .single();
  if (error) throw error;
  return data as SplitSheetEntry;
}

export async function signSplitEntry(
  supabase: DB,
  entryId: UUID
): Promise<SplitSheetEntry> {
  const { data, error } = await supabase
    .from("split_sheet_entries")
    .update({ signed_at: new Date().toISOString() })
    .eq("id", entryId)
    .select("*")
    .single();
  if (error) throw error;
  return data as SplitSheetEntry;
}

export async function removeSplitEntry(supabase: DB, entryId: UUID): Promise<void> {
  const { error } = await supabase.from("split_sheet_entries").delete().eq("id", entryId);
  if (error) throw error;
}

export async function setSplitSheetStatus(
  supabase: DB,
  splitSheetId: UUID,
  status: SplitSheetStatus
): Promise<SplitSheet> {
  const { data, error } = await supabase
    .from("split_sheets")
    .update({ status })
    .eq("id", splitSheetId)
    .select("*")
    .single();
  if (error) throw error;
  return data as SplitSheet;
}
