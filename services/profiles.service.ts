import type { Profile, UUID } from "@/types";
import type { DB } from "./types";

const SELECT =
  "id, display_name, handle, role, avatar_url, bio, created_at, updated_at";

export async function getProfile(
  supabase: DB,
  userId: UUID
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(SELECT)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function getProfiles(
  supabase: DB,
  userIds: UUID[]
): Promise<Profile[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select(SELECT)
    .in("id", userIds);
  if (error) throw error;
  return (data as Profile[]) ?? [];
}

export async function updateProfile(
  supabase: DB,
  userId: UUID,
  patch: Partial<
    Pick<Profile, "display_name" | "handle" | "role" | "avatar_url" | "bio">
  >
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Profile;
}
