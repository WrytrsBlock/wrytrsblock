import type { CreatorProfileRow, UUID } from "@/types";
import type { DB } from "./types";

// All published creators, ranked for discovery. Client-side search/filter in the
// marketplace refines this list; optional server filters narrow large datasets.
export async function listCreatorProfiles(
  supabase: DB,
  opts?: { types?: string[]; country?: string; search?: string; limit?: number }
): Promise<CreatorProfileRow[]> {
  let q = supabase
    .from("creator_profiles")
    .select("*")
    .eq("is_published", true)
    .order("block_score", { ascending: false });

  if (opts?.types?.length) q = q.overlaps("creator_types", opts.types);
  if (opts?.country) q = q.ilike("country", opts.country);
  if (opts?.search) {
    const s = opts.search.replace(/[%,]/g, " ").trim();
    q = q.or(
      `display_name.ilike.%${s}%,handle.ilike.%${s}%,tagline.ilike.%${s}%`
    );
  }
  if (opts?.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data as CreatorProfileRow[]) ?? [];
}

// "Total registered creators" for the admin new-signup notification — counts
// published, marketplace-visible creators (matches what listCreatorProfiles
// surfaces), not every raw auth signup (many never finish onboarding).
export async function countPublishedCreatorProfiles(supabase: DB): Promise<number> {
  const { count, error } = await supabase
    .from("creator_profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);
  if (error) throw error;
  return count ?? 0;
}

// Atomically claims every published creator whose profile turned 24h old and
// hasn't gotten the follow-up email yet, in one UPDATE ... WHERE
// follow_up_sent_at IS NULL ... RETURNING statement. This is what makes the
// cron job safe under overlapping runs: Postgres locks matching rows for the
// duration of the UPDATE, so if two invocations race, the second one's WHERE
// clause re-evaluates after the first commits and no longer matches — it can
// only ever claim a row once. Must be called with a service-role client
// (bypasses RLS; this runs with no signed-in user).
export async function claimDueFollowUpCreators(
  supabase: DB,
  cutoffIso: string
): Promise<Pick<CreatorProfileRow, "id" | "display_name">[]> {
  const { data, error } = await supabase
    .from("creator_profiles")
    .update({ follow_up_sent_at: new Date().toISOString() })
    .eq("is_published", true)
    .is("follow_up_sent_at", null)
    .lte("created_at", cutoffIso)
    .select("id, display_name");
  if (error) throw error;
  return (data as Pick<CreatorProfileRow, "id" | "display_name">[]) ?? [];
}

export async function getCreatorProfileByHandle(
  supabase: DB,
  handle: string
): Promise<CreatorProfileRow | null> {
  const { data, error } = await supabase
    .from("creator_profiles")
    .select("*")
    .ilike("handle", handle)
    .maybeSingle();
  if (error) throw error;
  return (data as CreatorProfileRow | null) ?? null;
}

// Resolve a marketplace @handle to a user id (creator_profiles first, then the
// base profiles.handle) — used when inviting a creator into a Block.
export async function getCreatorIdByHandle(
  supabase: DB,
  handle: string
): Promise<UUID | null> {
  const { data: cp } = await supabase
    .from("creator_profiles")
    .select("id")
    .ilike("handle", handle)
    .maybeSingle();
  if (cp?.id) return cp.id as UUID;

  const { data: p } = await supabase
    .from("profiles")
    .select("id")
    .ilike("handle", handle)
    .maybeSingle();
  return (p?.id as UUID) ?? null;
}

export async function getCreatorProfileById(
  supabase: DB,
  id: UUID
): Promise<CreatorProfileRow | null> {
  const { data, error } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as CreatorProfileRow | null) ?? null;
}

// Create or update the signed-in creator's marketplace profile.
export async function upsertCreatorProfile(
  supabase: DB,
  row: Partial<CreatorProfileRow> & { id: UUID }
): Promise<CreatorProfileRow> {
  const { data, error } = await supabase
    .from("creator_profiles")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as CreatorProfileRow;
}

// ---------- Saved creators ----------

export async function listSavedCreatorIds(
  supabase: DB,
  userId: UUID
): Promise<string[]> {
  const { data, error } = await supabase
    .from("saved_creators")
    .select("creator_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r: { creator_id: string }) => r.creator_id);
}

export async function saveCreator(
  supabase: DB,
  userId: UUID,
  creatorId: UUID
): Promise<void> {
  const { error } = await supabase
    .from("saved_creators")
    .upsert(
      { user_id: userId, creator_id: creatorId },
      { onConflict: "user_id,creator_id" }
    );
  if (error) throw error;
}

export async function unsaveCreator(
  supabase: DB,
  userId: UUID,
  creatorId: UUID
): Promise<void> {
  const { error } = await supabase
    .from("saved_creators")
    .delete()
    .eq("user_id", userId)
    .eq("creator_id", creatorId);
  if (error) throw error;
}
