"use server";

import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";

export type DeleteAccountResult = { ok: true } | { ok: false; error: string };

// Permanently delete the signed-in user's account. Deleting the auth user
// cascades to all app data (creator_profiles, profiles, block_members,
// messages, … are all `on delete cascade`/`set null`), so this removes the
// account cleanly. Requires the service-role key (set in the deploy env).
export async function deleteAccountAction(): Promise<DeleteAccountResult> {
  // Dev/demo mode has no real auth — treat as a successful no-op so the flow
  // is testable without touching a real account.
  if (!supabaseConfigured) return { ok: true };

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You need to be signed in." };

    const admin = createSupabaseServiceClient();
    if (!admin) {
      return {
        ok: false,
        error:
          "Account deletion isn't available right now. Please email support@wrytrsblock.com and we'll remove it.",
      };
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("deleteAccountAction: admin.deleteUser failed:", error);
      return { ok: false, error: error.message };
    }

    // The account is gone — best-effort clear of this browser's session cookies.
    // The user no longer exists, so signOut may reject; that must NOT mask the
    // successful deletion (otherwise the UI shows an error for a deleted acct).
    try {
      await supabase.auth.signOut();
    } catch {
      /* session is already invalid — ignore */
    }
    return { ok: true };
  } catch (e) {
    console.error("deleteAccountAction failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't delete your account.",
    };
  }
}
