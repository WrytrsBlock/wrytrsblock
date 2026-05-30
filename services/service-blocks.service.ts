// Service Block details — persistence layer. Targets the `service_details`
// table (keyed by block_id). Swap the table name here if you later split this
// into a dedicated `block_services` table.

import type { ServiceDetailRow, UUID } from "@/types";
import type { DB } from "./types";

const TABLE = "service_details";

export async function getServiceDetails(
  supabase: DB,
  blockId: UUID
): Promise<ServiceDetailRow | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("block_id", blockId)
    .maybeSingle();
  if (error) throw error;
  return (data as ServiceDetailRow | null) ?? null;
}

export async function upsertServiceDetails(
  supabase: DB,
  blockId: UUID,
  input: Partial<Omit<ServiceDetailRow, "block_id">>
): Promise<ServiceDetailRow> {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ block_id: blockId, ...input }, { onConflict: "block_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as ServiceDetailRow;
}
