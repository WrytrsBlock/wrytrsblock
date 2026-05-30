import type { ActivityEventRow, ActivityKind, UUID } from "@/types";
import type { DB } from "./types";

export async function listActivityForBlock(
  supabase: DB,
  blockId: UUID,
  limit = 30
): Promise<ActivityEventRow[]> {
  const { data, error } = await supabase
    .from("activity_events")
    .select("*")
    .eq("block_id", blockId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ActivityEventRow[]) ?? [];
}

export async function logActivity(
  supabase: DB,
  input: {
    block_id?: UUID;
    workspace_id?: UUID;
    kind: ActivityKind;
    text?: string;
    target_id?: UUID;
    target_kind?: string;
  }
) {
  const { error } = await supabase.from("activity_events").insert(input);
  if (error) throw error;
}
