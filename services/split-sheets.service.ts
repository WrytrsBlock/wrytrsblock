import type { SplitSheet, SplitSheetEntry, UUID } from "@/types";
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

// A blank contributor card — filled in afterward. Not tied to a platform
// account: split sheets routinely include people (mastering engineers,
// sample writers) who aren't WrytrsBlock users, so every contact/legal field
// is free text rather than pulled from a member profile.
export async function addSplitEntry(
  supabase: DB,
  splitSheetId: UUID
): Promise<SplitSheetEntry> {
  const { data, error } = await supabase
    .from("split_sheet_entries")
    .insert({ split_sheet_id: splitSheetId })
    .select("*")
    .single();
  if (error) throw error;
  return data as SplitSheetEntry;
}

export type SplitEntryPatch = Partial<
  Pick<
    SplitSheetEntry,
    | "legal_name"
    | "artist_name"
    | "email"
    | "phone"
    | "role"
    | "publishing_company"
    | "pro"
    | "ipi_cae"
    | "ownership_pct"
    | "notes"
  >
>;

export async function updateSplitEntry(
  supabase: DB,
  entryId: UUID,
  patch: SplitEntryPatch
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

export async function removeSplitEntry(supabase: DB, entryId: UUID): Promise<void> {
  const { error } = await supabase.from("split_sheet_entries").delete().eq("id", entryId);
  if (error) throw error;
}

// Seeds one split sheet entry per given contributor instead of leaving the
// sheet empty — the caller (app/actions/split-sheets.ts) is responsible for
// sourcing the contributor list (from Songwriter) and mapping each role to
// this domain's vocabulary; this function only knows about split_sheet_entries,
// keeping the split-sheets service single-domain.
//
// Uses upsert with ignoreDuplicates against the (split_sheet_id, user_id)
// partial unique index (migration 0033) rather than a plain insert: two
// collaborators opening a brand-new Block's Splits tab at the same moment
// could both see zero entries and both call this, which would otherwise
// double-insert every contributor. The duplicate half of a race silently
// no-ops instead of erroring or leaving duplicate rows.
export async function seedSplitSheetEntriesFromContributors(
  supabase: DB,
  splitSheetId: UUID,
  contributors: { userId: UUID | null; role: string; displayName: string | null }[]
): Promise<SplitSheetEntry[]> {
  if (contributors.length === 0) return [];

  // .select() after an ignoreDuplicates upsert returns only the rows this
  // call actually inserted (Postgres ON CONFLICT DO NOTHING doesn't RETURN
  // the skipped ones) — the common, non-race case gets every seeded row back
  // without a second round-trip; the caller only needs to re-fetch in the
  // rare case where this lost the race and inserted nothing.
  const { data, error } = await supabase
    .from("split_sheet_entries")
    .upsert(
      contributors.map((c) => ({
        split_sheet_id: splitSheetId,
        user_id: c.userId,
        role: c.role,
        artist_name: c.displayName ?? "",
        ownership_pct: 0,
      })),
      { onConflict: "split_sheet_id,user_id", ignoreDuplicates: true }
    )
    .select("*");
  if (error) throw error;
  return (data as SplitSheetEntry[]) ?? [];
}

export async function updateSplitSheetProjectTitle(
  supabase: DB,
  splitSheetId: UUID,
  projectTitle: string
): Promise<SplitSheet> {
  const { data, error } = await supabase
    .from("split_sheets")
    .update({ project_title: projectTitle })
    .eq("id", splitSheetId)
    .select("*")
    .single();
  if (error) throw error;
  return data as SplitSheet;
}
