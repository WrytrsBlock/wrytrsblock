import { redirect } from "next/navigation";
import { TopBar } from "@/components/shell/topbar";
import { SectionLabel } from "@/components/ui/primitives";
import { SettingsView } from "@/components/settings/settings-view";
import { getCurrentProfile } from "@/lib/data";
import { supabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");

  // Best-effort: the real account email for the Account section.
  let email = "";
  if (supabaseConfigured) {
    try {
      const supabase = createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      email = user?.email ?? "";
    } catch {
      email = "";
    }
  }

  return (
    <>
      <TopBar crumbs={[{ label: "The CR8TV Collectv" }, { label: "Settings" }]} />
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 sm:px-6 md:px-8 py-8 max-w-[880px] w-full animate-fade-up">
          <div className="mb-7">
            <SectionLabel>Account</SectionLabel>
            <h1 className="mt-2 font-display text-4xl text-ink tracking-tight">
              Settings
            </h1>
            <p className="text-[13px] text-muted mt-1.5">
              Manage your account, notifications, privacy, Featured Content, and
              the legal basics.
            </p>
          </div>

          <SettingsView email={email} />
        </div>
      </div>
    </>
  );
}
