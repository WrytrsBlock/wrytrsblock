import { redirect } from "next/navigation";
import { TopBar } from "@/components/shell/topbar";
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
        <div className="page-constrained pb-10 pt-5 md:pt-6 animate-fade-up">
          <div className="mb-4">
            <h1 className="text-[18px] md:text-[21px] font-semibold text-white">
              Settings
            </h1>
            <p className="mt-1 text-[12.5px] text-white/60">
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
